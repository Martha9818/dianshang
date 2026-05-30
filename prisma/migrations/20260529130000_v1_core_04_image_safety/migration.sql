-- V1-Core-04 image safety metadata for Material uploads.
ALTER TABLE "Material" ADD COLUMN "fileHash" TEXT;
ALTER TABLE "Material" ADD COLUMN "originalSizeBytes" INTEGER;
ALTER TABLE "Material" ADD COLUMN "thumbnailSizeBytes" INTEGER;
ALTER TABLE "Material" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "Material" ADD COLUMN "thumbnailPath" TEXT;
ALTER TABLE "Material" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "Material" ADD COLUMN "usagePermission" TEXT;

CREATE INDEX "Material_fileHash_idx" ON "Material"("fileHash");
CREATE INDEX "Material_usagePermission_idx" ON "Material"("usagePermission");
CREATE INDEX "Material_sourceType_idx" ON "Material"("sourceType");

