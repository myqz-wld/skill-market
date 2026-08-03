---
name: skill-update
description: "Update one installed Claude Skill Market package while preserving local activation and native scope. Use for refresh, upgrade, reinstall, or update-available requests."
disable-model-invocation: true
---
# Skill Update for Claude

Use the installed plugin root in `CLAUDE_PLUGIN_ROOT`. Run only `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs" update claude:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --read-repo-url, --base-ref, --cache-path, --cache-ttl-seconds, --repo-path, --allow-stale-head, --force, --confirm-drift, --confirm-source-change, --scope.

Requires a fresh eligible catalog unless an exact cached commit is explicitly pinned. Preserve disabled state and detected scope; drift/source/force flags require intent. Report the CLI restart warning.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
