# EcomPilot Known Issues

Only unresolved or deferred issues live here. Fixed, closed, or non-issue history is archived.

## Open Or Deferred

### External AI Success Depends On User Credentials

- Status: OPEN
- Impact: AI generation can fail without valid provider credentials or a reachable endpoint.
- Mitigation: Keep manual workflows available and AI errors friendly.

### Vercel Preview Is Read-Only

- Status: DEFERRED / INTENDED LIMITATION
- Impact: Preview cannot validate real SQLite writes, uploads, exports, backups, logs, or local AI calls.
- Mitigation: Validate write flows in Windows local runtime.

### Restore Workflow Is Not Implemented

- Status: DEFERRED
- Impact: Manual backup exists, but restore is not available through the app UI.
- Mitigation: Keep restore labeled as future work and avoid implying full disaster recovery.

### Vercel Recovery Codes Existed In Git History

- Status: OPEN OPERATIONAL FOLLOW-UP
- Impact: The file is removed from the current tree, but account-side rotation/revocation remains the safe closeout.
- Mitigation: Rotate or revoke the affected recovery codes in the provider account.

### Remaining V1.5 Threads Are Not Implemented Yet

- Status: DEFERRED / PLANNED SCOPE
- Impact: V1.5 Thread 01, Thread 02, and Thread 03 are implemented, but Thread 04-09 still require separately approved threads.
- Mitigation: Do not imply these are available until their thread ships and is verified locally.

### Screenshot Recognition Depends On Vision-Capable AI Credentials

- Status: OPEN
- Impact: Screenshot upload and draft history can work locally, but AI recognition can fail if no valid vision-capable provider is configured.
- Mitigation: AI failure is isolated to `ScreenshotRecognitionJob`; users can keep/upload screenshots and manually edit or retry drafts.

### V1-Plus File Cleanup Must Not Be Rebuilt In V1.5

- Status: DEFERRED / BOUNDARY
- Impact: V1.5 Thread 05 image dedupe and Thread 08 assistant reminders could be confused with cleanup execution.
- Mitigation: Use the existing V1-Plus Thread 06 file cleanup/trash flow for deletion or trash movement; V1.5 should only detect, suggest, remind, or link unless a later explicit scope changes this.
