# Image Dedupe Service

## Responsibility

`src/lib/services/image-dedup/` owns V1.5 Thread 05 image fingerprinting, duplicate detection, high-similarity hints, and lightweight originality-risk review records for materials and inspirations.

## Flow

1. User explicitly clicks a dedupe action in the material library or inspiration inbox.
2. The service checks the local writable runtime; preview/read-only mode returns `预览环境只读，请在 Windows 本地验收图片去重。`
3. The service reads only managed relative image paths through the existing uploads path guard.
4. It records SHA-256 file hash, 8x8 perceptual hash, dimensions, file size, MIME, and check time in `ImageFingerprint`.
5. It compares fingerprints inside the requested library scope and records exact or high-similarity findings in `ImageReviewLog`.
6. Users can manually ignore a finding or mark it as archive-suggested. Actual deletion, trash movement, and cleanup stay in V1-Plus Thread 06.

## Boundaries

- No background scans.
- No internet reverse-image search.
- No copyright/legal conclusion.
- No automatic deletion, trash movement, compression, replacement, or uploads cleanup.
- No full local absolute paths in frontend data.
- Fingerprint failure is recorded as a review hint and must not block normal material or inspiration usage.

## Similarity Strategy

- Exact duplicate: same SHA-256 hash.
- High similarity: average-hash similarity at or above 90%.
- Risk hints are conservative phrases only: suspected duplicate, high similarity, source unknown, suggested modification/regeneration, and manual review reminders.
