import { NextResponse } from "next/server";
import SERVERS from "@/config/servers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Returns server names list for the player menu.
 * Only exposes names — no URLs, no config details.
 */
export async function GET() {
  const list = SERVERS.map((s, i) => ({
    idx: i,
    name: s.name,
  }));

  return NextResponse.json(list, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
