---
name: skill-uninstall
description: "Uninstall one exact Claude Skill Market package. Use for local removal while retaining standalone history and native persistent data by default."
disable-model-invocation: true
---
# Skill Uninstall for Claude

Use the installed plugin root in `CLAUDE_PLUGIN_ROOT`. Run only `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs" uninstall claude:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --read-repo-url, --cache-path, --repo-path, --adopt, --confirm-drift, --scope, --remove-data.

Already absent is a no-op and standalone history remains. Preserve native scope and data; use --remove-data only after explicit approval.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
