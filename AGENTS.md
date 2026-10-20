# AGENTS.md

Skill Market supplies native plugins and standalone skills for Claude, Codex,
and Grok. Treat all three adapters as equal, explicit targets.

Read `CONTRIBUTING.md` before implementation. It owns engineering, versioning,
validation and proposal policy; `README.md` owns public behavior.

## Sources of Truth

- Edit `catalog/entries.json`; generate `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `.grok-plugin/marketplace.json`, and `skills/INDEX.md`.
- Edit CLI code under `tooling/skill-market-cli/bin/` and `src/`, with runtime metadata in its `package.json`; generate the three plugin `cli/` bundles.
- Keep native package content explicit. Mechanical copying requires adapter-specific checks; never infer or semantically generate another adapter.
- Keep all standalone skills under `skills/<adapter>/<skill-name>/`. Record draft maturity with prerelease versions in the catalog, not a separate directory.
- Do not hand-edit generated artifacts.

Keep deterministic catalog, cache, filesystem, native-CLI, Git, and GitHub mechanics in the CLI. Focused Skills should remain thin intent, routing, and confirmation layers. Preserve the CLI's single-JSON-result and stable exit/result contracts.

## Change Workflow

- Use the repository runtime declared in `mise.toml`; run Node commands through `mise`.
- Preserve existing working changes. Maintainers may edit canonical sources directly; use `proposal` for installed contribution workflows or resumable submissions.
- Keep the CLI zero-dependency. Define parser options and help together in `src/cli/registry.mjs` under the canonical CLI.
- Keep `list` local-only and non-mutating. Keep `discover` catalog-only and non-installing.
- Keep catalog status separate from local activation state. Updates must preserve activation and native scope.
- Preserve Claude's detected `user`, `project`, `local`, or managed-policy scope; block when scope is unknown.
- Do not emulate unsupported Codex plugin enable/disable with uninstall. Keep Codex plugin update as the bounded confirmed native sequence documented by the project.
- Require explicit Grok source inspection and trust confirmation. Do not add a compatibility shim in place of a native Grok package.
- When shared bootstrap behavior changes, update and version every affected adapter package and canonical catalog entry together. Do not expand an adapter-specific change implicitly.

Bootstrap plugins require coordinated repository changes and cannot propose themselves.

## Safety and Validation

Tests must use temporary homes, fixture repositories, fake native binaries, and fake GitHub operations. Never point tests or development mutations at real `~/.skill-market`, `~/.claude`, `~/.codex`, or `~/.grok` state.

Do not push, create a pull request, publish, grant trust, or perform another external mutation unless the user explicitly authorizes that effect. Never force-push. Direct publication to `main` also requires an explicit user request.

After changing sources, regenerate and validate:

```bash
mise exec -- npm run generate
mise exec -- npm run validate
git diff --check
```

For bootstrap changes, also run the native read-only validators documented in
`CONTRIBUTING.md`; report unavailable validators. Inspect actual distribution
inputs before an authorized commit or publication.

## Scaffolding Exclusion

Do not apply application scaffolding to this marketplace repository or add
`UI_COPY_LANGUAGE.md`, repository-level generated `ref/` indexes, `.refs/`, or
copied foundation helpers without an explicit user request. Bundled resources
under `skills/` are package content and are exempt.
