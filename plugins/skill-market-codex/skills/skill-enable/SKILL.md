---
name: skill-enable
description: "Enable one installed Codex Skill Market package without fetching catalog content. Use to restore a disabled standalone skill or invoke native plugin enable when supported."
---
# Skill Enable for Codex

Resolve `<plugin-root>` as the parent of the `skills/` directory containing this loaded Skill. Run only `node "<plugin-root>/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "<plugin-root>/cli/bin/skill-market.mjs" enable codex:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --confirm-drift.

This idempotent local operation never fetches. Standalone drift requires confirmation. Codex plugins return unsupported; never substitute uninstall.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
