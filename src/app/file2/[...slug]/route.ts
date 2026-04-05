import { NextRequest, NextResponse } from "next/server";
import { decodeSessionToken } from "@/lib/crypto";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const HEADERS_TO_STRIP = new Set([
  "content-encoding", "transfer-encoding", "connection",
  "keep-alive", "x-frame-options", "content-length",
]);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function resolveUrl(base: string, relative: string): string {
  try { return new URL(relative, base).href; } catch { return base + "/" + relative; }
}

function getOrigin(url: string): string {
  try { return new URL(url).origin; } catch { return ""; }
}

function filterHeaders(upstream: Headers): Headers {
  const h = new Headers();
  upstream.forEach((value, key) => {
    if (!HEADERS_TO_STRIP.has(key.toLowerCase())) h.set(key, value);
  });
  return h;
}

async function fetchWithRetry(url: string, opts: RequestInit, retries = 1): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok && retries > 0) return fetchWithRetry(url, opts, retries - 1);
    return res;
  } catch {
    clearTimeout(timer);
    if (retries > 0) return fetchWithRetry(url, opts, retries - 1);
    throw new Error("fetch_failed");
  }
}

function rewriteM3u8(content: string, baseUrl: string, tokenSlug: string, svParam: string = ""): string {
  const baseOrigin = getOrigin(baseUrl);
  const prefix = "/file2/" + tokenSlug;
  const lines = content.split("\n");

  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith("#")) {
      if (trimmed.includes('URI="')) {
        return trimmed.replace(/URI="([^"]+)"/g, (_m: string, uri: string) => {
          return `URI="${rewriteRef(uri, baseUrl, baseOrigin, prefix, svParam)}"`;
        });
      }
      if (trimmed.includes("URI='")) {
        return trimmed.replace(/URI='([^']+)'/g, (_m: string, uri: string) => {
          return `URI="${rewriteRef(uri, baseUrl, baseOrigin, prefix, svParam)}"`;
        });
      }
      return line;
    }

    if (trimmed.length > 0 && !trimmed.startsWith("#")) {
      return rewriteRef(trimmed, baseUrl, baseOrigin, prefix, svParam);
    }
    return line;
  }).join("\n");
}

function rewriteRef(url: string, baseUrl: string, baseOrigin: string, prefix: string, svParam: string = ""): string {
  if (!url.startsWith("http")) {
    const abs = resolveUrl(baseUrl, url);
    try {
      const u = new URL(abs);
      return prefix + "/" + u.pathname + u.search + svParam;
    } catch {
      return prefix + "/" + url + svParam;
    }
  }

  const urlOrigin = getOrigin(url);
  try {
    const u = new URL(url);
    if (urlOrigin === baseOrigin) {
      return prefix + "/" + u.pathname + u.search + svParam;
    }
    return prefix + "/" + u.pathname + u.search + "?_h=" + encodeURIComponent(urlOrigin) + svParam.replace("?", "&");
  } catch {
    return url;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  if (!slug || slug.length < 1) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const sessionToken = slug[0];
  const restPath = slug.slice(1).join("/");
  const sp = new URL(request.url).searchParams;
  const svIdx = parseInt(sp.get("_sv") || "0");

  const session = await decodeSessionToken(sessionToken);
  if (!session) {
    return new NextResponse("Invalid or expired session", { status: 403 });
  }

  const serverIndex = Math.min(svIdx, session.servers.length - 1);
  const activeBase = session.servers[serverIndex] || session.baseUrl;

  let fetchUrl: string;
  let refererUrl: string;

  if (restPath) {
    fetchUrl = resolveUrl(activeBase, restPath);
    refererUrl = activeBase;
  } else {
    fetchUrl = activeBase;
    refererUrl = activeBase;
  }

  const fetchHeaders: Record<string, string> = {
    "User-Agent": UA,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": refererUrl,
    "Referer": refererUrl + "/",
  };

  let response: Response;

  try {
    response = await fetchWithRetry(fetchUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });
  } catch {
    let found = false;
    for (let i = 1; i < session.servers.length; i++) {
      try {
        const fallbackBase = session.servers[i];
        const fallbackUrl = restPath
          ? resolveUrl(fallbackBase, restPath)
          : fallbackBase;
        const fbHeaders = { ...fetchHeaders, Referer: fallbackBase + "/" };
        response = await fetchWithRetry(fallbackUrl, {
          headers: fbHeaders,
          redirect: "follow",
        });
        found = true;
        break;
      } catch { continue; }
    }
    if (!found) {
      return new NextResponse("All servers failed", { status: 502 });
    }
  }

  const contentType = response.headers.get("Content-Type") || "";
  const isM3u8 =
    contentType.includes("mpegurl") ||
    contentType.includes("x-mpegURL") ||
    contentType.includes("vnd.apple.mpegurl");

  if (isM3u8) {
    const body = await response.text();
    const effectiveBase = restPath
      ? resolveUrl(activeBase, restPath)
          .substring(0, resolveUrl(activeBase, restPath).lastIndexOf("/") + 1)
      : activeBase.substring(0, activeBase.lastIndexOf("/") + 1);

    const tokenSlug = sessionToken;
    const svParam = svIdx > 0 ? "?_sv=" + svIdx : "";
    const rewritten = rewriteM3u8(body, effectiveBase, tokenSlug, svParam);

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const headers = filterHeaders(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "public, max-age=86400");
  if (contentType.includes("octet-stream") && fetchUrl.includes("key")) {
    headers.set("Content-Type", "application/octet-stream");
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    if (!slug || slug.length < 1) {
      return new NextResponse(null, { status: 400, headers: corsHeaders() });
    }
    const token = slug[0];
    const session = await decodeSessionToken(token);
    if (!session) {
      return new NextResponse(null, { status: 403, headers: corsHeaders() });
    }
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500, headers: corsHeaders() });
  }
}

function corsHeaders(): Record<string, string> {
  return { "Access-Control-Allow-Origin": "*" };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}
