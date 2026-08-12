---
name: skill-install
description: "Install one exact Claude Skill Market plugin or standalone skill through the bundled CLI with catalog, source, scope, and adoption gates."
disable-model-invocation: true
---
# Skill Install for Claude

Use the installed plugin root in `CLAUDE_PLUGIN_ROOT`. Run only `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs" install claude:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --read-repo-url, --base-ref, --cache-path, --cache-ttl-seconds, --repo-path, --allow-stale-head, --allow-deprecated, --adopt, --scope.

Installs active entries from a fresh catalog by default. Deprecated install, adoption, or scope override requires explicit intent; preserve the detected user/project/local/managed scope and block mismatches.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
