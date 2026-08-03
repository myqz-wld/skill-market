---
name: skill-update
description: "Update one installed Codex Skill Market package while preserving standalone activation and using the confirmed native plugin reinstall path. Use for refresh, upgrade, reinstall, or update-available requests."
---
# Skill Update for Codex

Resolve `<plugin-root>` as the parent of the `skills/` directory containing this loaded Skill. Run only `node "<plugin-root>/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "<plugin-root>/cli/bin/skill-market.mjs" update codex:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --read-repo-url, --base-ref, --cache-path, --cache-ttl-seconds, --repo-path, --allow-stale-head, --force, --confirm-drift, --confirm-source-change, --confirm-reinstall.

Requires a fresh eligible catalog unless an exact cached commit is explicitly pinned. Preserve disabled state; drift/source/force flags require intent. A plugin update may request --confirm-reinstall and a new session.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
