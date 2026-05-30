# EcomPilot Known Issues

Use this file to track known limitations that remain after a thread. Keep entries short and actionable.

Use this file for deferred fixes, unresolved Patch follow-up, pending data-repair decisions, or post-incident secret-rotation follow-up when the problem is not fully closed yet.

## Current Known Issues

### External AI success depends on user credentials

- Status: Known limitation.
- Impact: AI generation may fail without valid provider credentials, but manual copywriting fallback remains available.
- Mitigation: Keep AI errors friendly and isolated from non-AI workflows.

### Vercel preview is read-only

- Status: Intended limitation.
- Impact: Preview can display degraded/read-only pages but cannot validate real SQLite writes, uploads, exports, backups, or logs.
- Mitigation: Final acceptance for writes must happen in Windows local runtime.

### Restore is not implemented

- Status: Future work.
- Impact: Manual backup exists, but users cannot restore from the app UI yet.
- Mitigation: Keep backup restore clearly labeled as future work and do not imply full disaster recovery.

### Vercel recovery codes existed in Git history

- Status: Operational risk.
- Impact: The file is removed from the current tree, but historical exposure still requires account-side rotation/revocation.
- Mitigation: Rotate/revoke recovery codes in the Vercel account.

### V1-Core is feature-frozen after final acceptance

- Status: Intended limitation.
- Impact: Net-new product behavior should not be added to V1-Core after the final closeout commit.
- Mitigation: Route enhancements such as search, notifications, scheduled scanning, OCR, link parsing, restore, and Electron into V1-Plus / V1.5 / V2 planning.

## Known Issue Template

### Issue ID

For example: `KI-001`

### Found In

Version where the issue was discovered.

### Origin Version

Version where the issue likely started.

### Severity

`P0 / P1 / P2 / P3 / P4`

### Description

What is wrong.

### Impact

What is affected.

### Workaround

Temporary way to reduce impact.

### Planned Fix

Planned patch or future version.

### Status

`open / investigating / deferred / fixed`
