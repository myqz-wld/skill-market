# AGENTS.md

Skill Market manages native plugins and standalone skills for Claude, Codex and
Grok. Treat all three adapters as equal, explicit targets.

Read `CONTRIBUTING.md` before implementation; it owns engineering, versioning,
proposal and validation policy. `README.md` owns public installation and usage.

## Documentation Scope

Root `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` and `README.md` cover marketplace
installation, management, contribution and validation only. Keep individual
skills' designs, workflows, evaluation/iteration records and publication/privacy
export mechanisms in their own package resources. Link the generated catalog for
package discovery instead of duplicating package details or current versions.
Package-specific workflow rules belong to their package, not these root documents.

## Canonical Sources

- Edit `catalog/entries.json`; generate the three native marketplace views,
  `skills/INDEX.md` and the CLI defaults module.
- Edit CLI runtime code in `tooling/skill-market-cli/`; generate plugin `cli/`
  bundles. Keep the CLI zero-dependency and its single-JSON-result/exit contracts
  stable. Parser options and help share `src/cli/registry.mjs`.
- Edit each native package explicitly. Mechanical copying requires adapter checks;
  never infer another adapter target. Standalone packages live under
  `skills/<adapter>/<name>/`, including prereleases.
- Version affected packages and catalog entries together. Shared CLI changes also
  bump its runtime and all affected bootstrap plugins. Never hand-edit generated files.

## Workflow and Safety

Preserve existing working changes. Use the runtime in `mise.toml`; run Node
commands through `mise`. Maintainers can edit canonical sources directly;
installed contribution workflows use proposals. Bootstrap plugins cannot propose
themselves.

Keep `list` local-only and non-mutating, and `discover` catalog-only and
non-installing. Keep catalog status separate from local activation; preserve
activation and native scope during updates. Follow the adapter capability and
confirmation contracts in `CONTRIBUTING.md`.

Tests use temporary homes, fixture repositories, fake native binaries and fake
GitHub operations. Never direct tests or development mutations at real
`~/.skill-market`, `~/.claude`, `~/.codex` or `~/.grok` state.
Do not push, create a PR, publish, grant trust or perform other external mutations
without explicit authorization. Direct publication to `main` requires an explicit
request; never force-push. Inspect actual distribution inputs before an authorized
commit or publication.

After source changes:

```bash
mise exec -- npm run generate
mise exec -- npm run validate
git diff --check
```

Do not apply application scaffolding, generated knowledge indexes or copied
foundation helpers to this marketplace without an explicit request. Bundled
resources under `skills/` are package content and are exempt.
