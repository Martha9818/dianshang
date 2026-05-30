import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getUploadsAbsolutePath } from "@/lib/services/images";

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function getSafeAbsolutePath(pathSegments: string[]) {
  return getUploadsAbsolutePath(pathSegments.join("/"));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const params = await context.params;
    const absolutePath = getSafeAbsolutePath(params.path);
    const file = await readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();

    return new NextResponse(file, {
      headers: {
        "Content-Type": MIME_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
