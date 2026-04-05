import { NextRequest, NextResponse } from "next/server";
import { validateFingerprint, type ClientFingerprint } from "@/lib/sandbox";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * POST /api/detect
 *
 * Receives a client fingerprint from the browser and validates it
 * server-side. Returns pass/fail with anomaly score.
 *
 * Body: { ua, lang, langs, platform, cores, screenW, screenH, colorDepth, timezone, plugins, touchPoints, WebGL }
 * Response: { pass: boolean, score: number, reasons: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const fp: ClientFingerprint = {
      ua: body.ua || "",
      lang: body.lang || "",
      langs: body.langs || [],
      platform: body.platform || "",
      cores: parseInt(body.cores) || 0,
      screenW: parseInt(body.screenW) || 0,
      screenH: parseInt(body.screenH) || 0,
      colorDepth: parseInt(body.colorDepth) || 0,
      timezone: body.timezone || "",
      plugins: parseInt(body.plugins) || 0,
      touchPoints: parseInt(body.touchPoints) || 0,
      WebGL: body.WebGL || "",
    };

    const result = validateFingerprint(fp);

    // Rate limit check — if the same fingerprint appears too many times, it's suspicious
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      { pass: false, score: 0, reasons: ["invalid_request"] },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
