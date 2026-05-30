-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Copywriting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "providerId" INTEGER,
    "aiJobId" INTEGER,
    "platform" TEXT,
    "copyType" TEXT,
    "version" TEXT,
    "versionLabel" TEXT,
    "style" TEXT,
    "title" TEXT,
    "content" TEXT,
    "body" TEXT,
    "mainCopy" TEXT,
    "sellingPointsJson" TEXT,
    "tagsJson" TEXT,
    "faqJson" TEXT,
    "riskNotesJson" TEXT,
    "auditStatus" TEXT,
    "generationStatus" TEXT,
    "riskWords" TEXT,
    "violationScanResultJson" TEXT,
    "isUsedInListing" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "usedPlatform" TEXT,
    "usageNote" TEXT,
    "structuredPayloadJson" TEXT,
    "rawResponseText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Copywriting_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Copywriting_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AIProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Copywriting_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AIJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Copywriting" ("auditStatus", "content", "copyType", "createdAt", "faqJson", "generationStatus", "id", "mainCopy", "platform", "productId", "providerId", "rawResponseText", "riskNotesJson", "riskWords", "sellingPointsJson", "structuredPayloadJson", "style", "title", "updatedAt", "version") SELECT "auditStatus", "content", "copyType", "createdAt", "faqJson", "generationStatus", "id", "mainCopy", "platform", "productId", "providerId", "rawResponseText", "riskNotesJson", "riskWords", "sellingPointsJson", "structuredPayloadJson", "style", "title", "updatedAt", "version" FROM "Copywriting";
DROP TABLE "Copywriting";
ALTER TABLE "new_Copywriting" RENAME TO "Copywriting";
CREATE INDEX "Copywriting_productId_idx" ON "Copywriting"("productId");
CREATE INDEX "Copywriting_providerId_idx" ON "Copywriting"("providerId");
CREATE INDEX "Copywriting_aiJobId_idx" ON "Copywriting"("aiJobId");
CREATE INDEX "Copywriting_productId_platform_idx" ON "Copywriting"("productId", "platform");
CREATE INDEX "Copywriting_productId_platform_versionLabel_idx" ON "Copywriting"("productId", "platform", "versionLabel");
CREATE INDEX "Copywriting_productId_platform_createdAt_idx" ON "Copywriting"("productId", "platform", "createdAt");
CREATE INDEX "Copywriting_isUsedInListing_idx" ON "Copywriting"("isUsedInListing");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
