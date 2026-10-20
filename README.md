# Skill Market

A repository-backed marketplace for Claude, Codex and Grok plugins and standalone
skills. Each platform has a native plugin with three management skills and a
bundled CLI. No hosted registry or global Skill Market executable is required.

## Requirements

- Node.js 20+ for the bundled CLI.
- Git and the selected adapter CLI.
- GitHub CLI (`gh`) only for submitting catalog proposals.

## Install

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

Register the marketplace, inspect the exact plugin source, then approve trust:

```bash
grok plugin marketplace add https://github.com/myqz-wld/skill-market.git
grok plugin install "https://github.com/myqz-wld/skill-market.git#plugins/skill-market-grok" --trust
```

## Use

Invoke these through your adapter's skill interface:

| Skill | Purpose | Example request |
|---|---|---|
| `skill-market` | List installed packages, search the market, inspect configuration | “Find a project scaffolding skill.” |
| `skill-manage` | Download, install, update, enable, disable, uninstall or change configuration | “Install this exact package.” |
| `skill-propose` | Prepare and optionally submit a catalog change | “Prepare a proposal for this skill.” |

Local inventory does not refresh the catalog. Searching can refresh its cache
but never installs packages. Package changes use the exact requested target;
pushes and pull requests require explicit authorization.

## Standalone Skills

See the generated [skill catalog](skills/INDEX.md) for versions and package paths.

- `implementation-planning`: plan code changes, split verifiable tasks, arrange parallel work, and retain handoff/archive evidence.
- `project-bootstrap`: scaffold new projects or adjust existing architecture through questions; excludes new feature implementation.

Both are available for Claude, Codex and Grok. `project-bootstrap` currently uses
version `0.0.1-draft.3`; the suffix marks a trial version. All standalone packages
live under `skills/<adapter>/<name>/`, including prereleases.

## Important Differences

- Claude preserves the installed plugin's native scope.
- Codex plugins do not support enable/disable; standalone skills do.
- Grok plugin installation requires explicit trust after source inspection.
- Updates preserve activation. Follow each adapter's returned restart guidance.

See [Usage](docs/usage.md) for configuration, state, native behavior and local development.

## Development

Use the runtime declared in `mise.toml`:

```bash
mise install
mise exec -- npm run generate
mise exec -- npm run validate
```

Inspect the complete command, option and result contract:

```bash
mise exec -- npm run --silent cli -- help --pretty
```

Edit canonical sources and regenerate derived files. See
[Contributing](CONTRIBUTING.md) for source ownership, versioning, validation and
catalog proposals. [AGENTS.md](AGENTS.md) holds shared repository instructions;
[CLAUDE.md](CLAUDE.md) imports them.
