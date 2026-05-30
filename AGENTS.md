# AGENTS

## Purpose

This repository keeps a continuity-first workflow for future projects.

Every new task must resume from the latest documented project state instead of relying only on chat context.
After each completed task, the agent must:

1. update the task summary files
2. verify the code
3. safely clean transient files
4. commit locally when the task is ready to preserve
5. push to GitHub only at an approved milestone, when deployment needs a refresh, or when the user explicitly asks
6. confirm the active deployment target is updated when a push/deployment was part of the task

## Required Startup Workflow

At the beginning of every new task, always read these files in this order:

1. `AGENTS.md`
2. `agent-memory/CURRENT_STATUS.md`
3. `agent-memory/SESSION_LOG.md`

Do this before planning, coding, or answering detailed project questions.

If the documented status conflicts with the current repository state, inspect the codebase and update the memory files before continuing.

## Agent Memory Folder

All continuity notes must live in:

```text
agent-memory/
```

Required files:

- `agent-memory/CURRENT_STATUS.md`
- `agent-memory/SESSION_LOG.md`
- `agent-memory/MEMORY_POLICY.md`
- `agent-memory/ARCHIVE_INDEX.md`

Do not store continuity notes in random root files.

## Memory Size Control

- `AGENTS.md` stores long-term workflow rules only. Do not use it for detailed project history.
- `agent-memory/CURRENT_STATUS.md` stores the current project state only. Overwrite outdated details at the end of each task; do not append endlessly.
- Keep `agent-memory/CURRENT_STATUS.md` short, with the latest progress, direction, risks, and next step.
- `agent-memory/SESSION_LOG.md` stores only the most recent 10-20 tasks.
- Move older task logs to `agent-memory/archive/`.
- After archiving logs, update `agent-memory/ARCHIVE_INDEX.md`.
- Do not read `agent-memory/archive/` by default at task startup. Read archive files only when the current task explicitly needs older historical detail.
- If archived history conflicts with `agent-memory/CURRENT_STATUS.md`, follow `CURRENT_STATUS.md`.
- If an old plan conflicts with the current thread instructions, follow the current thread's approved functional scope.
- When safety rules conflict, follow the stricter rule.

## Project Documentation Reading Policy

At the beginning of every new task, still read the startup files first:

1. `AGENTS.md`
2. `agent-memory/CURRENT_STATUS.md`
3. `agent-memory/SESSION_LOG.md`

After the startup files, read:

4. `docs/current/DOC_INDEX.md`

Do not read every `docs/current/` file by default. Use `DOC_INDEX.md` to decide which project documents are relevant to the current task.

Default high-priority project documents:

- `docs/current/PROJECT_MAP.md`
- `docs/current/ARCHITECTURE_RULES.md`

Read these only when needed:

- `docs/current/RISK_REGISTER.md`: risk-sensitive tasks.
- `docs/current/THREAD_SCOPE_CHECKLIST.md`: before starting development threads.
- `docs/current/CHANGELOG_DEV.md`: when checking recent implementation history.
- `docs/current/PATCH_LOG.md`: patch tasks or historical bug investigations.
- `docs/current/DATABASE_CHANGELOG.md`: schema or migration tasks.
- `docs/current/KNOWN_ISSUES.md`: known-issue investigation or unresolved limitation tasks.

## Pre-Thread Safety Check

Before starting any development thread:

- Check whether the current git working tree is clean.
- If the working tree is not clean, explicitly state which task the existing changes belong to before continuing.
- Before touching database structure, filesystem writes, batch writes, or AI batch generation, confirm whether a backup is needed.
- Do not run destructive operations without first stating the risk.
- Do not reset the database unless the user explicitly confirms it is a disposable test database that may be cleared.

## Version Patch Workflow

- The project default is to maintain only the current latest mainline code.
- If a V1 or V1.5 historical issue is discovered during V2 or any later stage, do not go back to the old version to rebuild or redo the fix there.
- Open a Patch Thread on the current latest mainline instead, for example:
  - `V2-Patch-01`: fix V1 inspiration-scan duplicate import behavior.
  - `V2-Patch-02`: fix V1.5 image hash historical compatibility behavior.
- A Patch Thread only fixes the approved problem and must not add new features.
- If a database change is required, add a new migration only; never modify an old migration.
- Never reset the database as part of historical issue repair.
- If historical data may already be wrong, document whether the repair needs a data-fix script, manual review, or legacy / compatibility display handling.
- After a Patch Thread is completed, update `docs/current/PATCH_LOG.md` and `docs/current/CHANGELOG_DEV.md`; update `docs/current/DATABASE_CHANGELOG.md` if database work was required; update `docs/current/KNOWN_ISSUES.md` if any limitation remains.

## Core Dependency Policy

- Unless the current thread explicitly requires it, do not upgrade core dependencies such as Next.js, React, Prisma, Tailwind, TypeScript, the main AI SDK, or the main image-processing library.
- If a new dependency is required, document:
  - why it is needed
  - whether an existing dependency can already solve the problem
  - whether it affects Windows local runtime
  - whether it affects Vercel build behavior
  - whether `package-lock.json` changes
  - how the dependency addition will be verified

## Single Active Thread Policy

- Only one active development thread is allowed at a time.
- If a Patch, docs-governance insert, or urgent fix interrupts the current thread:
  - record the current thread pause point
  - state the inserted task name
  - update `agent-memory/SESSION_LOG.md` after the inserted task finishes
  - return to the original thread explicitly
  - do not mix two thread scopes into one commit description

## Module README Policy

- Do not put module README content in `AGENTS.md`.
- Do not put module README content in `agent-memory/`.
- Keep module README files next to the corresponding code module.
- Read a module README only when modifying that module.
- When adding or substantially changing a large module, add or update that module's README and link it from `docs/current/PROJECT_MAP.md`.

## Required End-Of-Task Summary Update

After every meaningful task, update the memory files before claiming completion.

### `agent-memory/CURRENT_STATUS.md`

This file should always contain the latest high-signal summary of the project.
Keep it short and overwrite outdated details.

It must include:

- current task progress
- current product direction
- latest completed work
- current blockers or risks
- exact next recommended step

### `agent-memory/SESSION_LOG.md`

Append a short dated entry after each completed task.
Each entry should include:

- date
- task handled
- files or systems changed
- verification performed
- deployment / push status
- next handoff note

## Required End-Of-Task Workflow

After finishing any implementation task, follow this order:

1. Update `agent-memory/CURRENT_STATUS.md`
2. Append to `agent-memory/SESSION_LOG.md`
3. Run verification commands that match the change
4. Clean only safe temporary files
5. Check `git status` and confirm only intended files are included
6. Commit the task-related changes with a concise message
7. Push to `origin main` only for an approved milestone, deployment refresh, history cleanup, or explicit user request
8. Confirm the active deployment target is updated when a push/deployment was part of the task
9. Report the commit SHA and the live deployment URL when a push/deployment was part of the task

## Verification Commands

Use project-appropriate verification commands.

If a project does not yet define them, document what was or was not verified before claiming completion.

## Shell Compatibility Rules

- This workspace runs commands in PowerShell by default.
- Do not use Bash-only command chaining such as `&&` in `exec_command` calls for this repository.
- Prefer one command per tool call when possible.
- If multiple PowerShell steps must run in one command, use PowerShell-compatible sequencing instead of Bash syntax.
- When giving future handoff notes, mention shell-specific pitfalls here rather than relying on chat memory alone.

## Safe Cleanup Policy

Run the project-appropriate local cleanup step at the end of each implementation task when one exists.

Cleanup has 2 different layers and they must not be mixed:

- temporary artifact cleanup
- old-solution code cleanup

Clean temporary or generated files when they are not needed after the task.

Do not delete source code, project data, configuration, documentation, or user-created assets unless the user explicitly asks for it.

## Git Rules

- Never leave completed task changes only in the local working tree
- Prefer local commits for small or intermediate tasks; push to GitHub at approved milestones, deployment refreshes, history cleanup tasks, or explicit user requests.
- If unrelated local changes exist, do not silently include them
- Ask before pushing mixed-scope changes
- Use clear commit messages
- Before rewriting published history, record the current commit SHA, confirm the working tree is clean, state the risk, and use `--force-with-lease` rather than a blind force push.

## Default Operating Principle

The default behavior for this repository is:

- resume from documented status
- finish the task
- update summaries
- verify
- safe-clean transient files
- commit locally when the task is ready to preserve
- push only at milestones or when explicitly requested
- confirm deployment state when a push/deployment is performed

Do not leave verified changes unstaged or uncommitted unless blocked by credentials, network failure, unrelated unapproved changes, or the user explicitly asks to pause before committing.
