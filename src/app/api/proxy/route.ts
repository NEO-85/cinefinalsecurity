import { NextRequest, NextResponse } from "next/server";
import { decodeSessionToken, decryptUrl, encryptUrl } from "@/lib/crypto";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const HEADERS_TO_STRIP = new Set([
  "content-encoding", "transfer-encoding", "connection",
  "keep-alive", "x-frame-options", "content-length",
]);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/** Resolve a relative path against a base URL */
function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return base + "/" + relative;
  }
}

/** Get the origin + path prefix of a URL (for same-domain detection) */
function getOrigin(url: string): string {
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return "";
  }
}

/**
 * Rewrite all URLs in an m3u8 playlist to go through our proxy.
 * Handles: segment URLs, #EXT-X-KEY URI, #EXT-X-MAP URI,
 * absolute URLs, relative URLs, cross-domain URLs.
 */
function rewriteM3u8(content: string, baseUrl: string, sid: string, sv: number = 0): string {
  const baseOrigin = getOrigin(baseUrl);
  const lines = content.split("\n");

  return lines
    .map((line) => {
      const trimmed = line.trim();

      // Empty lines
      if (!trimmed) return line;

      // Tag lines that might contain URI="..."
      if (trimmed.startsWith("#")) {
        if (trimmed.includes('URI="')) {
          return trimmed.replace(
            /URI="([^"]+)"/g,
            (_match: string, uri: string) => {
              const proxyRef = makeProxyRef(uri, baseUrl, baseOrigin, sid, sv);
              return `URI="${proxyRef}"`;
            }
          );
        }
        // Some m3u8 use URI='...' (single quotes) — handle that too
        if (trimmed.includes("URI='")) {
          return trimmed.replace(
            /URI='([^']+)'/g,
            (_match: string, uri: string) => {
              const proxyRef = makeProxyRef(uri, baseUrl, baseOrigin, sid, sv);
              return `URI="${proxyRef}"`;
            }
          );
        }
        return line;
      }

      // Non-tag line = segment or playlist URL
      if (trimmed.length > 0 && !trimmed.startsWith("#")) {
        return makeProxyRef(trimmed, baseUrl, baseOrigin, sid, sv);
      }

      return line;
    })
    .join("\n");
}

/**
 * Create a proxy reference for a URL found in m3u8.
 * - Same domain relative → /api/proxy?sid=X&p=path
 * - Same domain absolute → extract path → /api/proxy?sid=X&p=path
 * - Cross-domain absolute → encrypt full URL → /api/proxy?sid=X&u=encrypted
 */
function makeProxyRef(
  url: string,
  baseUrl: string,
  baseOrigin: string,
  sid: string,
  sv: number = 0
): string {
  // Already a relative path
  if (!url.startsWith("http")) {
    const abs = resolveUrl(baseUrl, url);
    try {
      const u = new URL(abs);
      return `/api/proxy?sid=${encodeURIComponent(sid)}&sv=${sv}&p=${encodeURIComponent(u.pathname + u.search)}`;
    } catch {
      return `/api/proxy?sid=${encodeURIComponent(sid)}&sv=${sv}&p=${encodeURIComponent(url)}`;
    }
  }

  // Absolute URL — check if same domain
  const urlOrigin = getOrigin(url);
  if (urlOrigin === baseOrigin) {
    try {
      const u = new URL(url);
      return `/api/proxy?sid=${encodeURIComponent(sid)}&sv=${sv}&p=${encodeURIComponent(u.pathname + u.search)}`;
    } catch {
      return `/api/proxy?sid=${encodeURIComponent(sid)}&sv=${sv}&p=${encodeURIComponent(url)}`;
    }
  }

  // Cross-domain
  try {
    const u = new URL(url);
    return `/api/proxy?sid=${encodeURIComponent(sid)}&sv=${sv}&p=${encodeURIComponent(u.pathname + u.search)}&_h=${encodeURIComponent(urlOrigin)}`;
  } catch {
    return url;
  }
}

/** Forward headers from the upstream response, filtering out hop-by-hop headers */
function filterHeaders(upstream: Headers): Headers {
  const h = new Headers();
  upstream.forEach((value, key) => {
    if (!HEADERS_TO_STRIP.has(key.toLowerCase())) {
      h.set(key, value);
    }
  });
  return h;
}

/** Fetch with timeout and retry */
async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  retries = 1
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok && retries > 0) {
      return fetchWithRetry(url, opts, retries - 1);
    }
    return res;
  } catch (e) {
    clearTimeout(timer);
    if (retries > 0) return fetchWithRetry(url, opts, retries - 1);
    throw e;
  }
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const sid = sp.get("sid");
  const p = sp.get("p"); // relative path
  const u = sp.get("u"); // encrypted absolute URL (for cross-domain)
  const h = sp.get("_h"); // host override (for cross-domain refs)
  const sv = parseInt(sp.get("sv") || "0"); // server index

  if (!sid) {
    return new NextResponse("Missing session", { status: 400 });
  }

  // 1. Decode session token
  const session = await decodeSessionToken(sid);
  if (!session) {
    return new NextResponse("Invalid or expired session", { status: 403 });
  }

  // 1b. Pick the requested server URL
  const serverIdx = Math.min(sv, session.servers.length - 1);
  const activeBase = session.servers[serverIdx] || session.baseUrl;

  // 2. Determine what URL to fetch
  let fetchUrl: string;
  let refererUrl: string;

  if (u) {
    // Encrypted cross-domain URL
    const decrypted = await decryptUrl(u);
    if (!decrypted) {
      return new NextResponse("Invalid URL token", { status: 403 });
    }
    fetchUrl = decrypted;
    refererUrl = decrypted;
  } else if (p) {
    // Relative path — resolve against active server URL
    const host = h ? decodeURIComponent(h) : "";
    fetchUrl = resolveUrl(
      h ? activeBase.replace(getOrigin(activeBase), host) : activeBase,
      decodeURIComponent(p)
    );
    refererUrl = activeBase;
  } else {
    // No path — fetch the active server URL (master m3u8)
    fetchUrl = activeBase;
    refererUrl = activeBase;
  }

  // 3. Fetch from upstream with failover
  const fetchHeaders: Record<string, string> = {
    "User-Agent": UA,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": refererUrl,
    "Referer": refererUrl + "/",
  };

  let response: Response;
  let usedServer = 0;

  try {
    response = await fetchWithRetry(fetchUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });
  } catch {
    // Failover to backup servers
    for (let i = 1; i < session.servers.length; i++) {
      try {
        const fallbackBase = session.servers[i];
        const fallbackUrl = p
          ? resolveUrl(fallbackBase, decodeURIComponent(p))
          : fallbackBase;
        const fbHeaders = { ...fetchHeaders, Referer: fallbackBase + "/" };
        response = await fetchWithRetry(fallbackUrl, {
          headers: fbHeaders,
          redirect: "follow",
        });
        usedServer = i;
        break;
      } catch {
        continue;
      }
    }
    if (!response) {
      return new NextResponse("All servers failed", { status: 502 });
    }
  }

  // 4. Check if it's an m3u8 — if so, rewrite URLs
  const contentType = response.headers.get("Content-Type") || "";
  const isM3u8 =
    contentType.includes("mpegurl") ||
    contentType.includes("x-mpegURL") ||
    contentType.includes("vnd.apple.mpegurl");

  if (isM3u8) {
    const body = await response.text();
    // Determine the effective base URL for this specific m3u8
    const effectiveBase = p
      ? resolveUrl(
          h ? activeBase.replace(getOrigin(activeBase), decodeURIComponent(h!)) : activeBase,
          decodeURIComponent(p)
        ).substring(0, fetchUrl.lastIndexOf("/") + 1)
      : activeBase.substring(0, activeBase.lastIndexOf("/") + 1);

    const rewritten = rewriteM3u8(body, effectiveBase, sid, serverIdx);

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // 5. For non-m3u8 (segments, keys, etc.) — stream directly
  const headers = filterHeaders(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "public, max-age=86400");

  // For key files, ensure correct content type
  if (
    contentType.includes("octet-stream") &&
    (p || u) &&
    fetchUrl.includes("key")
  ) {
    headers.set("Content-Type", "application/octet-stream");
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}

// Handle CORS preflight
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
