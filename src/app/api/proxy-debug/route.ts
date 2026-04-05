import { NextRequest, NextResponse } from "next/server";
import { resolveStreams } from "@/lib/player";
import { decodeSessionToken, createSessionToken } from "@/lib/crypto";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/**
 * GET /api/proxy-debug?id=533535&type=movie
 *
 * Tests the EXACT proxy flow step by step:
 * 1. Resolve streams (get stream URLs)
 * 2. Create session token
 * 3. Decode token (same as proxy)
 * 4. Fetch the stream URL directly (same as proxy)
 * 5. Check if response is m3u8
 */
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const id = sp.get("id") || "";
  const type = sp.get("type") || "movie";
  const season = sp.get("s") || null;
  const episode = sp.get("e") || null;
  const sv = parseInt(sp.get("_sv") || "0");

  const steps: { step: string; ok: boolean; detail: string }[] = [];

  // Step 1: Resolve streams
  let servers;
  try {
    servers = await resolveStreams(id, type, season, episode);
    steps.push({ step: "resolve_streams", ok: servers.length > 0, detail: "Found " + servers.length + " servers: " + servers.map(s => s.name + "=" + s.url).join(" | ") });
  } catch (e) {
    steps.push({ step: "resolve_streams", ok: false, detail: String(e) });
    return NextResponse.json({ steps });
  }

  if (servers.length === 0) {
    return NextResponse.json({ steps });
  }

  // Step 2: Create session token
  let token = "";
  try {
    const allUrls = servers.map(s => s.url);
    token = await createSessionToken({ baseUrl: servers[0].url, servers: allUrls });
    steps.push({ step: "create_token", ok: true, detail: "Token length: " + token.length + ", preview: " + token.substring(0, 30) + "..." });
  } catch (e) {
    steps.push({ step: "create_token", ok: false, detail: String(e) });
    return NextResponse.json({ steps });
  }

  // Step 3: Decode token
  let session;
  try {
    session = await decodeSessionToken(token);
    steps.push({ step: "decode_token", ok: !!session, detail: session ? "Servers in token: " + session.servers.length + ", exp: " + session.exp : "Failed to decode" });
  } catch (e) {
    steps.push({ step: "decode_token", ok: false, detail: String(e) });
    return NextResponse.json({ steps });
  }

  if (!session) return NextResponse.json({ steps });

  // Step 4: Pick server and fetch stream URL
  const serverIndex = Math.min(sv, session.servers.length - 1);
  const streamUrl = session.servers[serverIndex] || session.baseUrl;
  steps.push({ step: "pick_server", ok: true, detail: "Index: " + serverIndex + ", URL: " + streamUrl });

  // Step 5: Fetch the stream URL (same headers as proxy)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    // Use the request's Host header to build Origin (same logic as file2 route)
    // Browsers always send Host, but only send Origin on cross-origin requests
    const requestHost = request.headers.get("host") || "";
    const clientOrigin = requestHost
      ? `https://${requestHost.split(":")[0]}`
      : new URL(streamUrl).origin;

    const res = await fetch(streamUrl, {
      headers: {
        "User-Agent": UA,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": clientOrigin,
        "Referer": clientOrigin + "/",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    const contentType = res.headers.get("Content-Type") || "none";
    const body = await res.text();
    const isM3u8 = body.trimStart().startsWith("#EXTM3U");
    steps.push({
      step: "fetch_stream",
      ok: res.ok && isM3u8,
      detail: "Status: " + res.status + ", Content-Type: " + contentType + ", Is m3u8: " + isM3u8 + ", Body preview: " + body.substring(0, 200)
    });
  } catch (e) {
    steps.push({ step: "fetch_stream", ok: false, detail: "Error: " + (e instanceof Error ? e.message : String(e)) });
  }

  return NextResponse.json({ steps }, {
    headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" }
  });
}
