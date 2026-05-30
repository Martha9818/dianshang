# Agent Memory Archive Index

Archive files are not part of the default startup reading flow. Start with `AGENTS.md`, `CURRENT_STATUS.md`, `SESSION_LOG.md`, then `docs/current/DOC_INDEX.md`.

| Archive File | Historical Range | Read When | Default Startup Read |
| --- | --- | --- | --- |
| `agent-memory/archive/V1_PLUS_RECENT_SESSION_LOG_DETAIL_ARCHIVE_2026-05-30.md` | Detailed copies of the 10 recent session entries before active-log compression. | Read only when a recent short summary is insufficient. | No |
| `agent-memory/archive/V1_PLUS_SESSION_LOG_ARCHIVE_2026-05-30.md` | Older active session-log entries moved out during V1-Plus docs closeout. | Read only when investigating V1-Core-07, diagnostics compact patch, V1-Core-06 through Thread 08 closeout details no longer retained in active log. | No |
| `agent-memory/archive/V1_PLUS_CURRENT_DOCS_PRE_CLOSEOUT_SNAPSHOT_2026-05-30.md` | Pre-closeout snapshots of AGENTS, current status, doc index, project map, architecture rules, thread checklist, known issues, and risk register. | Read only when reconstructing the exact pre-closeout documentation wording. | No |
| `agent-memory/archive/V1_PLUS_CHANGELOG_DEV_DETAIL_ARCHIVE_2026-05-30.md` | Detailed development changelog before it was condensed to version-level summaries. | Read only when per-thread changelog detail is explicitly needed. | No |
| `agent-memory/archive/V1_PLUS_PATCH_LOG_DETAIL_ARCHIVE_2026-05-30.md` | Full pre-closeout patch log detail before active patch compression. | Read only when recent patch summaries need root-cause/detail context. | No |
| `agent-memory/archive/V1_PLUS_PATCH_LOG_ARCHIVE_2026-05-30.md` | Older patch summaries moved out of active patch log. | Read only when investigating older fixed patches. | No |
| `agent-memory/archive/V1_PLUS_KNOWN_ISSUES_CLOSED_OR_NONISSUE_ARCHIVE_2026-05-30.md` | Known-issue entries removed because they were closed, resolved, or stable rules rather than unresolved issues. | Read only when auditing known-issue cleanup. | No |
| `agent-memory/archive/V1_PLUS_RISK_REGISTER_DETAIL_ARCHIVE_2026-05-30.md` | Detailed risk register before it was condensed to OPEN / MITIGATED / DEFERRED entries. | Read only when historical risk wording is explicitly needed. | No |
| `agent-memory/archive/SESSION_LOG_2026-05_PRE_V1_CORE.md` | MVP reset through Thread 07 / early Thread 08 closeout before V1-Core. | Read only for old MVP initialization, early Vercel, product/scoring/copywriting/prompt/material/export/backup history, or pre-V1-Core regressions. | No |
| `agent-memory/archive/SESSION_LOG_2026-05_SESSION_LOG_OVERFLOW.md` | Late MVP closeout, Memory-Docs-Governance-01, V1-Core-01/V1-Core-02 transition, and older UI polish. | Read only for V1-Core transition or older UI polish context not retained in active memory. | No |

## Conflict Rules

- If archived history conflicts with `agent-memory/CURRENT_STATUS.md`, follow `CURRENT_STATUS.md`.
- If old plans conflict with the current thread instructions, follow the current thread scope.
- If safety rules conflict, use the stricter rule.
