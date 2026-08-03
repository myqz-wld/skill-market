---
name: skill-discover
description: "Browse or search the Claude Skill Market catalog without installing packages. Use to find available plugins or standalone skills, inspect catalog status, or resolve a stable package id."
---
# Skill Discover for Claude

Use the installed plugin root in `CLAUDE_PLUGIN_ROOT`. Run only `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Run `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs" discover [quoted-query] --adapter claude [--kind ...] [--status ...] [--latest|--offline] [--offset N] [--limit N] --json`. Omit the query to browse active entries; `--latest` and `--offline` are mutually exclusive; use `--adapter all` only when explicitly requested.

Normal discovery may refresh the catalog cache under its TTL and may return stale data with a warning, but source/ref mismatch blocks. Return canonical IDs exactly; do not inspect package bodies or install anything.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
