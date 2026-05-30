# Agent Memory Archive Index

Archive files are not part of the default startup reading flow. Start with `AGENTS.md`, `CURRENT_STATUS.md`, `SESSION_LOG.md`, then `docs/current/DOC_INDEX.md`.

| Archive File | Historical Range | Read When | Default Startup Read |
| --- | --- | --- | --- |
| `agent-memory/archive/SESSION_LOG_2026-05_PRE_V1_CORE.md` | 2026-05 MVP reset through Thread 07/early Thread 08 closeout before the retained recent log range. Includes Thread 00 scaffold, Vercel setup, UI polish, Thread 01 products, scoring/copywriting/prompt/material/export/backup history, audits, and pre-V1-Core acceptance work. | Read only when investigating project initialization, MVP / Thread 00 baseline, Thread 01 product pool/detail/upload/soft delete behavior, old UI structure, Vercel preview setup, export/backup closeout, or pre-V1-Core regressions. | No |
| `agent-memory/archive/SESSION_LOG_2026-05_SESSION_LOG_OVERFLOW.md` | Late MVP closeout, Memory-Docs-Governance-01, V1-Core-01/V1-Core-02 transition, and older UI polish entries moved out when active `SESSION_LOG.md` retention was tightened to 10 tasks. | Read only when investigating the V1-Core transition, memory governance history, V1-Core-01/V1-Core-02 handoff, or older UI polish context not retained in active memory. | No |

## Conflict Rules

- If archived history conflicts with `agent-memory/CURRENT_STATUS.md`, follow `CURRENT_STATUS.md`.
- If old plans conflict with the current thread instructions, follow the current thread scope.
- If safety rules conflict, use the stricter rule.
