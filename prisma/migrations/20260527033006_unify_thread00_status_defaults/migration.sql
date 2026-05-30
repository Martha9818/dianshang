-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "promptTaskId" INTEGER,
    "platform" TEXT,
    "materialType" TEXT,
    "filePath" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "status" TEXT NOT NULL DEFAULT '待审核',
    "source" TEXT,
    "version" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Material_promptTaskId_fkey" FOREIGN KEY ("promptTaskId") REFERENCES "PromptTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Material" ("createdAt", "filePath", "height", "id", "materialType", "platform", "productId", "promptTaskId", "source", "status", "version", "width") SELECT "createdAt", "filePath", "height", "id", "materialType", "platform", "productId", "promptTaskId", "source", "status", "version", "width" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
CREATE INDEX "Material_productId_idx" ON "Material"("productId");
CREATE INDEX "Material_promptTaskId_idx" ON "Material"("promptTaskId");
CREATE TABLE "new_PromptTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskCode" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "platform" TEXT,
    "imageType" TEXT,
    "recommendedSize" TEXT,
    "promptText" TEXT,
    "status" TEXT NOT NULL DEFAULT '待生成',
    "version" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PromptTask" ("createdAt", "id", "imageType", "platform", "productId", "promptText", "recommendedSize", "status", "taskCode", "updatedAt", "version") SELECT "createdAt", "id", "imageType", "platform", "productId", "promptText", "recommendedSize", "status", "taskCode", "updatedAt", "version" FROM "PromptTask";
DROP TABLE "PromptTask";
ALTER TABLE "new_PromptTask" RENAME TO "PromptTask";
CREATE UNIQUE INDEX "PromptTask_taskCode_key" ON "PromptTask"("taskCode");
CREATE INDEX "PromptTask_productId_idx" ON "PromptTask"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
