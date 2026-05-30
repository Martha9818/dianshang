-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spu" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryLevel1" TEXT,
    "categoryLevel2" TEXT,
    "tags" TEXT,
    "targetUser" TEXT,
    "targetPlatforms" TEXT,
    "estimatedPrice" REAL,
    "estimatedCost" REAL,
    "estimatedShipping" REAL,
    "packagingCost" REAL,
    "sellingPoints" TEXT,
    "painPoints" TEXT,
    "usageScenes" TEXT,
    "categoryRisk" TEXT,
    "returnRisk" TEXT,
    "explanationCost" TEXT,
    "contentVisualLevel" TEXT,
    "sceneClarityLevel" TEXT,
    "videoFitLevel" TEXT,
    "comparisonDemoLevel" TEXT,
    "manualRegulatedRisk" BOOLEAN NOT NULL DEFAULT false,
    "manualInfringementRisk" BOOLEAN NOT NULL DEFAULT false,
    "manualRiskNotes" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT '待分析',
    "mainImagePath" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("categoryLevel1", "categoryLevel2", "categoryRisk", "comparisonDemoLevel", "contentVisualLevel", "createdAt", "deletedAt", "estimatedCost", "estimatedPrice", "estimatedShipping", "explanationCost", "id", "mainImagePath", "name", "notes", "packagingCost", "painPoints", "returnRisk", "sceneClarityLevel", "sellingPoints", "spu", "status", "tags", "targetPlatforms", "targetUser", "updatedAt", "usageScenes", "videoFitLevel") SELECT "categoryLevel1", "categoryLevel2", "categoryRisk", "comparisonDemoLevel", "contentVisualLevel", "createdAt", "deletedAt", "estimatedCost", "estimatedPrice", "estimatedShipping", "explanationCost", "id", "mainImagePath", "name", "notes", "packagingCost", "painPoints", "returnRisk", "sceneClarityLevel", "sellingPoints", "spu", "status", "tags", "targetPlatforms", "targetUser", "updatedAt", "usageScenes", "videoFitLevel" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_spu_key" ON "Product"("spu");
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX "Product_updatedAt_idx" ON "Product"("updatedAt");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
CREATE TABLE "new_ScoreSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "totalScore" REAL,
    "demandScore" REAL,
    "profitScore" REAL,
    "afterSalesScore" REAL,
    "competitionScore" REAL,
    "supplierScore" REAL,
    "contentScore" REAL,
    "recommendation" TEXT,
    "recommendationNote" TEXT,
    "deductionReasons" TEXT,
    "nextSuggestions" TEXT,
    "manualRegulatedRisk" BOOLEAN NOT NULL DEFAULT false,
    "manualInfringementRisk" BOOLEAN NOT NULL DEFAULT false,
    "manualRiskNotes" TEXT,
    "ruleVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScoreSnapshot" ("afterSalesScore", "competitionScore", "contentScore", "createdAt", "deductionReasons", "demandScore", "id", "nextSuggestions", "productId", "profitScore", "recommendation", "ruleVersion", "supplierScore", "totalScore") SELECT "afterSalesScore", "competitionScore", "contentScore", "createdAt", "deductionReasons", "demandScore", "id", "nextSuggestions", "productId", "profitScore", "recommendation", "ruleVersion", "supplierScore", "totalScore" FROM "ScoreSnapshot";
DROP TABLE "ScoreSnapshot";
ALTER TABLE "new_ScoreSnapshot" RENAME TO "ScoreSnapshot";
CREATE INDEX "ScoreSnapshot_productId_idx" ON "ScoreSnapshot"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
