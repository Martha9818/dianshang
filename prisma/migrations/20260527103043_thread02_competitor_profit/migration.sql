/*
  Warnings:

  - You are about to alter the column `heatMetricValue` on the `Competitor` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.
  - Made the column `dataDate` on table `Competitor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `heatMetricType` on table `Competitor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `heatMetricValue` on table `Competitor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `Competitor` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Competitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "heatMetricType" TEXT NOT NULL,
    "heatMetricValue" REAL NOT NULL,
    "sellerName" TEXT,
    "link" TEXT,
    "screenshotPath" TEXT,
    "sellingPoint" TEXT,
    "painPoint" TEXT,
    "imageStyle" TEXT,
    "dataDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Competitor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Competitor" ("createdAt", "dataDate", "heatMetricType", "heatMetricValue", "id", "imageStyle", "link", "notes", "painPoint", "platform", "price", "productId", "screenshotPath", "sellerName", "sellingPoint", "title", "updatedAt") SELECT "createdAt", "dataDate", "heatMetricType", "heatMetricValue", "id", "imageStyle", "link", "notes", "painPoint", "platform", "price", "productId", "screenshotPath", "sellerName", "sellingPoint", "title", "updatedAt" FROM "Competitor";
DROP TABLE "Competitor";
ALTER TABLE "new_Competitor" RENAME TO "Competitor";
CREATE INDEX "Competitor_productId_idx" ON "Competitor"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
