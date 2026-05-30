import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getLocalDirectoryPath } from "@/lib/services/local-paths";
import { assertPathLength, toSafeRelativePath } from "@/lib/services/local-paths/pathSafetyService";
import { THUMBNAIL_MAX_SIZE, type SupportedImageMimeType } from "./imageTypes";

export function buildThumbnailRelativePath(originalRelativePath: string) {
  const parsed = path.parse(originalRelativePath.replaceAll("\\", "/"));
  const sourceName = `${parsed.name}.webp`;
  return toSafeRelativePath("uploads", "thumbnails", parsed.dir.replace(/^uploads[\\/]/, ""), sourceName);
}

export async function generateImageThumbnail(input: {
  sourceBuffer: Buffer;
  originalRelativePath: string;
  mimeType: SupportedImageMimeType;
}) {
  const thumbnailRelativePath = buildThumbnailRelativePath(input.originalRelativePath);
  const absoluteThumbnailPath = path.join(getLocalDirectoryPath("uploads"), thumbnailRelativePath.replace(/^uploads[\\/]/, ""));

  assertPathLength(absoluteThumbnailPath);
  await mkdir(path.dirname(absoluteThumbnailPath), { recursive: true });

  const thumbnailBuffer = await sharp(input.sourceBuffer, { failOn: "none" })
    .rotate()
    .resize({
      width: THUMBNAIL_MAX_SIZE,
      height: THUMBNAIL_MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78 })
    .toBuffer();

  await writeFile(absoluteThumbnailPath, thumbnailBuffer);
  const thumbnailStats = await stat(absoluteThumbnailPath);

  return {
    thumbnailPath: thumbnailRelativePath,
    thumbnailSizeBytes: thumbnailStats.size,
  };
}

