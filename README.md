# Skill Market

A repository-backed marketplace for Claude, Codex and Grok plugins and standalone
skills. Each adapter has a native plugin with three management skills and a bundled
CLI. No hosted registry or global Skill Market executable is required.

Browse the generated [skill catalog](skills/INDEX.md) for available standalone
packages, versions and paths. An active prerelease is installable; the catalog
selects one version per package.

## Install

Requires Node.js 20+, Git and the selected adapter CLI. GitHub CLI (`gh`) is needed
only for submitting proposals.

Claude:

```bash
claude plugin marketplace add https://github.com/myqz-wld/skill-market.git
claude plugin install skill-market-claude@skill-market --scope user
```

Codex:

```bash
codex plugin marketplace add https://github.com/myqz-wld/skill-market.git
codex plugin add skill-market-codex@skill-market
```

Grok: register the marketplace, inspect the exact plugin source, then approve trust.

```bash
grok plugin marketplace add https://github.com/myqz-wld/skill-market.git
grok plugin install "https://github.com/myqz-wld/skill-market.git#plugins/skill-market-grok" --trust
```

## Use

Invoke through your adapter's skill interface:

| Skill | Purpose |
|---|---|
| `skill-market` | List installed packages, search the market, inspect configuration |
| `skill-manage` | Download, install, update, enable, disable, uninstall or change configuration |
| `skill-propose` | Prepare and optionally submit a catalog contribution |

From a repository checkout, inspect the complete command/option/result contract
or run a query:

```bash
mise exec -- npm run --silent cli -- help --pretty
mise exec -- npm run --silent cli -- list --adapter codex --pretty
mise exec -- npm run --silent cli -- discover --adapter all --kind standalone --pretty
```

| Command | Effect |
|---|---|
| `list` | Read local native plugins and managed standalone packages; no catalog refresh or mutation |
| `discover [query]` | Search catalog metadata; may refresh the cache, never installs |
| `download <id>` | Export an exact package below the downloads root |
| `install <id>` / `update <id>` | Change an exact package, preserving native scope and activation |
| `enable <id>` / `disable <id>` | Change activation where supported |
| `uninstall <id>` | Remove a package; retain standalone installation history |
| `config show/set/unset` | Inspect configuration or change an explicit key |
| `proposal plan/prepare/status/submit/abort` | Manage a resumable catalog contribution |

Use the exact `<adapter>:<kind>:<name>` ID returned by discovery. Proposal
preparation creates a local validated commit; submission requires explicit
fork/push/PR authorization. See [Contributing](CONTRIBUTING.md#package-proposal-workflow).

The CLI emits one JSON object on stdout, including failures. Parse it even when
the exit code is nonzero. Errors include a stable code and `nextAction`.
`--pretty` changes indentation; npm's `--silent` suppresses its script banner.
Confirmation flags apply only to their named conditions. Use `--` before literal
positional values that start with `--`, or `--option=--value` for an option value.

## Configuration and State

Configuration is optional. `config show` works offline without creating a file.
Precedence is command option → environment → config file → bundled default.
CLI help lists all keys and environment overrides.

```bash
mise exec -- npm run --silent cli -- config show --pretty
mise exec -- npm run --silent cli -- config set cacheTtlSeconds 3600 --pretty
mise exec -- npm run --silent cli -- config unset cacheTtlSeconds --pretty
```

`repoPath` reads a local checkout without catalog fetching. `SKILL_MARKET_HOME`
changes the state root; `SKILL_MARKET_CONFIG` changes the configuration path.
`cacheTtlSeconds: 0` disables automatic refresh and marks cached data stale.
Discovery may return stale results with a warning after refresh failure; source
or ref mismatches block.

`download`, `install` and `update` require a fresh catalog or explicit acceptance
of an exact cached commit with `--allow-stale-head <commit>`. That option reads
offline and checks provenance and a clean checkout. Local `repoPath` and
catalog-free enable/disable/uninstall do not need it.

Catalog status (`active`, `deprecated`, `disabled`, `removed`) is independent of
local state (`active`, `disabled`, `absent`, `broken`). Deprecated download/install
requires explicit acceptance; disabled/removed entries block download/install/
update. Existing packages can still be enabled, disabled or uninstalled where supported.

Standalone state defaults to `~/.skill-market/managed-state.json`. Only installed
or explicitly adopted packages are managed; unrelated skill folders are not scanned.
Active/disabled content uses each adapter's `skills/` and `skills.disabled/` roots.
Downloads default to `~/.skill-market/downloads/<adapter>/<kind>/<name>/<version>`.
Changes use transactional rollback; local edits, unmanaged collisions and source
changes require the applicable confirmation. Follow returned recovery guidance.

## Adapter Behavior

Current CLI integration:

| Concern | Claude | Codex | Grok |
|---|---|---|---|
| Plugin install | Native selector; user/project/local scope | Native selector | Exact source and explicit trust |
| Plugin update | Native, preserving scope | Confirmed bounded remove/add; Git marketplaces refresh first | Native for remote sources; local sources use keep-data reinstall |
| Plugin enable/disable | Native except managed-policy scope | Unsupported | Native |
| Uninstall data | Kept unless `--remove-data` is authorized | Native remove behavior | Kept unless `--remove-data` is authorized |
| Apply update | Restart Claude Code | Start a new session | Follow native result |

Standalone skills support enable/disable on all three adapters. Updates preserve
activation; follow returned restart guidance.

## Development

Use the runtime in `mise.toml`:

```bash
mise install
mise exec -- npm run generate
mise exec -- npm run validate
```

[Contributing](CONTRIBUTING.md) owns source editing, versioning, validation and
proposal policy. [AGENTS.md](AGENTS.md) holds shared repository instructions;
[CLAUDE.md](CLAUDE.md) imports them. Runtime defaults derive from
`catalog/entries.json`; edit canonical sources and regenerate derived files.
