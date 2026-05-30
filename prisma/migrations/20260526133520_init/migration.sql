-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT '待分析',
    "mainImagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "skuName" TEXT NOT NULL,
    "specText" TEXT,
    "estimatedPrice" REAL,
    "estimatedCost" REAL,
    "stockQuantity" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" REAL,
    "heatMetricType" TEXT,
    "heatMetricValue" TEXT,
    "sellerName" TEXT,
    "link" TEXT,
    "screenshotPath" TEXT,
    "sellingPoint" TEXT,
    "painPoint" TEXT,
    "imageStyle" TEXT,
    "dataDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Competitor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Copywriting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "platform" TEXT,
    "copyType" TEXT,
    "version" TEXT,
    "style" TEXT,
    "title" TEXT,
    "content" TEXT,
    "auditStatus" TEXT,
    "riskWords" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Copywriting_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskCode" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "platform" TEXT,
    "imageType" TEXT,
    "recommendedSize" TEXT,
    "promptText" TEXT,
    "status" TEXT NOT NULL DEFAULT '待处理',
    "version" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "promptTaskId" INTEGER,
    "platform" TEXT,
    "materialType" TEXT,
    "filePath" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "status" TEXT NOT NULL DEFAULT '待处理',
    "source" TEXT,
    "version" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Material_promptTaskId_fkey" FOREIGN KEY ("promptTaskId") REFERENCES "PromptTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreSnapshot" (
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
    "deductionReasons" TEXT,
    "nextSuggestions" TEXT,
    "ruleVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIProvider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "modelName" TEXT,
    "purpose" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BannedWord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "Competitor_productId_idx" ON "Competitor"("productId");

-- CreateIndex
CREATE INDEX "Copywriting_productId_idx" ON "Copywriting"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTask_taskCode_key" ON "PromptTask"("taskCode");

-- CreateIndex
CREATE INDEX "PromptTask_productId_idx" ON "PromptTask"("productId");

-- CreateIndex
CREATE INDEX "Material_productId_idx" ON "Material"("productId");

-- CreateIndex
CREATE INDEX "Material_promptTaskId_idx" ON "Material"("promptTaskId");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_productId_idx" ON "ScoreSnapshot"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AIProvider_name_key" ON "AIProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BannedWord_word_key" ON "BannedWord"("word");

-- CreateIndex
CREATE INDEX "OperationLog_productId_idx" ON "OperationLog"("productId");
