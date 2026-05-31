-- CreateTable
CREATE TABLE "ImageFingerprint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imageType" TEXT NOT NULL,
    "imageId" INTEGER NOT NULL,
    "productId" INTEGER,
    "relativePath" TEXT NOT NULL,
    "fileHash" TEXT,
    "perceptualHash" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "errorSummary" TEXT,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImageReviewLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dedupeKey" TEXT,
    "sourceFingerprintId" INTEGER NOT NULL,
    "matchedFingerprintId" INTEGER,
    "sourceType" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "matchedType" TEXT,
    "matchedId" INTEGER,
    "relationScope" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'info',
    "hash" TEXT,
    "matchedHash" TEXT,
    "similarity" REAL,
    "message" TEXT,
    "userStatus" TEXT NOT NULL DEFAULT 'open',
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "archiveSuggested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImageReviewLog_sourceFingerprintId_fkey" FOREIGN KEY ("sourceFingerprintId") REFERENCES "ImageFingerprint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImageReviewLog_matchedFingerprintId_fkey" FOREIGN KEY ("matchedFingerprintId") REFERENCES "ImageFingerprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ImageFingerprint_imageType_idx" ON "ImageFingerprint"("imageType");

-- CreateIndex
CREATE INDEX "ImageFingerprint_imageId_idx" ON "ImageFingerprint"("imageId");

-- CreateIndex
CREATE INDEX "ImageFingerprint_productId_idx" ON "ImageFingerprint"("productId");

-- CreateIndex
CREATE INDEX "ImageFingerprint_fileHash_idx" ON "ImageFingerprint"("fileHash");

-- CreateIndex
CREATE INDEX "ImageFingerprint_perceptualHash_idx" ON "ImageFingerprint"("perceptualHash");

-- CreateIndex
CREATE INDEX "ImageFingerprint_status_idx" ON "ImageFingerprint"("status");

-- CreateIndex
CREATE INDEX "ImageFingerprint_lastCheckedAt_idx" ON "ImageFingerprint"("lastCheckedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImageFingerprint_imageType_imageId_key" ON "ImageFingerprint"("imageType", "imageId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageReviewLog_dedupeKey_key" ON "ImageReviewLog"("dedupeKey");

-- CreateIndex
CREATE INDEX "ImageReviewLog_sourceFingerprintId_idx" ON "ImageReviewLog"("sourceFingerprintId");

-- CreateIndex
CREATE INDEX "ImageReviewLog_matchedFingerprintId_idx" ON "ImageReviewLog"("matchedFingerprintId");

-- CreateIndex
CREATE INDEX "ImageReviewLog_sourceType_sourceId_idx" ON "ImageReviewLog"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ImageReviewLog_matchedType_matchedId_idx" ON "ImageReviewLog"("matchedType", "matchedId");

-- CreateIndex
CREATE INDEX "ImageReviewLog_matchType_idx" ON "ImageReviewLog"("matchType");

-- CreateIndex
CREATE INDEX "ImageReviewLog_riskLevel_idx" ON "ImageReviewLog"("riskLevel");

-- CreateIndex
CREATE INDEX "ImageReviewLog_userStatus_idx" ON "ImageReviewLog"("userStatus");

-- CreateIndex
CREATE INDEX "ImageReviewLog_ignored_idx" ON "ImageReviewLog"("ignored");

-- CreateIndex
CREATE INDEX "ImageReviewLog_archiveSuggested_idx" ON "ImageReviewLog"("archiveSuggested");

-- CreateIndex
CREATE INDEX "ImageReviewLog_createdAt_idx" ON "ImageReviewLog"("createdAt");
