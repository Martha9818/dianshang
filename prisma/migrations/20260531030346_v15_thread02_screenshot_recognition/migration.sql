-- CreateTable
CREATE TABLE "ScreenshotRecognitionJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "productId" INTEGER,
    "inspirationId" INTEGER,
    "materialId" INTEGER,
    "competitorId" INTEGER,
    "aiJobId" INTEGER,
    "imagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultSummary" TEXT,
    "structuredDraft" TEXT,
    "confirmedDraft" TEXT,
    "qualityLevel" TEXT,
    "errorSummary" TEXT,
    "needsUserConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "confirmedAt" DATETIME,
    "ignoredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScreenshotRecognitionJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScreenshotRecognitionJob_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "Inspiration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScreenshotRecognitionJob_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScreenshotRecognitionJob_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScreenshotRecognitionJob_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AIJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_sourceType_idx" ON "ScreenshotRecognitionJob"("sourceType");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_sourceId_idx" ON "ScreenshotRecognitionJob"("sourceId");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_productId_idx" ON "ScreenshotRecognitionJob"("productId");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_inspirationId_idx" ON "ScreenshotRecognitionJob"("inspirationId");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_materialId_idx" ON "ScreenshotRecognitionJob"("materialId");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_competitorId_idx" ON "ScreenshotRecognitionJob"("competitorId");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_aiJobId_idx" ON "ScreenshotRecognitionJob"("aiJobId");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_status_idx" ON "ScreenshotRecognitionJob"("status");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_qualityLevel_idx" ON "ScreenshotRecognitionJob"("qualityLevel");

-- CreateIndex
CREATE INDEX "ScreenshotRecognitionJob_createdAt_idx" ON "ScreenshotRecognitionJob"("createdAt");
