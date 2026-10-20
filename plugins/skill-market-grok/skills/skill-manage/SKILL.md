---
name: skill-manage
description: "Download, install, update, enable, disable or uninstall an exact Grok Skill Market package, or change explicitly requested local configuration."
disable-model-invocation: true
---
# Skill Manage for Grok

Use the installed plugin root in `GROK_PLUGIN_ROOT`. Run only `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`.
Default to `grok` and preserve explicit adapter/package targets.
Confirm the requested operation and exact canonical ID from the conversation or
query results. Reuse an already unambiguous request; ask when the target or effect
is unresolved. Do not infer permission to update every installed package.

## Select the operation

| CLI command | Intended effect |
|---|---|
| `download` | Export an exact package below the managed downloads root; do not install |
| `install` | Install the selected native plugin or managed standalone package |
| `update` | Update the installed package, preserving activation and native scope |
| `enable` | Activate the installed package where supported |
| `disable` | Deactivate while preserving files and data |
| `uninstall` | Remove the package, retaining standalone history and native data by default |
| `config set` / `config unset` | Change only the requested key/value or remove that explicit setting |

Before selecting optional flags, read `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" help --json`; use
`commands.<operation>` and `lifecycle` for accepted options and adapter constraints.
Run `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" <operation> <adapter>:<kind>:<name> [options] --json`.
For configuration, use `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" config set <key> <value> --json`
or `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" config unset <key> --json`; configuration commands have no package ID.

Resolve unknown IDs/current state through sibling `../skill-market/SKILL.md`.
Catalog contribution requests belong to `../skill-propose/SKILL.md`.

## Preserve intent and native behavior

Download/install/update use a fresh eligible catalog by default. Do not silently
fall back to stale content; an offline override requires an explicitly selected
exact cached commit. An active prerelease is installable; show its version so the
user can distinguish it from a stable release. Disabled/removed entries block.

Adoption, deprecated acceptance, force/overwrite, local drift, source changes and
native data deletion require authorization covering that specific condition.
Pass only options applicable to the exact operation, adapter and package kind.
Enable/disable/uninstall do not fetch catalog content. Leave transactional
containment, locking, rollback and recovery to the CLI.

Inspect the exact Grok plugin source before requesting trust; only explicit
approval permits `--confirm-trust`. Preserve source provenance; a missing
or changed source needs the CLI's `--confirm-source-change` authorization.
Local-source updates may use a bounded reinstall preserving activation and
data. Uninstall keeps data unless `--remove-data` was explicitly authorized.

Parse stdout as JSON even on exit 1–4. Report the summary, data and warnings.
For `needs_confirmation`, show the exact condition and reuse existing explicit
authorization only if it covers that condition; otherwise ask before adding the
named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`;
perform recovery only within scope and retry only when `retryable` is true.
Never hand-edit Skill Market config, cache, managed/proposal state or installed
package paths, or reproduce its filesystem, Git or native-plugin mechanics.
