# Usage

Use the three management skills for conversational requests. The bundled CLI
performs catalog, filesystem, state and native-adapter operations; a global
`skill-market` executable is not needed.

## Command and Result Contract

From a repository checkout, inspect the authoritative machine-readable help:

```bash
mise exec -- npm run --silent cli -- help --pretty
```

It defines all command options, configuration defaults, environment variables,
result fields and exit codes. `--pretty` changes indentation only. Parse the one
JSON object on stdout even when the command exits unsuccessfully; `--silent`
suppresses npm's script banner.

| Command | Effect |
|---|---|
| `list` | Read local inventory, ownership, activation, drift and update state |
| `discover [query]` | Browse or search the catalog, optionally refreshing its cache |
| `download <id>` | Export an exact package below the downloads root |
| `install <id>` / `update <id>` | Change the selected package, preserving native scope and activation |
| `enable <id>` / `disable <id>` | Change local activation where supported |
| `uninstall <id>` | Remove the selected package and retain standalone history |
| `config show/set/unset` | Inspect configuration or change an explicit key |
| `proposal plan/prepare/status/submit/abort` | Prepare and manage a resumable catalog proposal |

Package IDs have the form `<adapter>:<kind>:<name>`, for example
`codex:standalone:project-bootstrap`. Use the exact ID returned by discovery.

```bash
mise exec -- npm run --silent cli -- list --adapter codex --pretty
mise exec -- npm run --silent cli -- discover bootstrap --adapter all --kind standalone --pretty
```

`list` reports local native plugins and Skill Market-managed standalone packages. It never clones or refreshes the catalog.
`discover` browses or searches canonical catalog metadata. It may refresh its cache, but it never installs anything.

Errors include a stable code, retryability and `nextAction`. A confirmation flag
covers only the named condition. Unsupported operations stop; do not replace a
disabled capability with another mutation. Recovery must stay within the user's
scope and the returned retry contract.

## Configuration and Cache

Configuration is optional. Missing configuration uses in-memory defaults;
queries do not create a file just to persist defaults. Precedence is:

```text
command option > environment variable > config file > in-memory default
```

Use CLI help for supported keys, defaults and environment overrides. Inspect or
change configuration through the CLI:

```bash
mise exec -- npm run --silent cli -- config show --pretty
mise exec -- npm run --silent cli -- config set cacheTtlSeconds 3600 --pretty
mise exec -- npm run --silent cli -- config unset cacheTtlSeconds --pretty
```

`repoPath` is a local-checkout override that bypasses cache/network behavior.
`SKILL_MARKET_HOME` changes the state root; `SKILL_MARKET_CONFIG` changes the
configuration path. `cacheTtlSeconds: 0` disables automatic refresh and reports
cached data as stale. Discovery may return stale results with a warning after a
refresh failure; source/ref mismatches block.

Mutations do not silently use stale data. An offline mutation requires
`--allow-stale-head <exact-commit>` and a matching verified cached checkout.

## Versions and Local State

`catalog/entries.json` is the catalog source of truth. Its status and local state
are independent:

- Catalog: `active`, `deprecated`, `disabled`, `removed`.
- Local: `active`, `disabled`, `absent`, `broken`.

New installs accept active entries. Deprecated download/install requires explicit
acceptance; disabled and removed entries block. A prerelease such as
`0.0.1-draft.1` expresses maturity, not availability: it is installable when active.
The catalog holds one selected version per package, not parallel release channels.

Standalone state lives at `~/.skill-market/managed-state.json`. Skill Market manages
packages it installed or the user adopted; it does not scan unrelated skill
folders. Active/disabled content lives under each adapter's `skills/` and
`skills.disabled/` roots. Downloads default to
`~/.skill-market/downloads/<adapter>/<kind>/<name>/<version>`.

Standalone mutations use locks, containment checks, digests, atomic swaps and
rollback. An adapter root may link to an existing real directory; managed
descendants and dangling roots cannot be symlinks. Local drift, unmanaged
collisions, source changes and incomplete rollback require explicit confirmation
or recovery, not silent overwrite.

## Native Adapter Behavior

| Concern | Claude | Codex | Grok |
|---|---|---|---|
| Plugin install | Native selector; user/project/local scope | Native selector | Exact source path and explicit trust |
| Plugin update | Native update, preserving scope | Confirmed bounded remove/add; Git marketplaces refresh first | Native for remote sources; local sources use keep-data reinstall |
| Plugin enable/disable | Native except managed-policy scope | Unsupported | Native |
| Uninstall data | Kept unless `--remove-data` is authorized | Native remove behavior | Kept unless `--remove-data` is authorized |
| Apply update | Restart Claude Code | Start a new session | Follow the native result |

Standalone lifecycle behavior is shared across all three adapters. Updating a
disabled package leaves it disabled.

## Local Development and Proposals

For native development installs, replace the marketplace URL with the checkout
path. Grok installs the exact `plugins/skill-market-grok` subdirectory; inspect
that source before granting trust. This installs into real adapter state, so it
is not a test fixture or an automatic validation step.

Repository tests use temporary homes, fixture repositories and fake native/GitHub
operations. `npm run validate` checks catalogs, bundled CLI copies, package
resources and tests; CI runs the same gate.

`skill-propose` handles explicit catalog contributions. Preparation produces a
local validated commit; confirmed submission may create a fork, push and open a
PR. Bootstrap plugins are maintainer-owned and cannot propose themselves. See
[Contributing](../CONTRIBUTING.md#package-proposal-workflow) for the complete workflow.
