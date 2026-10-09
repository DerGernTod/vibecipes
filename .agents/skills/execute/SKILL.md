---
name: execute
description: >-
  Implement one backlog item end to end in an isolated Noodle worktree: read the issue, change code,
  verify, commit, and merge back. Use when a cook session is dispatched for a GitHub issue.
schedule: "When backlog items labelled ready-for-agent are ready for implementation and have no open blockers."
---

# Execute

The order's prompt and the linked issue define the task. This skill defines how to do it.

## Context to load first

1. The issue: `gh issue view <id> --comments`. Treat the issue body and its latest comments as the spec.
2. `CONTEXT.md`: domain terms. Use them in code and commit messages.
3. `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`: tracker conventions.
4. Relevant ADRs in `docs/adr/` if the change touches a decision they record.

## Worktree workflow

Never edit the main checkout directly. Never commit on the integration branch.

1. Create: `noodle worktree create issue-<id>`. Add `--from <ref>` only if the issue names a base.
2. Run every command inside the worktree with `noodle worktree exec issue-<id> <command...>`.
3. Install dependencies once in the worktree: `noodle worktree exec issue-<id> pnpm install --frozen-lockfile`.
4. Merge when done: `noodle worktree merge issue-<id>`. If the merge conflicts, stop, leave the worktree in place, and report the conflicting files. Do not force-merge or reset.
5. Clean up after a successful merge: `noodle worktree cleanup issue-<id>`.

## Verification

Run these inside the worktree before committing. All must pass.

- `pnpm typecheck`
- `pnpm test`
- `pnpm build` when the change touches the server build or client bundle entry points.

If a test you did not touch fails before your change, record it in the report. Do not fix unrelated failures.

For UI changes, start the app with `pnpm dev` and exercise the changed view in a browser. Tests alone do not prove a UI change works.

## Commits

- Match the existing history: conventional prefix and scope, e.g. `feat(recipes): ...`, `fix(ui): ...`, with the issue number in parentheses: `(#<id>)`.
- Keep commits focused. One logical change per commit.
- Stage only files you changed. Never stage or revert changes you did not make. The main checkout may hold unrelated user work.

## Scope discipline

- Implement what the issue asks. Do not add features, refactors, or cleanup outside it.
- If the issue is ambiguous or conflicts with `CONTEXT.md` or an ADR, stop and report the question rather than guessing.
- If the work needs a human decision, stop before merging and report it.

## Reporting

Post a short summary to the issue with `gh issue comment <id> --body "..."`: what changed, the verification run, and anything left out. Do not close the issue yourself.
