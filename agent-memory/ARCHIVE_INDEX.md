# Agent Memory Archive Index

Archive files are not part of the default startup flow. Start with `AGENTS.md`, `CURRENT_STATUS.md`, `SESSION_LOG.md`, then `docs/current/DOC_INDEX.md`.

## V1.5 Closeout

| Archive File | Historical Range | Read When |
| --- | --- | --- |
| `agent-memory/archive/V1_5_THREAD09_CLOSEOUT_DETAIL_ARCHIVE_2026-05-31.md` | Detailed Thread 00-08 summaries, previous active session detail, previous active patch detail, and pre-closeout thread-scope detail moved during Thread 09. | Read only when final V1.5 implementation detail is explicitly needed beyond current summaries. |
| `agent-memory/archive/V1_5_DATABASE_CHANGELOG_DETAIL_ARCHIVE_2026-05-31.md` | Field-level migration detail moved out of the active `DATABASE_CHANGELOG.md` during Thread 09 slimming. | Read only when migration-by-field history is explicitly needed. |
| `agent-memory/archive/V1_CORE_UNDERSTANDING_CHECK_DETAIL_ARCHIVE_2026-05-31.md` | The longer V1-Core user-facing walkthrough moved out of the active capability index during Thread 09. | Read only when the short V1-Core index is insufficient. |

## V1.5 Baseline

| Archive File | Historical Range | Read When |
| --- | --- | --- |
| `agent-memory/archive/V1_5_BASELINE_SESSION_LOG_ARCHIVE_2026-05-31.md` | Previous active session-log summaries moved during V1.5 Thread 00. | Read only when V1-Plus Thread 02-07 summary detail is explicitly needed. |
| `agent-memory/archive/V1_5_BASELINE_PATCH_LOG_ARCHIVE_2026-05-31.md` | Patch summaries moved from the active patch log during V1.5 Thread 00. | Read only when older baseline patch detail is explicitly needed. |
| `agent-memory/archive/V1_5_BASELINE_CHANGELOG_HISTORY_ARCHIVE_2026-05-31.md` | Version/thread changelog detail moved during V1.5 Thread 00. | Read only when V1-Plus per-thread changelog detail is explicitly needed. |
| `agent-memory/archive/V1_5_BASELINE_RISK_AND_ISSUE_ARCHIVE_2026-05-31.md` | V1.5 baseline risk/issue cleanup result. | Read only when auditing why resolved items were removed from active current docs. |

## V1-Plus Closeout

| Archive File | Historical Range | Read When |
| --- | --- | --- |
| `agent-memory/archive/V1_PLUS_RECENT_SESSION_LOG_DETAIL_ARCHIVE_2026-05-30.md` | Detailed copies of recent session entries before active-log compression. | Read only when a short active summary is insufficient. |
| `agent-memory/archive/V1_PLUS_SESSION_LOG_ARCHIVE_2026-05-30.md` | Older active session-log entries moved out during V1-Plus docs closeout. | Read only for older V1-Core and V1-Plus implementation detail. |
| `agent-memory/archive/V1_PLUS_CURRENT_DOCS_PRE_CLOSEOUT_SNAPSHOT_2026-05-30.md` | Pre-closeout snapshots of active docs. | Read only when reconstructing exact historical doc wording. |
| `agent-memory/archive/V1_PLUS_CHANGELOG_DEV_DETAIL_ARCHIVE_2026-05-30.md` | Detailed development changelog before it was condensed. | Read only when per-thread changelog detail is explicitly needed. |
| `agent-memory/archive/V1_PLUS_PATCH_LOG_DETAIL_ARCHIVE_2026-05-30.md` | Full pre-closeout patch-log detail. | Read only when older fixed patch detail is needed. |
| `agent-memory/archive/V1_PLUS_PATCH_LOG_ARCHIVE_2026-05-30.md` | Older patch summaries moved out of the active patch log. | Read only when investigating older fixed patches. |
| `agent-memory/archive/V1_PLUS_KNOWN_ISSUES_CLOSED_OR_NONISSUE_ARCHIVE_2026-05-30.md` | Known-issue entries removed because they were closed or no longer active issues. | Read only when auditing known-issue cleanup. |
| `agent-memory/archive/V1_PLUS_RISK_REGISTER_DETAIL_ARCHIVE_2026-05-30.md` | Detailed risk register before it was condensed. | Read only when historical risk wording is explicitly needed. |

## Older History

| Archive File | Historical Range | Read When |
| --- | --- | --- |
| `agent-memory/archive/SESSION_LOG_2026-05_PRE_V1_CORE.md` | MVP reset through Thread 07 / early Thread 08 closeout before V1-Core. | Read only for early MVP initialization or pre-V1-Core regressions. |
| `agent-memory/archive/SESSION_LOG_2026-05_SESSION_LOG_OVERFLOW.md` | Late MVP closeout, memory/docs governance, and V1-Core transition history. | Read only for older context not retained in active memory. |

## Conflict Rules

- If archived history conflicts with `agent-memory/CURRENT_STATUS.md`, follow `CURRENT_STATUS.md`.
- If archived plans conflict with the current thread instructions, follow the current thread scope.
- If safety rules conflict, follow the stricter rule.
