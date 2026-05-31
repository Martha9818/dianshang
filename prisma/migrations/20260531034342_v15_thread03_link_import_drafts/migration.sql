-- CreateTable
CREATE TABLE "LinkImportDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT,
    "sourcePlatform" TEXT NOT NULL DEFAULT 'other',
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "qualityLevel" TEXT NOT NULL DEFAULT 'low',
    "manualText" TEXT,
    "screenshotMaterialId" INTEGER,
    "screenshotPath" TEXT,
    "screenshotThumbnailPath" TEXT,
    "screenshotFileHash" TEXT,
    "note" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "errorSummary" TEXT,
    "productId" INTEGER,
    "competitorId" INTEGER,
    "convertedInspirationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkImportDraft_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LinkImportDraft_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LinkImportDraft_screenshotMaterialId_fkey" FOREIGN KEY ("screenshotMaterialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LinkImportDraft_convertedInspirationId_fkey" FOREIGN KEY ("convertedInspirationId") REFERENCES "Inspiration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LinkImportDraft_normalizedUrl_idx" ON "LinkImportDraft"("normalizedUrl");

-- CreateIndex
CREATE INDEX "LinkImportDraft_sourcePlatform_idx" ON "LinkImportDraft"("sourcePlatform");

-- CreateIndex
CREATE INDEX "LinkImportDraft_purpose_idx" ON "LinkImportDraft"("purpose");

-- CreateIndex
CREATE INDEX "LinkImportDraft_status_idx" ON "LinkImportDraft"("status");

-- CreateIndex
CREATE INDEX "LinkImportDraft_qualityLevel_idx" ON "LinkImportDraft"("qualityLevel");

-- CreateIndex
CREATE INDEX "LinkImportDraft_productId_idx" ON "LinkImportDraft"("productId");

-- CreateIndex
CREATE INDEX "LinkImportDraft_competitorId_idx" ON "LinkImportDraft"("competitorId");

-- CreateIndex
CREATE INDEX "LinkImportDraft_convertedInspirationId_idx" ON "LinkImportDraft"("convertedInspirationId");

-- CreateIndex
CREATE INDEX "LinkImportDraft_screenshotMaterialId_idx" ON "LinkImportDraft"("screenshotMaterialId");

-- CreateIndex
CREATE INDEX "LinkImportDraft_createdAt_idx" ON "LinkImportDraft"("createdAt");
