-- CreateTable
CREATE TABLE "InspirationScanJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scanLogId" INTEGER,
    "inspirationId" INTEGER,
    "sourceRelativePath" TEXT NOT NULL,
    "sourceFileHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReasonSummary" TEXT,
    "aiDraftGenerated" BOOLEAN NOT NULL DEFAULT false,
    "needsUserConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InspirationScanJob_scanLogId_fkey" FOREIGN KEY ("scanLogId") REFERENCES "ScanLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InspirationScanJob_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "Inspiration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspirationAiDraftJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inspirationId" INTEGER NOT NULL,
    "aiJobId" INTEGER,
    "sourceRelativePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReasonSummary" TEXT,
    "rawResponseSummary" TEXT,
    "needsUserConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InspirationAiDraftJob_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "Inspiration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InspirationAiDraftJob_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AIJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InspirationScanJob_scanLogId_idx" ON "InspirationScanJob"("scanLogId");

-- CreateIndex
CREATE INDEX "InspirationScanJob_inspirationId_idx" ON "InspirationScanJob"("inspirationId");

-- CreateIndex
CREATE INDEX "InspirationScanJob_sourceFileHash_idx" ON "InspirationScanJob"("sourceFileHash");

-- CreateIndex
CREATE INDEX "InspirationScanJob_status_idx" ON "InspirationScanJob"("status");

-- CreateIndex
CREATE INDEX "InspirationScanJob_createdAt_idx" ON "InspirationScanJob"("createdAt");

-- CreateIndex
CREATE INDEX "InspirationAiDraftJob_inspirationId_idx" ON "InspirationAiDraftJob"("inspirationId");

-- CreateIndex
CREATE INDEX "InspirationAiDraftJob_aiJobId_idx" ON "InspirationAiDraftJob"("aiJobId");

-- CreateIndex
CREATE INDEX "InspirationAiDraftJob_status_idx" ON "InspirationAiDraftJob"("status");

-- CreateIndex
CREATE INDEX "InspirationAiDraftJob_createdAt_idx" ON "InspirationAiDraftJob"("createdAt");
