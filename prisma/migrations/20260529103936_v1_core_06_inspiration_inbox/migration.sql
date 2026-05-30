-- CreateTable
CREATE TABLE "AppSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Inspiration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "note" TEXT,
    "imagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "fileHash" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "usagePermission" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "aiSuggestionJson" TEXT,
    "aiJobId" INTEGER,
    "convertedProductId" INTEGER,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspiration_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AIJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspiration_convertedProductId_fkey" FOREIGN KEY ("convertedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scanType" TEXT NOT NULL,
    "folderSummary" TEXT NOT NULL,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "newFiles" INTEGER NOT NULL DEFAULT 0,
    "skippedDuplicates" INTEGER NOT NULL DEFAULT 0,
    "failedFiles" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorSummary" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT,
    "relatedProductId" INTEGER,
    "relatedInspirationId" INTEGER,
    "inputSummary" TEXT,
    "resultSummary" TEXT,
    "errorSummary" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIJob_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AIJob_relatedInspirationId_fkey" FOREIGN KEY ("relatedInspirationId") REFERENCES "Inspiration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AIJob" ("createdAt", "errorSummary", "finishedAt", "id", "idempotencyKey", "inputSummary", "jobType", "relatedInspirationId", "relatedProductId", "resultSummary", "retryCount", "startedAt", "status", "updatedAt") SELECT "createdAt", "errorSummary", "finishedAt", "id", "idempotencyKey", "inputSummary", "jobType", "relatedInspirationId", "relatedProductId", "resultSummary", "retryCount", "startedAt", "status", "updatedAt" FROM "AIJob";
DROP TABLE "AIJob";
ALTER TABLE "new_AIJob" RENAME TO "AIJob";
CREATE INDEX "AIJob_jobType_idx" ON "AIJob"("jobType");
CREATE INDEX "AIJob_status_idx" ON "AIJob"("status");
CREATE INDEX "AIJob_idempotencyKey_idx" ON "AIJob"("idempotencyKey");
CREATE INDEX "AIJob_createdAt_idx" ON "AIJob"("createdAt");
CREATE INDEX "AIJob_relatedProductId_idx" ON "AIJob"("relatedProductId");
CREATE TABLE "new_AIRequestLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCost" REAL,
    "currency" TEXT,
    "unitPriceSnapshot" TEXT,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorSummary" TEXT,
    "inputSummary" TEXT,
    "relatedProductId" INTEGER,
    "relatedInspirationId" INTEGER,
    "relatedTaskId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIRequestLog_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AIRequestLog_relatedInspirationId_fkey" FOREIGN KEY ("relatedInspirationId") REFERENCES "Inspiration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AIRequestLog" ("createdAt", "currency", "durationMs", "errorSummary", "estimatedCost", "id", "inputSummary", "inputTokens", "model", "outputTokens", "provider", "relatedInspirationId", "relatedProductId", "relatedTaskId", "requestType", "success", "unitPriceSnapshot") SELECT "createdAt", "currency", "durationMs", "errorSummary", "estimatedCost", "id", "inputSummary", "inputTokens", "model", "outputTokens", "provider", "relatedInspirationId", "relatedProductId", "relatedTaskId", "requestType", "success", "unitPriceSnapshot" FROM "AIRequestLog";
DROP TABLE "AIRequestLog";
ALTER TABLE "new_AIRequestLog" RENAME TO "AIRequestLog";
CREATE INDEX "AIRequestLog_createdAt_idx" ON "AIRequestLog"("createdAt");
CREATE INDEX "AIRequestLog_success_idx" ON "AIRequestLog"("success");
CREATE INDEX "AIRequestLog_requestType_idx" ON "AIRequestLog"("requestType");
CREATE INDEX "AIRequestLog_relatedProductId_idx" ON "AIRequestLog"("relatedProductId");
CREATE INDEX "AIRequestLog_relatedTaskId_idx" ON "AIRequestLog"("relatedTaskId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Inspiration_fileHash_key" ON "Inspiration"("fileHash");

-- CreateIndex
CREATE INDEX "Inspiration_status_idx" ON "Inspiration"("status");

-- CreateIndex
CREATE INDEX "Inspiration_aiJobId_idx" ON "Inspiration"("aiJobId");

-- CreateIndex
CREATE INDEX "Inspiration_convertedProductId_idx" ON "Inspiration"("convertedProductId");

-- CreateIndex
CREATE INDEX "Inspiration_importedAt_idx" ON "Inspiration"("importedAt");

-- CreateIndex
CREATE INDEX "Inspiration_createdAt_idx" ON "Inspiration"("createdAt");

-- CreateIndex
CREATE INDEX "ScanLog_scanType_idx" ON "ScanLog"("scanType");

-- CreateIndex
CREATE INDEX "ScanLog_status_idx" ON "ScanLog"("status");

-- CreateIndex
CREATE INDEX "ScanLog_startedAt_idx" ON "ScanLog"("startedAt");
