# AGENTS.md

## Repository Contract

Skill Market is the repository-backed catalog and package source for Claude, Codex, and Grok plugins and standalone skills. Treat all three adapters as equal first-class targets. Keep adapter packages, native behavior, and proposal targets explicit; never infer or semantically generate one adapter from another.

Read `CONTRIBUTING.md` before implementation work. It is the detailed engineering, versioning, safety, and proposal policy. Use `README.md` as the public behavior contract.

## Sources of Truth

- Edit `catalog/entries.json`; generate `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `.grok-plugin/marketplace.json`, and `skills/INDEX.md`.
- Edit the zero-dependency ESM CLI only under `tooling/skill-market-cli/bin/` and `tooling/skill-market-cli/src/`; generate the three packaged copies under `plugins/skill-market-{claude,codex,grok}/cli/`.
- Treat each adapter's plugin and standalone Skill content as an explicit native package. Mechanical copying is allowed, but adapter wording, metadata, paths, tools, and runtime constraints require an adapter-specific check.
- Do not hand-edit generated catalog views, `skills/INDEX.md`, packaged CLI files, or packaged CLI manifests.

Keep deterministic catalog, cache, filesystem, native-CLI, Git, and GitHub mechanics in the CLI. Focused Skills should remain thin intent, routing, and confirmation layers. Preserve the CLI's single-JSON-result and stable exit/result contracts.

## Implementation Rules

- Use the repository runtime declared in `mise.toml`; run Node commands through `mise`.
- Keep `list` local-only and non-mutating. Keep `discover` catalog-only and non-installing.
- Keep catalog status separate from local activation state. Updates must preserve activation and native scope.
- Preserve Claude's detected `user`, `project`, `local`, or managed-policy scope; block when scope is unknown.
- Do not emulate unsupported Codex plugin enable/disable with uninstall. Keep Codex plugin update as the bounded confirmed native sequence documented by the project.
- Require explicit Grok source inspection and trust confirmation. Do not add a compatibility shim in place of a native Grok package.
- When shared bootstrap behavior changes, update and version every affected adapter package and canonical catalog entry together. Do not expand an adapter-specific change implicitly.

Use the bundled `proposal` workflow for ordinary catalog additions, updates, retirements, removals, and pull requests. Bootstrap Skill Market plugins are coordinated repository changes and cannot propose themselves.

## Safety and Validation

Tests must use temporary homes, fixture repositories, fake native binaries, and fake GitHub operations. Never point tests or development mutations at real `~/.skill-market`, `~/.claude`, `~/.codex`, or `~/.grok` state.

Do not push, create a pull request, publish, grant trust, or perform another external mutation unless the user explicitly authorizes that effect. Never force-push. Direct publication to `main` also requires an explicit user request.

Before handing off a change, run:

```bash
mise exec -- npm run validate
```

For bootstrap plugin changes, also run the native read-only validators when available:

```bash
claude plugin validate plugins/skill-market-claude
grok plugin validate plugins/skill-market-grok
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/plugin-creator/scripts/validate_plugin.py" plugins/skill-market-codex
```

Report any unavailable validator. Regenerate only from canonical sources, verify generated artifacts are current, and run `git diff --check` before committing.

## Foundation Exclusion

This marketplace/package repository is intentionally excluded from the standard `project-engineering-foundation` rollout. Do not add `UI_COPY_LANGUAGE.md`, repository-level generated `ref/` indexes, `.refs/`, or copied foundation helper scripts unless the user explicitly reverses this rule. Bundled package resources under `skills/` are package content and are not affected by this exclusion.
