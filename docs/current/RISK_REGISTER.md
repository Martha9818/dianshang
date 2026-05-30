# EcomPilot Risk Register

Keep only OPEN, MITIGATED, or DEFERRED risks here. Detailed historical risk text is archived.

| Risk | Status | Level | Mitigation |
| --- | --- | --- | --- |
| Scope drift into V1.5/V2 features | OPEN | High | Start from `THREAD_SCOPE_CHECKLIST.md`; require explicit thread approval. |
| Database migration or data repair damage | OPEN | High | Add new migrations only, evaluate backup needs, never reset real data. |
| File/database mismatch | OPEN | High | Use service-layer checks, friendly failures, diagnostics, and conservative cleanup. |
| API key, prompt, path, stack, or diagnostic leakage | OPEN | High | Sanitize frontend, logs, diagnostics, exports, backups, and docs. |
| Vercel write operations | OPEN | High | Keep runtime guards; Vercel remains preview-only/read-only. |
| AI output instability or overclaiming | OPEN | Medium | Validate structured output, keep manual fallback, label AI suggestions as reference-only. |
| AI cost estimate misunderstanding | MITIGATED | Medium | Treat costs as estimates and avoid detailed cost-report scope without approval. |
| Image permission misuse | OPEN | High | Store/show usage permission and keep publish/export permission-aware. |
| Backup without restore | DEFERRED | High | Keep restore labeled future work; do not imply full disaster recovery. |
| Encoding inconsistency | MITIGATED | Medium | Run `npm.cmd run encoding:check` after Chinese text/doc edits. |
| Windows Prisma or SQLite locks | OPEN | Medium | Stop conflicting processes when needed; normalize busy errors. |
| Build tracing runtime files | MITIGATED | Medium | Keep runtime-only filesystem code behind established patterns and guarded build. |
| Startup/current docs grow too long | MITIGATED | Medium | Keep active docs short and archive older detail. |
| Archive history misleading current work | OPEN | Medium | Do not read archives by default; current status and thread scope win conflicts. |
| Missing cache invalidation after writes | OPEN | Medium | Record path/tag invalidation or accepted stale-data risk for write paths. |
| Inspiration duplicate/import drift | MITIGATED | Medium | Use file hash dedupe and scan summaries. |
| Secret rotation after historical exposure | OPEN | High | Remove exposed outputs and rotate/revoke secrets at the provider. |
| Parallel thread scope mixing | OPEN | Medium | Keep one active thread; document interruptions separately. |
| GitHub history noise | MITIGATED | Medium | Prefer local commits and push only at approved milestones/refreshes/requests. |
