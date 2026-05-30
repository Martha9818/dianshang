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

### Cleanup Workflow Is Reminder-Only

- Status: DEFERRED
- Impact: The homepage/diagnostics can remind about cleanup, but no scan/delete workflow exists.
- Mitigation: Treat any cleanup implementation as a future approved thread with conservative data-safety rules.
