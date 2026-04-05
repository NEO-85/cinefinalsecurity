import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "download", "cinetaro-api.zip");
    const fileBuffer = readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="cinetaro-api.zip"',
        "Content-Length": String(fileBuffer.byteLength),
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
