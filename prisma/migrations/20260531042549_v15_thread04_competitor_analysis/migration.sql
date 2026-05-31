-- CreateTable
CREATE TABLE "CompetitorAnalysisSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "aiJobId" INTEGER,
    "competitorIds" TEXT NOT NULL,
    "summary" TEXT,
    "differentiationAdvice" TEXT,
    "priceBandSummary" TEXT,
    "sellingPointSummary" TEXT,
    "imageStyleSummary" TEXT,
    "copywritingStyleSummary" TEXT,
    "riskTips" TEXT,
    "nextStepAdvice" TEXT,
    "dataGapAdvice" TEXT,
    "uncertaintyNotes" TEXT,
    "riskScanResultJson" TEXT,
    "model" TEXT,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorSummary" TEXT,
    "isReference" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitorAnalysisSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetitorAnalysisSnapshot_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AIJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CompetitorAnalysisSnapshot_productId_idx" ON "CompetitorAnalysisSnapshot"("productId");

-- CreateIndex
CREATE INDEX "CompetitorAnalysisSnapshot_aiJobId_idx" ON "CompetitorAnalysisSnapshot"("aiJobId");

-- CreateIndex
CREATE INDEX "CompetitorAnalysisSnapshot_status_idx" ON "CompetitorAnalysisSnapshot"("status");

-- CreateIndex
CREATE INDEX "CompetitorAnalysisSnapshot_isReference_idx" ON "CompetitorAnalysisSnapshot"("isReference");

-- CreateIndex
CREATE INDEX "CompetitorAnalysisSnapshot_archivedAt_idx" ON "CompetitorAnalysisSnapshot"("archivedAt");

-- CreateIndex
CREATE INDEX "CompetitorAnalysisSnapshot_createdAt_idx" ON "CompetitorAnalysisSnapshot"("createdAt");
