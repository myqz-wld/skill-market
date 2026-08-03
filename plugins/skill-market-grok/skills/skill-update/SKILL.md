---
name: skill-update
description: "Update one installed Grok Skill Market package while preserving local activation and native source provenance. Use for refresh, upgrade, reinstall, or update-available requests."
disable-model-invocation: true
---
# Skill Update for Grok

Use the installed plugin root in `GROK_PLUGIN_ROOT`. Run only `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Confirm one exact ID, then run `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" update grok:<plugin|standalone>:<kebab-case-name> [options] --json`. Applicable options: --read-repo-url, --base-ref, --cache-path, --cache-ttl-seconds, --repo-path, --allow-stale-head, --force, --confirm-drift, --confirm-source-change.

Requires a fresh eligible catalog unless an exact cached commit is explicitly pinned. Preserve disabled state and source provenance; drift/source/force flags require intent.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
