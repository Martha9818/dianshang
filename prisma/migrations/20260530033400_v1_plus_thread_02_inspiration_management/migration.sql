-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inspiration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "note" TEXT,
    "imagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "fileHash" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "usagePermission" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiSuggestionJson" TEXT,
    "aiJobId" INTEGER,
    "convertedProductId" INTEGER,
    "reviewedAt" DATETIME,
    "archivedAt" DATETIME,
    "rejectedReason" TEXT,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspiration_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AIJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspiration_convertedProductId_fkey" FOREIGN KEY ("convertedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inspiration" ("aiJobId", "aiSuggestionJson", "convertedProductId", "createdAt", "fileHash", "id", "imagePath", "importedAt", "note", "sourceType", "status", "thumbnailPath", "title", "updatedAt", "usagePermission", "rejectedReason") SELECT "aiJobId", "aiSuggestionJson", "convertedProductId", "createdAt", "fileHash", "id", "imagePath", "importedAt", "note", "sourceType", CASE WHEN "status" = 'pending_review' THEN 'pending' WHEN "status" = 'ignored' THEN 'rejected' ELSE "status" END, "thumbnailPath", "title", "updatedAt", "usagePermission", CASE WHEN "status" = 'ignored' THEN '历史忽略记录' ELSE NULL END FROM "Inspiration";
DROP TABLE "Inspiration";
ALTER TABLE "new_Inspiration" RENAME TO "Inspiration";
CREATE UNIQUE INDEX "Inspiration_fileHash_key" ON "Inspiration"("fileHash");
CREATE INDEX "Inspiration_status_idx" ON "Inspiration"("status");
CREATE INDEX "Inspiration_aiJobId_idx" ON "Inspiration"("aiJobId");
CREATE INDEX "Inspiration_convertedProductId_idx" ON "Inspiration"("convertedProductId");
CREATE INDEX "Inspiration_importedAt_idx" ON "Inspiration"("importedAt");
CREATE INDEX "Inspiration_createdAt_idx" ON "Inspiration"("createdAt");
CREATE TABLE "new_OperationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "relatedInspirationId" INTEGER,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationLog_relatedInspirationId_fkey" FOREIGN KEY ("relatedInspirationId") REFERENCES "Inspiration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OperationLog" ("action", "createdAt", "detail", "id", "productId") SELECT "action", "createdAt", "detail", "id", "productId" FROM "OperationLog";
DROP TABLE "OperationLog";
ALTER TABLE "new_OperationLog" RENAME TO "OperationLog";
CREATE INDEX "OperationLog_productId_idx" ON "OperationLog"("productId");
CREATE INDEX "OperationLog_relatedInspirationId_idx" ON "OperationLog"("relatedInspirationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
