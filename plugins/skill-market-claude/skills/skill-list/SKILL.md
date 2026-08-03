---
name: skill-list
description: "List local Claude Skill Market plugins and managed standalone skills without refreshing the catalog. Use for installed, active, disabled, broken, ownership, history, or update-state inventory questions."
---
# Skill List for Claude

Use the installed plugin root in `CLAUDE_PLUGIN_ROOT`. Run only `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Run `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs" list --adapter claude [filters] --json`. Filters: `--kind`, `--local-state`, `--ownership`, `--update-state`, `--history`, `--offset`, and `--limit`; comma-separate enum values.

Default to active, disabled, and broken items. Add `--history` for absent history; use `--adapter all` only when explicitly requested. The command reads native plugin inventory, managed standalone state, and an existing cache only; it never clones, fetches, or writes.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
