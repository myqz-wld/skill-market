# Contributing

All marketplace uploads must go through pull requests. Do not publish by editing `main` directly.

Default remote repository:

```text
git@github.com:myqz-wld/skill-market.git
```

Bootstrap plugins `skill-market-claude` and `skill-market-codex` are developer-maintained. Do not upload, delete, or modify them through Skill Market management skills.

## Claude Plugin Upload

Claude plugins live under:

```text
plugins/<plugin-name>/.claude-plugin/plugin.json
plugins/<plugin-name>/skills/<skill-name>/SKILL.md
```

Update:

```text
.claude-plugin/marketplace.json
```

## Codex Plugin Upload

Codex plugins live under:

```text
plugins/<plugin-name>/.codex-plugin/plugin.json
plugins/<plugin-name>/skills/<skill-name>/SKILL.md
```

Update:

```text
.agents/plugins/marketplace.json
```

## Claude Skill Upload

Standalone Claude skills live under:

```text
skills/claude/<skill-name>/SKILL.md
```

Update:

```text
skills/INDEX.md
```

## Codex Skill Upload

Standalone Codex skills live under:

```text
skills/codex/<skill-name>/SKILL.md
```

Update:

```text
skills/INDEX.md
```

## PR Requirements

- Plugin name is kebab-case.
- Skill name is kebab-case.
- Claude and Codex variants are not auto-synced.
- Each plugin has the correct native manifest.
- Each new plugin is listed in the corresponding marketplace catalog.
- Each new standalone skill is listed in `skills/INDEX.md`.
- Uploads are proposed until the PR is merged.
- Marketplace deletion is also proposed until the PR is merged.
- Do not add services, npm packages, custom CLIs, or custom registry APIs for skill management.
