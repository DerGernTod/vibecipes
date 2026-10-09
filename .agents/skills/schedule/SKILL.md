---
name: schedule
description: >-
  Turn the Noodle backlog into orders. Use when the loop asks for scheduling, when orders are empty,
  after backlog changes, or when recent history suggests re-evaluating what to run next.
schedule: "When orders are empty, after backlog changes (new, closed, or relabelled issues), or when session history suggests re-evaluation. Only writer of orders-next.json."
---

# Schedule

Read project state and write `.noodle/orders-next.json`. Never write `orders.json` directly; the loop promotes it.

## Inputs

1. `.noodle/mise.json`: backlog, active sessions, recent history, resources, routing defaults, task types.
2. `noodle schema orders`: the canonical orders schema. Re-run it if unsure about a field.
3. `.noodle.toml`: `routing.defaults` gives the provider and model for stages.

## Backlog semantics

The backlog is GitHub Issues, synced by `adapters/backlog-sync`.

- `id` is the issue number. `tags` are issue labels. `status` is `open`.
- Eligible for execution: has the `ready-for-agent` label.
- Never schedule: `wontfix`, any `wayfinder:*` label (those are human-driven grilling, research, or map tickets), or any item with `needs-info` or `ready-for-human`.
- Items that need a human decision: list the id in `action_needed` with a one-line reason. Do not order them.
- Before ordering an item, read its spec: `gh issue view <id> --comments`. Honour any `Blocked by: #<n>` line or open blocking dependency. Skip blocked items and say so in `action_needed`.

## Choosing what to run

1. Skip any id already present in `active_summary` or `orders` in the current state. Never duplicate an active order.
2. Respect `resources.available`. Do not emit more orders than there are free slots, except for orders that will queue behind dependencies.
3. Order by dependency first: if one issue's spec says it is a prerequisite for another, schedule the prerequisite first. Then by the priority the issue states; if none, by lowest issue number.
4. Group related stages into one order; use separate orders only for independent items.

## Writing orders

One order per backlog item:

- `id`: the issue number as a string.
- `title`: the issue title.
- `rationale`: cite the rule used, e.g. "dependency-first: #12 blocks #15" or "ready-for-agent, no open blockers".
- `stages`: a single `execute` stage with `do: "execute"`. Omit `with`/`model` unless the issue explicitly requires a different provider or model; routing defaults apply.
- `prompt`: only when the issue body lacks enough context for the cook to start. Otherwise leave it empty and let the execute skill read the issue.
- `extra_prompt`: only for scoping constraints from the issue (e.g. "touch only the server layer"). Keep under ~1000 characters.

Write the full file to `.noodle/orders-next.json`. Then check it against `noodle schema orders` before finishing. If nothing is eligible, write `{"orders": [], "action_needed": [...]}`.

## Constraints

- Do not put issue-specific detail into this skill file.
- Do not add `status` or `skill` fields; the loop sets them.
- Do not comment on, label, or close issues from this skill. Scheduling is read-only against GitHub.
