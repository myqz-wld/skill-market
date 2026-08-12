---
name: skill-enable
description: "Enable one installed Claude Skill Market package without fetching catalog content. Use to restore a disabled standalone skill or invoke native plugin enable when supported."
disable-model-invocation: true
---
# Skill Enable for Claude

Use the installed plugin root in `CLAUDE_PLUGIN_ROOT`. Run only `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs" enable claude:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --read-repo-url, --cache-path, --repo-path, --confirm-drift, --scope.

This idempotent local operation never fetches. Standalone drift requires confirmation; preserve the detected native-plugin scope.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
