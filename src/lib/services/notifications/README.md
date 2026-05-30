# Notification Service

V1-Plus Thread 04 adds a lightweight in-app notification center.

- `src/lib/services/notificationService.ts` is the only creation entry for `AppNotification`.
- Notification writes are local-runtime only; preview write attempts return the shared read-only message.
- Notification text reuses existing log/diagnostic/AI sanitizers before persistence.
- Action URLs are limited to safe in-app routes and never point to `/api`, external URLs, or local files.
- This module does not implement Windows notifications, Electron notifications, browser Push, WebSocket, queues, or background workers.
