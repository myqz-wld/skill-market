---
name: skill-market
description: "Browse available Grok Skill Market packages, list local inventory, inspect configuration, and route explicit package changes or catalog proposals."
---
# Skill Market for Grok

Use the installed plugin root in `GROK_PLUGIN_ROOT`. Run only `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`.
Default to `grok`; use other adapters only when explicitly requested.
Never expand an operation to another adapter implicitly.

## Choose the task

- Installed/active/disabled/broken packages, ownership, history or update state:
  run `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" list --adapter grok [filters] --json`.
  This reads local native inventory, managed state and an existing cache only;
  it never clones, fetches or writes. Use `--history` for absent records.
- Available packages, browse/search or exact ID lookup:
  run `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" discover [quoted-query] --adapter grok [filters] --json`.
  Discovery may refresh its cache and report stale results with a warning;
  it never installs. Return the canonical ID and version, including prerelease labels.
- Configuration inspection: run `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" config show --json`;
  missing configuration stays in memory.
- Download/install/update/enable/disable/uninstall or configuration changes:
  load sibling `../skill-manage/SKILL.md` after the user requests that change.
- Catalog add/update/retire/remove or proposal/PR work:
  load sibling `../skill-propose/SKILL.md` after the user requests that workflow.

Use `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" help --json` for exact filters and options.
Keep local inventory and catalog discovery distinct even when both are requested.
A search request does not authorize installation, trust or configuration changes.

Parse stdout as JSON even on exit 1–4. Report the summary, data and warnings.
For `needs_confirmation`, show the exact condition and reuse existing explicit
authorization only if it covers that condition; otherwise ask before adding the
named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`;
perform recovery only within scope and retry only when `retryable` is true.
Never hand-edit Skill Market config, cache, managed/proposal state or installed
package paths, or reproduce its filesystem, Git or native-plugin mechanics.
