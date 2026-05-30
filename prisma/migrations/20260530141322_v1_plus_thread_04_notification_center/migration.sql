-- V1-Plus Thread 04: lightweight in-app notification center.
CREATE TABLE "AppNotification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "relatedType" TEXT,
    "relatedId" TEXT,
    "actionUrl" TEXT,
    "dedupeKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME
);

CREATE UNIQUE INDEX "AppNotification_dedupeKey_key" ON "AppNotification"("dedupeKey");
CREATE INDEX "AppNotification_type_idx" ON "AppNotification"("type");
CREATE INDEX "AppNotification_level_idx" ON "AppNotification"("level");
CREATE INDEX "AppNotification_status_idx" ON "AppNotification"("status");
CREATE INDEX "AppNotification_createdAt_idx" ON "AppNotification"("createdAt");
CREATE INDEX "AppNotification_relatedType_relatedId_idx" ON "AppNotification"("relatedType", "relatedId");
