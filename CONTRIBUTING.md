# Contributing

Skill Market separates repository maintenance from resumable package proposals.
Maintainers may edit canonical sources in their working checkout and validate the
complete change. Contributors and installed management Skills use the proposal
workflow below. Neither route authorizes a push, pull request, or publication.

Claude, Codex, and Grok are equal first-class adapters. Their package targets are explicit and independent: never infer, generate semantically, or publish one adapter variant merely because another exists.

## Development Setup

The CLI is zero-dependency ESM and requires Node.js 20 or newer. This repository pins its development runtime in `mise.toml`.

```bash
mise install
mise exec -- npm run validate
```

Tests must use temporary homes, fixture repositories, fake native binaries, and fake GitHub operations. Never point a repository test at real `~/.skill-market`, `~/.claude`, `~/.codex`, or `~/.grok` mutation state.

## Sources of Truth

Edit the source column; regenerate or validate the derived column.

| Source | Derived artifacts |
|---|---|
| `catalog/entries.json` | `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `.grok-plugin/marketplace.json`, `skills/INDEX.md` |
| `tooling/skill-market-cli/package.json`, `bin/`, and `src/` | `plugins/skill-market-{codex,claude,grok}/cli/` |
| Explicit adapter package content | No semantic cross-adapter generation |

Run:

```bash
mise exec -- npm run generate
```

Do not hand-edit generated marketplace files, `skills/INDEX.md`, packaged CLI modules, or packaged CLI manifests. `mise exec -- npm run validate` fails when they drift.

## Maintainer Workflow

For direct repository maintenance:

1. Inspect the working diff and preserve unrelated changes.
2. Edit the exact native package sources, canonical catalog rows, CLI sources or tests.
3. Update affected versions according to the Version Policy.
4. Run `mise exec -- npm run generate`, then `mise exec -- npm run validate` and
   `git diff --check`.
5. Inspect the complete diff and actual distribution inputs before an authorized
   commit or publication. Direct publication to `main` still requires an explicit
   user request; never force-push.

This route does not require a clean checkout, proposal state, a temporary branch,
or an automatic commit. Use a proposal when its exact-source capture, isolated
commit and resumable submission are useful.

Keep standalone skills under `skills/<adapter>/<skill-name>/` throughout their
lifecycle. Record maturity in the catalog version: `0.0.1-draft.1`,
`0.0.1-draft.2`, then `0.0.1`. Register each native adapter explicitly.
Prerelease versions do not change availability: active entries can be installed;
use catalog status `disabled` when a package must be unavailable.

## Package Identity and Status

Every catalog entry uses:

```text
<adapter>:<kind>:<kebab-case-name>
```

Supported adapters are `claude`, `codex`, and `grok`. Supported kinds are `plugin` and `standalone`.

Catalog status is one of:

- `active`: available for normal discovery and new installation
- `deprecated`: retained but hidden from default discovery; new download/install needs explicit acceptance
- `disabled`: unavailable for install or update
- `removed`: tombstone retained after exact content removal

Catalog status is not local activation state. Do not use one as a substitute for the other.
An explicitly requested maintainer purge may delete a catalog row entirely.
The proposal `remove` action retains its documented tombstone behavior.

## Package Proposal Workflow

Use the bundled proposal CLI for contribution workflows and installed Skill
catalog changes. It owns exact version checks, generated catalogs, isolated Git
worktrees, changed-path allowlists, validation, commit creation, direct/fork
selection, and resumable PR submission.

Create a UTF-8 JSON spec:

```json
{
  "schemaVersion": 1,
  "action": "add",
  "summary": "Add an example skill",
  "targets": [
    {
      "id": "grok:standalone:example-skill",
      "sourcePath": "./candidate/example-skill",
      "version": "0.0.1",
      "description": "Use when an example workflow is requested.",
      "category": "Productivity",
      "keywords": ["example"]
    }
  ]
}
```

Then run:

```bash
mise exec -- npm run --silent cli -- proposal plan --spec ./proposal.json --pretty
mise exec -- npm run --silent cli -- proposal prepare <proposal-id> --pretty
mise exec -- npm run --silent cli -- proposal status <proposal-id> --pretty
```

Inspect the prepared targets, commit, diff hash, branch, validation results, and warnings. Only after authorizing fork/push/PR effects:

```bash
mise exec -- npm run --silent cli -- proposal submit <proposal-id> --confirm-external-effects --pretty
```

Submission never force-pushes. Repeating submit verifies the exact remote commit and resumes PR discovery instead of creating duplicate work.

Use `proposal abort <proposal-id>` for local planned or prepared work. Add `--confirm-discard` only after inspecting drift within the exact proposal-managed worktree. Pushed or submitted proposals cannot be aborted.

### Proposal Actions

| Action | Package files | Catalog result | Version/source requirements |
|---|---|---|---|
| `add` | Add exact target content | New active entry | Source, version, and description required |
| `update` | Replace exact target content | Preserve catalog status | Source and strictly greater version required |
| `retire` | Keep content | Set active entry to deprecated | Source and version forbidden |
| `remove` | Delete exact content | Keep removed tombstone | Source and version forbidden |

Every adapter variant must appear as a separate target. Proposal preparation rejects implicit targets, unknown fields, changed source content, nested Git metadata, dirty or changed bases, and paths outside the declared package/catalog scope.

## Version Policy

- The CLI runtime version lives in `tooling/skill-market-cli/package.json`.
  Canonical and packaged executables read that metadata; do not add a version
  constant or pin release values in tests.
- A new standalone package starts at `0.0.1` or a prerelease of that version.
- Increment the prerelease identifier while iterating; release `0.0.1` without
  moving its directory. Version maturity and catalog availability are independent.
- Updating a standalone package requires a version greater than its current catalog version.
- A plugin manifest name and version must match its catalog target.
- Any plugin package change, including bundled Skills or CLI artifacts, requires a plugin semver bump.
- Bootstrap plugin versions currently live in their native manifests and canonical catalog entries; generated marketplace versions follow the catalog.
- A shared CLI change bumps its runtime version and every affected bootstrap
  manifest/catalog pair. Adapter-only package changes need not change the CLI
  version. Tests compare these relationships rather than fixed version numbers.
- Never edit local installed versions in `~/.skill-market/managed-state.json` as part of a repository contribution.

## Package Layout

### Plugins

```text
plugins/<plugin-name>/.claude-plugin/plugin.json
plugins/<plugin-name>/.codex-plugin/plugin.json
plugins/<plugin-name>/.grok-plugin/plugin.json
```

A plugin uses the one native manifest appropriate to its adapter. The required
repository check is `mise exec -- npm run plugins:validate`; available native
validators may provide additional compatibility evidence.

The bootstrap plugins are special developer-owned packages:

```text
plugins/skill-market-claude
plugins/skill-market-codex
plugins/skill-market-grok
```

They cannot target themselves through `proposal`. Change them only as a coordinated repository development change, bump all affected manifest/catalog versions, regenerate their CLI bundles, and validate all three native packages.

### Standalone Skills

```text
skills/claude/<skill-name>/SKILL.md
skills/codex/<skill-name>/SKILL.md
skills/grok/<skill-name>/SKILL.md
```

Each package must be complete for its adapter. Shared files may be copied mechanically, but adapter wording, tool names, paths, invocation metadata, and runtime constraints must be reviewed explicitly. Do not add a compatibility shim in place of a native Grok package.

## CLI and Focused Skill Changes

The canonical CLI implementation lives only in `tooling/skill-market-cli/`. Keep it zero-dependency and emit one stable JSON result object for success and failure.

The source groups are `cli/` (registry, help and dispatch), `catalog/`,
`packages/` (content, local state and transactions), `adapters/`, `proposals/`,
`shared/`, and `build/` (repository-only packaging). Add parser keys/types and
help metadata to `src/cli/registry.mjs`; command parsing and help derive from it.
Keep adapter-specific lifecycle eligibility in the domain validators.

When adding or changing behavior:

1. Update canonical CLI source and focused tests.
2. Preserve stable package ids and result/exit contracts unless the change intentionally defines a new contract version.
3. Keep `list` local-only and `discover` catalog-only.
4. Keep adapter differences explicit in capability and native-adapter modules.
5. Regenerate all three plugin CLI bundles.
6. Update each affected thin Skill and adapter metadata without copying deterministic mechanics into prompts.
7. Bump affected bootstrap plugin versions and canonical catalog entries.
8. Update README command and safety documentation.

The public focused Skill names are:

```text
skill-market
skill-manage
skill-propose
```

Do not reintroduce legacy aliases or manual cache, state, filesystem, native CLI, Git, or GitHub workflows inside those Skills.

`skill-market` owns query/routing and configuration inspection; `skill-manage`
owns local package and configuration changes; `skill-propose` owns catalog
contributions. Preserve existing explicit-invocation policy for mutation skills.
Use CLI help for full option metadata instead of repeating it in every skill.

## Safety Requirements

- Query commands must not create config solely to persist defaults.
- `list` must not clone, fetch, or refresh a catalog.
- Catalog mutations must not automatically fall back to stale data.
- Native marketplace/source identity must match the effective catalog source before mutation.
- Standalone mutations must remain contained to canonical managed paths and preserve transactional rollback. An exact adapter root may resolve through a symbolic link to an existing real directory, but managed descendants below that resolved containment root must not be symbolic links.
- Update must preserve activation state.
- Disable must never be emulated by uninstall.
- Grok trust requires explicit confirmation after source inspection.
- Claude scope must be detected and preserved; unknown scope blocks rather than guesses.
- Codex plugin update remains a confirmed bounded remove/add sequence until Codex provides native update.
- Fork creation, push, and PR creation occur only in confirmed `proposal submit`.
- Bootstrap packages cannot be proposed through their own management workflow.

## Validation

Before opening a PR:

```bash
mise exec -- npm run validate
```

The validation workflow also runs this command on pull requests and pushes to
`main`, using the runtime from `mise.toml`. CI does not publish or install the
marketplace into a real user profile.

Required checks run with the repository's Node runtime, without installed
adapter CLIs, user-level skills or Python helpers. The plugin manifest check can
also run independently:

```bash
mise exec -- npm run plugins:validate
```

The repository-owned profiles in
`tooling/skill-market-cli/src/build/plugin-validation.mjs` cover the skill-only
plugins currently supported here. They check JSON objects, known fields and
types, catalog identity, optional author/license/keywords, Codex interface
metadata, and real skill directories containing regular `SKILL.md` files.
Claude and Grok use their default `skills/` directory; Codex uses its declared
`skills` path. Absolute paths, traversal and symlink redirection are rejected.

These profiles are a bounded repository contract, not full copies of every
adapter's native schema. New manifest fields or component types require an
explicit profile/test update. Build-only validation is excluded from distributed
CLI bundles.

Native validation is an optional compatibility supplement. When available and
relevant, the following read-only commands may be run separately:

```bash
claude plugin validate plugins/skill-market-claude
grok plugin validate plugins/skill-market-grok
```

Record which optional checks actually ran. An unavailable tool is a skipped
supplement, not a failed repository gate; do not claim a native pass when skipped.
If an executed native check fails, investigate the finding rather than treating
it as a successful validation. Do not require installing additional skills or
reference helper scripts inside personal configuration directories.

The complete gate includes:

- canonical catalog schema and sorted stable ids
- four generated catalog views
- three byte-identical self-contained CLI bundles
- unit tests and isolated executable/integration tests
- native inventory and lifecycle fixtures for Claude, Codex, and Grok
- proposal add/update/retire/remove, direct/fork, resume, collision, and abort cases
- repository-owned plugin manifest profiles and skill entry paths
- focused Skill names, invocation policy, CLI option coverage, and resource paths
- bidirectional standalone-directory/catalog agreement, including prereleases
- JSON parsing, ESM syntax, and clean diffs

When a native CLI changes its JSON output or capability surface, update the parser fixture and capability contract together. Record the probed CLI version and keep the integration test isolated from real user state.

## Pull-Request Checklist

- The proposal action and every adapter/package target are explicit.
- Package names are kebab-case and ids are canonical.
- New standalone versions use core `0.0.1`, optionally with a prerelease; updates increase semver.
- Plugin manifests match catalog name/version.
- Intentional adapter deltas are documented; no adapter was expanded implicitly.
- Generated catalogs and bundled CLI artifacts are current.
- Documentation matches the actual CLI help contract.
- `mise exec -- npm run validate` passes.
- No real user state, credentials, generated proposal state, or local cache is committed.
- The PR contains no unapproved service, registry API, global installer, npm publication, force-push, or direct-`main` publication behavior.
