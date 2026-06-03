# EcomPilot Known Issues

Only unresolved or intentionally deferred issues live here.

## Open Or Deferred

### Root `npm test` Script Is Not Available

- Status: OPEN
- Impact: Final validation relies on command checks plus dedicated acceptance scripts instead of a root test runner.
- Mitigation: Use the documented verification commands and `npm run thread09:verify`.

### Vercel Preview Is Read-Only

- Status: DEFERRED / INTENDED LIMITATION
- Impact: Preview cannot validate real SQLite writes, uploads, exports, backups, logs, file cleanup, API image generation, or Electron POC execution.
- Mitigation: Accept those flows only on Windows local runtime.

### Inspiration Source Folder Scan Cost Grows With Accumulation

- Status: OPEN
- Impact: The current inspiration scan flow still re-enumerates the source folder and re-hashes each file, so scan time can grow as source images accumulate.
- Mitigation: Treat processed-source governance as a future design topic; do not “solve” it by unsafe auto-delete.

### Link Import Is Still Available As A Standalone Route

- Status: OPEN / INTENDED LIMITATION
- Impact: Until V1.6 navigation and page-expression updates are complete, some users may still mistake link import for a stable platform parser.
- Mitigation: Keep it downgraded in copy and routing, and steer users toward screenshot or manual text intake.

### Restore Workflow Is Not Implemented

- Status: DEFERRED
- Impact: Manual backup exists, but the app still has no in-app restore flow.
- Mitigation: Keep restore explicitly in V2 planning only.

### External AI Success Depends On Valid Provider Credentials

- Status: OPEN
- Impact: Screenshot recognition, competitor analysis, inspiration AI drafts, copywriting AI, assistant intent parsing, and optional legacy API image generation can fail without valid provider settings.
- Mitigation: Keep manual workflows available and keep AI failure isolated.

### Electron Remains POC-Only

- Status: OPEN / INTENDED LIMITATION
- Impact: The Electron directory validates technical feasibility only; it is not a formal Windows desktop app.
- Mitigation: Treat it as a removable experiment until V2 formally opens desktop scope.

### Assistant Search Is Rules-First

- Status: OPEN / INTENDED LIMITATION
- Impact: `/assistant` can degrade to generic safe suggestions instead of deep semantic retrieval.
- Mitigation: Keep AI optional, rule fallback available, and let users continue from destination pages with manual filters.

### Competitor Search Still Routes Through Product Views

- Status: OPEN / INTENDED LIMITATION
- Impact: There is still no standalone competitor list route for cross-product competitor browsing.
- Mitigation: Use `/products` as the safe entry and inspect competitor tabs from product detail pages.
