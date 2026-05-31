# Images Service

## Responsibility

`src/lib/services/images/` is the shared image safety layer for EcomPilot uploads. It validates supported formats, enforces the 10MB default size limit, creates short safe filenames, writes upload files, computes SHA-256 file hashes, reads image dimensions, and generates thumbnails.

## Not Responsible For

- AI image generation, OCR, image scoring, reverse-image search, copyright judgment, or automatic cropping.
- V1.5 Thread 05 similarity matching; that lives in `src/lib/services/image-dedup/` and reuses managed upload paths plus `sharp`.
- Inspiration folder scanning.
- File cleanup, recycle bin, or historical bulk compression.
- Material status workflow decisions beyond returning upload metadata.

## Flow

1. Server actions pass `File` objects to product/material services.
2. Services call the image storage service instead of handling image bytes directly.
3. The image service validates `jpg / jpeg / png / webp`, blocks files over 10MB, and writes only in Windows local writable runtime.
4. The original image is stored under `uploads/...` with a short generated filename.
5. The service records width, height, MIME type, original size, SHA-256 `fileHash`, and thumbnail metadata.
6. A WebP thumbnail is written under `uploads/thumbnails/...`; if thumbnail generation fails, the original upload remains valid and the caller can fall back to the original path.

## Database And Filesystem

- Writes files: yes, under `uploads/` and `uploads/thumbnails/`.
- Writes database: no. Callers such as `material-service.ts` write returned metadata into Prisma models.
- Calls AI: no.

## Vercel Behavior

Vercel is preview-only and read-only. Image writes call `assertLocalWritable()` and fail with the shared preview read-only message instead of writing temporary files.

## Path Rules

- Store relative paths such as `uploads/products/...`.
- Do not return or render full local absolute paths to the frontend.
- Use `getUploadsAbsolutePath()` only inside server-side services/routes.
- All generated filenames use bounded short names from local path safety helpers.

## Size And Format Rules

- Supported now: `jpg`, `jpeg`, `png`, `webp`.
- Reserved for future consideration only: `heic`, `avif`.
- Default maximum single-image size: 10MB.
- Oversized or unsupported images must surface a friendly validation error.

## Dependency Note

Thumbnail generation uses `sharp`. It is a native image dependency already present in the lockfile through Next.js optional dependencies; V1-Core-04 declares it directly because application code now imports it. Risk: native package installation can be platform-sensitive, so Windows local verification must include `npm run build` after install/generate.

## Do Not Change Casually

- Do not make Vercel writable.
- Do not expose absolute paths.
- Do not silently accept unsupported formats.
- Do not add compression, cropping, OCR, AI image generation, or cleanup behavior in this module without an approved future thread.
