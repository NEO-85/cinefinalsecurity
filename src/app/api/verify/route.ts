import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * POST /api/verify
 *
 * Challenge-response verification. The client must solve a small
 * computational challenge to prove it's a real browser (not headless).
 *
 * Flow:
 *  1. Client sends: { challenge: string, nonce: string, proof: number }
 *  2. Server validates the proof (SHA-256 hash of challenge+proof must start with N zeros)
 *  3. Returns { pass: boolean }
 *
 * This prevents automated scrapers from easily bypassing the client-side checks.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challenge, nonce, proof } = body;

    if (!challenge || !nonce || proof === undefined) {
      return NextResponse.json({ pass: false, reason: "missing_params" }, { status: 400 });
    }

    // Validate proof: compute SHA-256(challenge + nonce + proof)
    const input = `${challenge}:${nonce}:${proof}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Require first 3 hex chars to be "000" (difficulty ~1/4096)
    const requiredPrefix = "000";
    if (!hashHex.startsWith(requiredPrefix)) {
      return NextResponse.json({ pass: false, reason: "invalid_proof" });
    }

    // Validate nonce freshness (should be within last 60 seconds)
    try {
      const nonceTime = parseInt(atob(nonce));
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - nonceTime) > 60) {
        return NextResponse.json({ pass: false, reason: "nonce_expired" });
      }
    } catch {
      return NextResponse.json({ pass: false, reason: "invalid_nonce" });
    }

    return NextResponse.json({ pass: true });
  } catch {
    return NextResponse.json({ pass: false, reason: "server_error" }, { status: 500 });
  }
}

export async function GET() {
  // Generate a new challenge for the client
  const challenge = crypto.randomUUID().replace(/-/g, "");
  const nonce = btoa(String(Math.floor(Date.now() / 1000)));
  return NextResponse.json({ challenge, nonce, difficulty: 3 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
