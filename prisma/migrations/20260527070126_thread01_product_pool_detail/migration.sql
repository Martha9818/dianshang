/*
  Warnings:

  - Added the required column `spu` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
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
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT '待分析',
    "mainImagePath" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("categoryLevel1", "categoryLevel2", "createdAt", "estimatedCost", "estimatedPrice", "estimatedShipping", "id", "mainImagePath", "name", "notes", "packagingCost", "painPoints", "sellingPoints", "status", "tags", "targetPlatforms", "targetUser", "updatedAt", "usageScenes") SELECT "categoryLevel1", "categoryLevel2", "createdAt", "estimatedCost", "estimatedPrice", "estimatedShipping", "id", "mainImagePath", "name", "notes", "packagingCost", "painPoints", "sellingPoints", "status", "tags", "targetPlatforms", "targetUser", "updatedAt", "usageScenes" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_spu_key" ON "Product"("spu");
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX "Product_updatedAt_idx" ON "Product"("updatedAt");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
