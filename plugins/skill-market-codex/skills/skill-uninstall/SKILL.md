---
name: skill-uninstall
description: "Uninstall one exact Codex Skill Market package. Use for local removal while retaining standalone history."
---
# Skill Uninstall for Codex

Resolve `<plugin-root>` as the parent of the `skills/` directory containing this loaded Skill. Run only `node "<plugin-root>/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "<plugin-root>/cli/bin/skill-market.mjs" uninstall codex:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --read-repo-url, --cache-path, --repo-path, --adopt, --confirm-drift.

Already absent is a no-op and standalone history remains. Adoption or drift requires confirmation; source options apply only to native-plugin provenance.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
