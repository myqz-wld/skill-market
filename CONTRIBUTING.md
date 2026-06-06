# Contributing

All marketplace uploads must go through pull requests. Do not publish by editing `main` directly.

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

## PR Requirements

- Plugin name is kebab-case.
- Claude and Codex variants are not auto-synced.
- Each plugin has the correct native manifest.
- Each new plugin is listed in the corresponding marketplace catalog.
- Uploads are proposed until the PR is merged.
- Marketplace deletion is also proposed until the PR is merged.
- Do not add services, npm packages, custom CLIs, or custom registry APIs for skill management.
