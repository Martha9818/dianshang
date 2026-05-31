-- CreateTable
CREATE TABLE "ImageGenerationJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "promptTaskId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "aiJobId" INTEGER,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quality" TEXT,
    "promptVersion" TEXT,
    "promptUse" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultMaterialId" INTEGER,
    "errorSummary" TEXT,
    "parameterSummaryJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImageGenerationJob_promptTaskId_fkey" FOREIGN KEY ("promptTaskId") REFERENCES "PromptTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImageGenerationJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImageGenerationJob_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AIJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ImageGenerationJob_resultMaterialId_fkey" FOREIGN KEY ("resultMaterialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ImageGenerationJob_promptTaskId_idx" ON "ImageGenerationJob"("promptTaskId");

-- CreateIndex
CREATE INDEX "ImageGenerationJob_productId_idx" ON "ImageGenerationJob"("productId");

-- CreateIndex
CREATE INDEX "ImageGenerationJob_aiJobId_idx" ON "ImageGenerationJob"("aiJobId");

-- CreateIndex
CREATE INDEX "ImageGenerationJob_resultMaterialId_idx" ON "ImageGenerationJob"("resultMaterialId");

-- CreateIndex
CREATE INDEX "ImageGenerationJob_status_idx" ON "ImageGenerationJob"("status");

-- CreateIndex
CREATE INDEX "ImageGenerationJob_provider_idx" ON "ImageGenerationJob"("provider");

-- CreateIndex
CREATE INDEX "ImageGenerationJob_model_idx" ON "ImageGenerationJob"("model");

-- CreateIndex
CREATE INDEX "ImageGenerationJob_createdAt_idx" ON "ImageGenerationJob"("createdAt");
