-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Copywriting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "providerId" INTEGER,
    "platform" TEXT,
    "copyType" TEXT,
    "version" TEXT,
    "style" TEXT,
    "title" TEXT,
    "content" TEXT,
    "mainCopy" TEXT,
    "sellingPointsJson" TEXT,
    "faqJson" TEXT,
    "riskNotesJson" TEXT,
    "auditStatus" TEXT,
    "generationStatus" TEXT,
    "riskWords" TEXT,
    "structuredPayloadJson" TEXT,
    "rawResponseText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Copywriting_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Copywriting_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AIProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Copywriting" ("auditStatus", "content", "copyType", "createdAt", "id", "platform", "productId", "riskWords", "style", "title", "updatedAt", "version") SELECT "auditStatus", "content", "copyType", "createdAt", "id", "platform", "productId", "riskWords", "style", "title", "updatedAt", "version" FROM "Copywriting";
DROP TABLE "Copywriting";
ALTER TABLE "new_Copywriting" RENAME TO "Copywriting";
CREATE INDEX "Copywriting_productId_idx" ON "Copywriting"("productId");
CREATE INDEX "Copywriting_providerId_idx" ON "Copywriting"("providerId");
CREATE UNIQUE INDEX "Copywriting_productId_platform_version_key" ON "Copywriting"("productId", "platform", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
