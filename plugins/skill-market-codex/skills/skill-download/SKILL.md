---
name: skill-download
description: "Download one exact Codex Skill Market plugin or standalone package without installing it. Use for an exported local copy or archive source."
---
# Skill Download for Codex

Resolve `<plugin-root>` as the parent of the `skills/` directory containing this loaded Skill. Run only `node "<plugin-root>/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "<plugin-root>/cli/bin/skill-market.mjs" download codex:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --read-repo-url, --base-ref, --cache-path, --cache-ttl-seconds, --repo-path, --allow-stale-head, --allow-deprecated, --destination, --force.

Writes only the managed downloads root and never installs. Matching content is a no-op; deprecated, stale-head, or overwrite flags require explicit intent.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
