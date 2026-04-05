import { NextRequest, NextResponse } from "next/server";
import { resolveStreams } from "@/lib/player";
import { encryptPayload, createSessionToken } from "@/lib/crypto";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Encrypted stream endpoint.
 * Resolves streams server-side, creates a session token.
 * Client gets a TOKEN — never sees any URL.
 *
 * Response format (encrypted):
 *   { token: "base64...", name: "ServerName", count: 2 }
 *   { error: true, reason: "no_streams" }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = new URL(_req.url).searchParams;
  const type = sp.get("type") || "movie";
  const season = sp.get("s") || sp.get("season") || null;
  const episode = sp.get("e") || sp.get("episode") || null;

  try {
    const servers = await resolveStreams(id, type, season, episode);

    let payload: string;
    if (servers.length === 0) {
      payload = JSON.stringify({ error: true, reason: "no_streams" });
    } else {
      // Create session token — contains encrypted URLs, client can never decode
      const allUrls = servers.map((s) => s.url);
      const token = await createSessionToken({
        baseUrl: servers[0].url,
        servers: allUrls,
      });

      // Only send the opaque token + display name
      payload = JSON.stringify({
        token,
        name: servers[0].name,
        count: servers.length,
      });
    }

    const encrypted = await encryptPayload(payload);

    return new NextResponse(encrypted, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const errorPayload = JSON.stringify({
      error: true,
      reason: "fetch_failed",
    });
    const encrypted = await encryptPayload(errorPayload);
    return new NextResponse(encrypted, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  }
}
