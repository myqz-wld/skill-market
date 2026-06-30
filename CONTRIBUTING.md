# Contributing

All marketplace uploads must go through pull requests. Do not publish by editing `main` directly.

Default remote repository:

```text
git@github.com:myqz-wld/skill-market.git
```

Bootstrap plugins `skill-market-claude` and `skill-market-codex` are developer-maintained. Do not upload, delete, or modify them through Skill Market management skills.

## Version Policy

- Standalone skill changes must bump that skill's semver `Version` in `skills/INDEX.md`.
- Plugin changes must bump the plugin manifest semver, including changes to any bundled plugin skill under `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`.
- When a marketplace catalog entry also stores the plugin version, update that catalog version in the same change.
- Do not change local installed versions in `~/.skill-market/managed-skills.json` when editing this repository; local install/update commands own that state.

## Claude Plugin Upload

Claude plugins live under:

```text
plugins/<plugin-name>/.claude-plugin/plugin.json
plugins/<plugin-name>/skills/<skill-name>/SKILL.md
```

Bump `plugins/<plugin-name>/.claude-plugin/plugin.json` `version` whenever the plugin package changes. This includes edits to bundled plugin skills. Also update the corresponding `version` in `.claude-plugin/marketplace.json`.

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

Bump `plugins/<plugin-name>/.codex-plugin/plugin.json` `version` whenever the plugin package changes. This includes edits to bundled plugin skills. If the Codex marketplace catalog stores a version for that plugin, update it in `.agents/plugins/marketplace.json` in the same change.

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

Set the catalog `Version` for every new standalone skill to `0.0.1`. Bump that version whenever the published skill package changes.

## Codex Skill Upload

Standalone Codex skills live under:

```text
skills/codex/<skill-name>/SKILL.md
```

Update:

```text
skills/INDEX.md
```

Set the catalog `Version` for every new standalone skill to `0.0.1`. Bump that version whenever the published skill package changes.

## PR Requirements

- Plugin name is kebab-case.
- Skill name is kebab-case.
- Claude and Codex variants are not auto-synced.
- Each plugin has the correct native manifest.
- Each plugin package change, including bundled plugin skill changes, bumps the plugin manifest version.
- Each new plugin is listed in the corresponding marketplace catalog.
- Each new standalone skill is listed in `skills/INDEX.md` with a semver `Version`.
- Each standalone skill change bumps that skill's `Version` in `skills/INDEX.md`.
- Uploads are proposed until the PR is merged.
- Marketplace deletion is also proposed until the PR is merged.
- Do not add services, npm packages, custom CLIs, or custom registry APIs for skill management.
