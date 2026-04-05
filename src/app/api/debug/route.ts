import { NextRequest, NextResponse } from "next/server";
import { resolveStreamsDebug } from "@/lib/player";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const id = sp.get("id") || "";
  const type = sp.get("type") || "movie";
  const season = sp.get("s") || null;
  const episode = sp.get("e") || null;

  if (!id) {
    return NextResponse.json({ error: "missing id param" }, { status: 400 });
  }

  const results = await resolveStreamsDebug(id, type, season, episode);
  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
