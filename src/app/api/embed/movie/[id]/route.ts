import { NextRequest, NextResponse } from "next/server";
import { generatePlayerPage, getErrorHtml } from "@/lib/player";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = new URL(_req.url).searchParams;
  const color = sp.get("color") || "#E6B800";
  const logo = sp.get("logo") || "";
  const title = sp.get("title") || "";
  const autoplay = sp.get("autoplay") !== "false";

  if (!id) {
    return new NextResponse(getErrorHtml("", "Missing TMDB ID"), {
      status: 400,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }

  // Return player shell instantly — stream fetching happens client-side (encrypted)
  return new NextResponse(
    generatePlayerPage(id, "movie", null, null, color, logo, title, autoplay),
    {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "X-Frame-Options": "ALLOWALL",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
