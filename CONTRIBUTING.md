# Contributing

Skill Market accepts catalog and package changes through pull requests. Do not publish by editing or pushing directly to `main`.

Claude, Codex, and Grok are equal first-class adapters. Their package targets are explicit and independent: never infer, generate semantically, or publish one adapter variant merely because another exists.

## Development Setup

The CLI is zero-dependency ESM and requires Node.js 20 or newer. This repository pins its development runtime in `mise.toml`.

```bash
mise install
npm run validate
```

Tests must use temporary homes, fixture repositories, fake native binaries, and fake GitHub operations. Never point a repository test at real `~/.skill-market`, `~/.claude`, `~/.codex`, or `~/.grok` mutation state.

## Sources of Truth

Edit the source column; regenerate or validate the derived column.

| Source | Derived artifacts |
|---|---|
| `catalog/entries.json` | `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `.grok-plugin/marketplace.json`, `skills/INDEX.md` |
| `tooling/skill-market-cli/bin/` and `tooling/skill-market-cli/src/` | `plugins/skill-market-{codex,claude,grok}/cli/` |
| Explicit adapter package content | No semantic cross-adapter generation |

Run:

```bash
npm run catalog:generate
npm run plugins:generate
```

Do not hand-edit generated marketplace files, `skills/INDEX.md`, packaged CLI modules, or packaged CLI manifests. `npm run validate` fails when they drift.

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

## Preferred Package Proposal Workflow

Use the bundled proposal CLI for ordinary package additions, updates, retirement, and removal. It owns exact version checks, generated catalogs, isolated Git worktrees, changed-path allowlists, validation, commit creation, direct/fork selection, and resumable PR submission.

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
npm run cli -- proposal plan --spec ./proposal.json --pretty
npm run cli -- proposal prepare <proposal-id> --pretty
npm run cli -- proposal status <proposal-id> --pretty
```

Inspect the prepared targets, commit, diff hash, branch, validation results, and warnings. Only after authorizing fork/push/PR effects:

```bash
npm run cli -- proposal submit <proposal-id> --confirm-external-effects --pretty
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

- A new standalone package starts at `0.0.1`.
- Updating a standalone package requires a version greater than its current catalog version.
- A plugin manifest name and version must match its catalog target.
- Any plugin package change, including bundled Skills or CLI artifacts, requires a plugin semver bump.
- Bootstrap plugin versions currently live in their native manifests and canonical catalog entries; generated marketplace versions follow the catalog.
- Never edit local installed versions in `~/.skill-market/managed-state.json` as part of a repository contribution.

## Package Layout

### Plugins

```text
plugins/<plugin-name>/.claude-plugin/plugin.json
plugins/<plugin-name>/.codex-plugin/plugin.json
plugins/<plugin-name>/.grok-plugin/plugin.json
```

A plugin uses the one native manifest appropriate to its adapter. Validate with that adapter's native validator where available.

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

When adding or changing behavior:

1. Update canonical CLI source and focused tests.
2. Preserve stable package ids and result/exit contracts unless the change intentionally defines a new contract version.
3. Keep `list` local-only and `discover` catalog-only.
4. Keep adapter differences explicit in capability and native-adapter modules.
5. Regenerate all three plugin CLI bundles.
6. Update each affected thin Skill and adapter metadata without copying deterministic mechanics into prompts.
7. Bump affected bootstrap plugin versions and canonical catalog entries.
8. Update README command and safety documentation.

The canonical focused Skill names are:

```text
skill-market
skill-list
skill-discover
skill-download
skill-install
skill-update
skill-enable
skill-disable
skill-uninstall
skill-propose
```

Do not reintroduce legacy aliases or manual cache, state, filesystem, native CLI, Git, or GitHub workflows inside those Skills.

## Safety Requirements

- Query commands must not create config solely to persist defaults.
- `list` must not clone, fetch, or refresh a catalog.
- Catalog mutations must not automatically fall back to stale data.
- Native marketplace/source identity must match the effective catalog source before mutation.
- Standalone mutations must remain contained to canonical managed paths and preserve transactional rollback.
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
npm run validate
```

When the native CLIs are available, also run their read-only validators:

```bash
claude plugin validate plugins/skill-market-claude
grok plugin validate plugins/skill-market-grok
```

Validate the Codex package with the current Codex plugin schema helper; the installed Codex CLI does not currently expose a native `plugin validate` command.

The complete gate includes:

- canonical catalog schema and sorted stable ids
- four generated catalog views
- three byte-identical self-contained CLI bundles
- unit tests and isolated executable/integration tests
- native inventory and lifecycle fixtures for Claude, Codex, and Grok
- proposal add/update/retire/remove, direct/fork, resume, collision, and abort cases
- plugin manifests and native validators
- focused Skill names, invocation policy, CLI option coverage, and resource paths
- JSON parsing, ESM syntax, and clean diffs

When a native CLI changes its JSON output or capability surface, update the parser fixture and capability contract together. Record the probed CLI version and keep the integration test isolated from real user state.

## Pull-Request Checklist

- The proposal action and every adapter/package target are explicit.
- Package names are kebab-case and ids are canonical.
- New standalone versions start at `0.0.1`; updates increase semver.
- Plugin manifests match catalog name/version.
- Intentional adapter deltas are documented; no adapter was expanded implicitly.
- Generated catalogs and bundled CLI artifacts are current.
- Documentation matches the actual CLI help contract.
- `npm run validate` passes.
- No real user state, credentials, generated proposal state, or local cache is committed.
- The PR contains no unapproved service, registry API, global installer, npm publication, force-push, or direct-`main` publication behavior.
