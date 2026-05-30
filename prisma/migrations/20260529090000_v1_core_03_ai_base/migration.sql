-- CreateTable
CREATE TABLE "AIRequestLog" (
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
    CONSTRAINT "AIRequestLog_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIJob" (
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
    CONSTRAINT "AIJob_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AIRequestLog_createdAt_idx" ON "AIRequestLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIRequestLog_success_idx" ON "AIRequestLog"("success");

-- CreateIndex
CREATE INDEX "AIRequestLog_requestType_idx" ON "AIRequestLog"("requestType");

-- CreateIndex
CREATE INDEX "AIRequestLog_relatedProductId_idx" ON "AIRequestLog"("relatedProductId");

-- CreateIndex
CREATE INDEX "AIRequestLog_relatedTaskId_idx" ON "AIRequestLog"("relatedTaskId");

-- CreateIndex
CREATE INDEX "AIJob_jobType_idx" ON "AIJob"("jobType");

-- CreateIndex
CREATE INDEX "AIJob_status_idx" ON "AIJob"("status");

-- CreateIndex
CREATE INDEX "AIJob_idempotencyKey_idx" ON "AIJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AIJob_createdAt_idx" ON "AIJob"("createdAt");

-- CreateIndex
CREATE INDEX "AIJob_relatedProductId_idx" ON "AIJob"("relatedProductId");
