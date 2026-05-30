# Agent Memory Policy

## Startup File Responsibilities

- `AGENTS.md`: long-term workflow rules and repository operating principles.
- `agent-memory/CURRENT_STATUS.md`: current project state, current boundaries, latest completed work, current risks, and exact next step.
- `agent-memory/SESSION_LOG.md`: recent task log for continuity across the last 10 meaningful tasks.

## Recommended Size

- Keep `CURRENT_STATUS.md` under 120 lines.
- Keep `SESSION_LOG.md` to the most recent 10 tasks.
- Do not store detailed project history in `AGENTS.md`.

## Archive Directory

Older continuity records live in:

```text
agent-memory/archive/
```

## Archive Rules

- Archive older logs by month, version, or module whenever `SESSION_LOG.md` would exceed 10 tasks.
- At task closeout, if appending the new entry creates an 11th task, archive the oldest entries until only 10 remain.
- After moving records into archive, update `agent-memory/ARCHIVE_INDEX.md`.
- Do not read archive files during default task startup.
- Read archive files only when the current task needs historical detail for initialization, regressions, old UI structure, or earlier module behavior.

## Conflict Rules

- `CURRENT_STATUS.md` takes priority over archive files.
- Current thread instructions take priority over old plans.
- When safety rules conflict, follow the stricter rule.

## Prohibited Memory Usage

- Do not write the full roadmap into agent memory.
- Do not paste long acceptance reports into `SESSION_LOG.md`.
- Do not paste detailed error logs into `SESSION_LOG.md`.
- Do not keep long historical timelines in `CURRENT_STATUS.md`.
