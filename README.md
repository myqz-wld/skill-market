# Skill Market

Skill Market is a repository-backed marketplace for Claude, Codex, and Grok plugins and standalone skills. Each adapter has its own native bootstrap plugin, backed by the same ten focused Skills and bundled zero-dependency CLI.

The Skills handle intent and confirmation; the CLI handles deterministic catalog, filesystem, native-plugin, Git, and GitHub work. No hosted service, registry API, global installer, or npm package is required.

## Supported Surface

| Adapter | Marketplace catalog | Bootstrap manifest | Standalone packages |
|---|---|---|---|
| Claude | `.claude-plugin/marketplace.json` | `plugins/skill-market-claude/.claude-plugin/plugin.json` | `skills/claude/` |
| Codex | `.agents/plugins/marketplace.json` | `plugins/skill-market-codex/.codex-plugin/plugin.json` | `skills/codex/` |
| Grok | `.grok-plugin/marketplace.json` | `plugins/skill-market-grok/.grok-plugin/plugin.json` | `skills/grok/` |

The adapters share catalog and result semantics, but native scopes, trust, activation, update, restart, and persistent-data behavior remain explicit adapter concerns. One adapter variant is never inferred from another.

Every package has a stable id, for example `codex:standalone:plantuml-diagrams`:

```text
<adapter>:<kind>:<name>
```

The public Skill surface is:

- `skill-market`
- `skill-list`
- `skill-discover`
- `skill-download`
- `skill-install`
- `skill-update`
- `skill-enable`
- `skill-disable`
- `skill-uninstall`
- `skill-propose`

`skill-list` and `skill-discover` are deliberately different:

- `list` reports local native plugins and Skill Market-managed standalone packages. It never clones or refreshes the catalog.
- `discover` browses or searches canonical catalog metadata. It may refresh the catalog cache under the configured policy, but it never installs anything.

There are no compatibility aliases for the former search or upload entry points.

## Requirements

- Node.js 20 or newer for the bundled CLI
- Git for catalog caching and proposal preparation
- The selected adapter CLI for native plugin inventory and lifecycle operations
- GitHub CLI (`gh`) only when submitting a prepared proposal

Repository development uses the Node version declared in `mise.toml`.

## Install the Bootstrap Plugin

Use the HTTPS repository for catalog reads. Configure push credentials separately only when submitting a proposal.

### Claude

```bash
claude plugin marketplace add https://github.com/myqz-wld/skill-market.git
claude plugin install skill-market-claude@skill-market --scope user
```

### Codex

```bash
codex plugin marketplace add https://github.com/myqz-wld/skill-market.git
codex plugin add skill-market-codex@skill-market
```

### Grok

Register the marketplace, inspect the exact plugin source, and then grant trust for that source:

```bash
grok plugin marketplace add https://github.com/myqz-wld/skill-market.git
grok plugin install "https://github.com/myqz-wld/skill-market.git#plugins/skill-market-grok" --trust
```

For local development, replace the repository URL with the checkout path. Grok installs the exact plugin subdirectory:

```bash
grok plugin marketplace add /path/to/skill-market
grok plugin install /path/to/skill-market/plugins/skill-market-grok --trust
```

Invoke the focused Skills through the adapter's normal Skill interface. The bundled CLI is an implementation detail of each bootstrap plugin; users do not need a global `skill-market` executable.

## Command Model

The repository copy can expose the exact machine-readable contract:

```bash
npm run cli -- help --pretty
```

Useful local-development examples:

```bash
npm run cli -- list --adapter codex --pretty
npm run cli -- discover planning --adapter all --kind standalone --pretty
npm run cli -- download codex:standalone:plantuml-diagrams --pretty
```

| Command | Purpose | Default external effect |
|---|---|---|
| `list` | Local inventory, ownership, activation, drift, and update state | Native read-only list commands |
| `discover [query]` | Browse or rank canonical catalog entries | Optional catalog-cache refresh |
| `download <id>` | Export one exact version without installing | Atomic write below the downloads root |
| `install <id>` | Install a native plugin or managed standalone package | Exact selected package only |
| `update <id>` | Update while preserving activation and native scope | Exact installed package only |
| `enable <id>` / `disable <id>` | Change activation without catalog fetch | Exact installed package only |
| `uninstall <id>` | Remove a package and retain standalone history | Exact installed package only |
| `proposal ...` | Plan, prepare, submit, inspect, or abort a catalog PR | Local until confirmed submit |
| `config ...` | Inspect or explicitly change configuration | `set` and `unset` write config |

Every invocation writes exactly one JSON object to stdout. `--pretty` changes indentation only. Consumers must parse JSON even on a nonzero exit:

| Exit | Status |
|---:|---|
| 0 | `ok` or `noop` |
| 1 | `error` |
| 2 | `needs_confirmation` |
| 3 | `blocked` |
| 4 | `unsupported` |

Failures include a stable error code, retryability, details, and a `nextAction`. Confirmation flags authorize only the condition named in that result.

## Configuration and Cache

Configuration is optional. Missing configuration uses in-memory defaults and is not created by `list`, `discover`, or another read merely to persist defaults.

Precedence is:

```text
command option > environment variable > config file > in-memory default
```

Defaults:

| Key | Default | Environment |
|---|---|---|
| `readRepoUrl` | `https://github.com/myqz-wld/skill-market.git` | `SKILL_MARKET_READ_REPO_URL` |
| `baseRef` | `main` | `SKILL_MARKET_BASE_REF` |
| `cachePath` | `~/.skill-market/cache/skill-market` | `SKILL_MARKET_CACHE_PATH` |
| `cacheTtlSeconds` | `86400` | `SKILL_MARKET_CACHE_TTL_SECONDS` |
| `repoPath` | `null` | `SKILL_MARKET_REPO_PATH` |

`SKILL_MARKET_HOME` changes the state root, and `SKILL_MARKET_CONFIG` changes the config-file path. An explicit `repoPath` is a local-development override that bypasses cache and network behavior.

Inspect or change explicit configuration through the CLI:

```bash
npm run cli -- config show --pretty
npm run cli -- config set cacheTtlSeconds 3600 --pretty
npm run cli -- config unset cacheTtlSeconds --pretty
```

`cacheTtlSeconds: 0` disables automatic refresh and reports cached data as stale. Discovery may return an existing stale cache with a warning after a refresh failure. Mutations do not silently use stale data: offline mutation requires `--allow-stale-head <exact-commit>`, which pins the catalog provenance.

## Catalog and State

`catalog/entries.json` is the execution source of truth. These files are deterministic generated views and must not be hand-edited:

- `.agents/plugins/marketplace.json`
- `.claude-plugin/marketplace.json`
- `.grok-plugin/marketplace.json`
- `skills/INDEX.md`

Catalog status and local state are orthogonal:

- Catalog status: `active`, `deprecated`, `disabled`, or `removed`
- Local state: `active`, `disabled`, `absent`, or `broken`

New installs accept active entries. Deprecated download/install requires `--allow-deprecated`; disabled and removed entries are blocked.

Standalone state uses schema version 2 at `~/.skill-market/managed-state.json`. Skill Market reconciles only packages it installed or the user explicitly adopted; it does not scan unrelated Skill directories. Active and disabled packages live under each adapter's canonical `skills/` and `skills.disabled/` roots.

Downloads default to:

```text
~/.skill-market/downloads/<adapter>/<kind>/<name>/<version>
```

Standalone mutations use locks, containment checks, content digests, atomic swaps, and rollback. An adapter root may link to an existing real directory, but managed descendants and dangling roots cannot be symbolic links. Drift, unmanaged collisions, source changes, and incomplete rollback produce explicit confirmation or recovery results instead of silent overwrite.

## Native Adapter Differences

| Concern | Claude | Codex | Grok |
|---|---|---|---|
| Plugin install | Native marketplace selector; user/project/local scope | Native marketplace selector | Exact catalog package path; explicit trust |
| Plugin update | Native update; preserves detected scope | Confirmed bounded remove/add; Git marketplaces refresh first | Native for remote sources; verified local sources use keep-data reinstall |
| Plugin enable/disable | Native except managed-policy scope | Unsupported; uninstall is never substituted | Native |
| Plugin uninstall data | Kept by default; `--remove-data` expands deletion | Native remove behavior | Kept by default; `--remove-data` expands deletion |
| Apply update | Restart Claude Code | Start a new Codex session | Follow native result |

Standalone install, update, enable, disable, and uninstall share the same transactional behavior on all three adapters. Updates preserve whether the package was active or disabled.

## Pull-Request Proposals

`skill-propose` supports `add`, `update`, `retire`, and `remove`. Every adapter/package tuple is an explicit target; the CLI never expands one target into other adapters. The resumable workflow is:

```bash
npm run cli -- proposal plan --spec ./proposal.json --pretty
npm run cli -- proposal prepare <proposal-id> --pretty
npm run cli -- proposal status <proposal-id> --pretty
npm run cli -- proposal submit <proposal-id> --confirm-external-effects --pretty
```

- `plan` validates targets, source digests, catalog state, versions, and the base commit.
- `prepare` creates an isolated worktree, regenerates catalog views, validates the package, and commits the exact diff without pushing.
- `submit` revalidates the commit and diff, then may authenticate, create or verify a fork, push the branch, and open or discover one PR. It requires `--confirm-external-effects`.
- `status` is read-only.
- `abort` removes local proposal artifacts; drift requires `--confirm-discard`, and pushed/submitted proposals cannot be aborted.

Bootstrap packages `skill-market-claude`, `skill-market-codex`, and `skill-market-grok` cannot be changed through proposals. They remain developer-maintained.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the proposal spec, versioning rules, and full contribution policy.

## Repository Layout

```text
catalog/entries.json                       # canonical machine-readable catalog
.agents/plugins/marketplace.json           # generated Codex marketplace
.claude-plugin/marketplace.json            # generated Claude marketplace
.grok-plugin/marketplace.json              # generated Grok marketplace
plugins/skill-market-{codex,claude,grok}/  # independent bootstrap packages
  cli/                                     # generated self-contained CLI bundle
  skills/                                  # ten thin adapter-specific Skills
skills/{codex,claude,grok}/                 # standalone packages
skills/INDEX.md                             # generated human-readable catalog
tooling/skill-market-cli/                   # canonical CLI source, tests, generators
```

The three checked-in plugin `cli/` directories are generated from one canonical source and must remain byte-identical.

## Development

```bash
mise install
npm run catalog:generate
npm run plugins:generate
npm run validate
```

`npm run validate` checks generated catalog views, checks all three packaged CLI bundles, and runs unit and isolated integration tests. Tests use temporary homes, local fixture repositories, fake native CLIs, and fake GitHub operations; they must not mutate real adapter or Skill Market state.

See [CONTRIBUTING.md](CONTRIBUTING.md) for source-of-truth, versioning, proposal, and validation rules.
