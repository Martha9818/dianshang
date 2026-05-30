-- CreateTable
CREATE TABLE "CleanupLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "fileScope" TEXT NOT NULL,
    "originalRelativePath" TEXT,
    "trashRelativePath" TEXT,
    "fileSize" INTEGER,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "CleanupLog_action_idx" ON "CleanupLog"("action");

-- CreateIndex
CREATE INDEX "CleanupLog_fileScope_idx" ON "CleanupLog"("fileScope");

-- CreateIndex
CREATE INDEX "CleanupLog_status_idx" ON "CleanupLog"("status");

-- CreateIndex
CREATE INDEX "CleanupLog_createdAt_idx" ON "CleanupLog"("createdAt");

-- CreateIndex
CREATE INDEX "CleanupLog_originalRelativePath_idx" ON "CleanupLog"("originalRelativePath");

-- CreateIndex
CREATE INDEX "CleanupLog_trashRelativePath_idx" ON "CleanupLog"("trashRelativePath");
