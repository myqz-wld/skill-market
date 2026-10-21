# Contributing

Maintainers edit canonical sources directly. Installed contribution workflows use
resumable proposals. Neither route authorizes a push, PR or publication.
Claude, Codex and Grok are independent, explicit package targets.

## Development

The CLI is zero-dependency ESM on Node.js 20+. Use the development runtime in
`mise.toml`:

```bash
mise install
mise exec -- npm run generate
mise exec -- npm run validate
git diff --check
```

Inspect existing changes before editing and preserve unrelated work. Tests use
temporary homes, fixture repositories, fake native binaries and fake GitHub
operations, never real `~/.skill-market`, `~/.claude`, `~/.codex` or `~/.grok`
mutation state. No clean-checkout, proposal or automatic-commit step is required
for direct maintenance.

## Source Ownership

| Edit | Generate |
|---|---|
| `catalog/entries.json` | `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `.grok-plugin/marketplace.json`, `skills/INDEX.md` |
| Catalog `defaults` | `tooling/skill-market-cli/src/shared/defaults.generated.mjs` |
| `tooling/skill-market-cli/package.json`, `bin/`, `src/` | `plugins/skill-market-{claude,codex,grok}/cli/` |

Do not hand-edit derived files. `npm run generate` updates them; validation detects
drift. Runtime defaults and help use the bundled defaults module without fetching
a catalog. Proposal preparation generates only the four catalog views, leaving
CLI defaults and bundle generation to repository maintenance.

Native packages are authored under `plugins/<name>/` or
`skills/<adapter>/<name>/`. A plugin uses its adapter's native
`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` or
`.grok-plugin/plugin.json`; a standalone package contains `SKILL.md` and its needed
resources. Register every adapter explicitly. Shared content may be copied
mechanically after checking native wording, paths, tools, invocation metadata and
runtime constraints. Do not infer targets or substitute a Grok compatibility shim.

The three `plugins/skill-market-*` bootstrap packages cannot propose themselves.
Change them through coordinated repository maintenance.

## Identity, Status and Versions

Package IDs are `<adapter>:<kind>:<kebab-case-name>`, where adapter is `claude`,
`codex` or `grok`, and kind is `plugin` or `standalone`.

| Catalog status | Effect |
|---|---|
| `active` | Normal discovery and installation |
| `deprecated` | Hidden by default; new download/install requires explicit acceptance |
| `disabled` | Download/install/update blocked |
| `removed` | Tombstone after exact package removal |

Catalog status is separate from local activation. Proposals retain removal
tombstones; deleting a row entirely requires an explicit maintainer purge request.

- New standalone packages start at `0.0.1` or a prerelease such as `0.0.1-draft.1`.
  Updates require a greater semver. Keep the same directory through drafts and
  release; maturity does not change catalog availability.
- Plugin manifest names/versions match their catalog targets. Any package-content
  change, including bundled skills or CLI files, requires a plugin version bump.
- The CLI version lives only in its canonical `package.json`. A shared runtime
  change bumps it and every affected bootstrap manifest/catalog pair. An
  adapter-only package change need not bump the CLI.
- Claude and Codex marketplace views omit plugin versions; Grok mirrors the
  catalog version. Generate these views instead of editing them.
- Tests compare version relationships, not release constants. Never edit installed
  versions in `~/.skill-market/managed-state.json` during repository maintenance.

## Package Proposal Workflow

Use CLI help for the exact JSON spec and action options:

```bash
mise exec -- npm run --silent cli -- help --pretty
mise exec -- npm run --silent cli -- proposal plan --spec ./proposal.json --pretty
mise exec -- npm run --silent cli -- proposal prepare <proposal-id> --pretty
mise exec -- npm run --silent cli -- proposal status <proposal-id> --pretty
```

| Spec action | Result | Required inputs |
|---|---|---|
| `add` | New active target and exact package content | Source, version, description |
| `update` | Replace content; preserve catalog status | Source and strictly greater version |
| `retire` | Keep content; active becomes deprecated | Source/version forbidden |
| `remove` | Remove exact content; retain tombstone | Source/version forbidden |

Each adapter variant is a separate target. The CLI owns source capture, version
checks, worktrees, changed-path allowlists, generated views, validation and local
commit creation. Preparation rejects unknown fields, changed source content,
nested Git metadata, changed/dirty bases and writes outside the declared scope.

Inspect the prepared commit, diff hash, targets, validation and warnings. With
explicit authorization for fork/push/PR effects:

```bash
mise exec -- npm run --silent cli -- proposal submit <proposal-id> --confirm-external-effects --pretty
```

Submission never force-pushes. Retries verify the exact remote commit and resume
PR discovery. Use `proposal abort <proposal-id>` for local planned/prepared work;
`--confirm-discard` requires inspecting drift in that exact managed worktree.
Pushed/submitted proposals cannot be aborted.

## CLI Contracts

Runtime sources live in `tooling/skill-market-cli/src/`: `cli/` owns registry,
help and dispatch; `catalog/`, `packages/`, `adapters/` and `proposals/` own their
domain mechanics; `shared/` owns common contracts; `build/` is repository-only.
Define parser options and help together in `cli/registry.mjs` and keep native
eligibility in domain validators. Preserve stable result/exit contracts and one
JSON result on stdout, including failures.

Management skills remain thin routing/confirmation layers over the CLI. Keep the
three public interfaces listed in [README.md](README.md#use), retain mutation
skills' explicit-invocation policy, and use CLI help for full options. Do not add
legacy aliases or duplicate cache, state, native CLI, Git or GitHub mechanics in prompts.

Required behavior:

- `list` is local-only: no clone, fetch, refresh or mutation. `discover` may refresh
  the catalog but never installs. Queries do not create config to persist defaults.
- Catalog-dependent mutations require a fresh snapshot or explicit acceptance of
  the exact cached commit; never silently fall back. Verify native source identity.
- Standalone changes stay in canonical managed paths with transactional rollback.
  An exact adapter root can resolve to a real directory through a symlink; managed
  descendants below that containment root cannot be symlinks.
- Updates preserve activation and native scope. Disable never means uninstall.
  Claude unknown scope blocks; managed-policy restrictions remain native.
- Codex plugin enable/disable is unsupported. Updates use the documented confirmed
  bounded remove/add sequence, with Git marketplace refresh where applicable.
- Grok trust requires source inspection and explicit confirmation.
- Fork/push/PR effects belong only to confirmed submission. No unapproved native
  installs, trust grants, publication or external mutation; never force-push.
  Direct publication to `main` requires an explicit user request.

## Validation and Review

`npm run validate` is the required repository gate. It checks catalog schema and
views, generated defaults, self-contained CLI bundles, native manifest profiles,
package/resource paths, CLI behavior and isolated lifecycle/proposal tests. CI runs
it on PRs and pushes to `main`, and checks committed whitespace against the event's
base (or an empty tree for a new root). CI does not install into real user profiles
or publish packages.

Repository checks need no installed adapter CLIs or user-level helper skills.
The skill-only manifest profiles in
`tooling/skill-market-cli/src/build/plugin-validation.mjs` validate supported fields,
identity, types and contained native skill paths. New fields/components require an
explicit profile/test update. These profiles are bounded repository contracts;
package checks do not establish the effectiveness of an individual skill.

Separate validation entry points:

```bash
mise exec -- npm run plugins:validate
claude plugin validate plugins/skill-market-claude
grok plugin validate plugins/skill-market-grok
```

The first command runs the required repository manifest check independently;
native commands are supplements. Record runs and skips separately. An unavailable
native tool is a skipped supplement; an executed failure needs investigation.
When native output/capabilities change, update the parser fixture and capability
contract together and record the probed version.

Native development installs change real state and need authorization: substitute
the checkout path in README instructions; Grok uses the exact
`plugins/skill-market-grok` subdirectory after source inspection.
Before an authorized commit/publication, inspect the diff, metadata and actual
distribution inputs for local state, credentials and unintended files. Verify
explicit targets, version agreement, generated output, documentation and tests.
