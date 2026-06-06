# Skill Market

Skill Market is a native plugin marketplace repository for Claude and Codex.

It does not provide a service, API, custom CLI, or custom installer. Claude and Codex use their own plugin marketplace mechanisms. The built-in capabilities are management skills packaged as native plugins for each platform.

## Marketplace Layout

```text
.claude-plugin/marketplace.json          # Claude marketplace catalog
.agents/plugins/marketplace.json        # Codex marketplace catalog
plugins/
  skill-market-claude/
    .claude-plugin/plugin.json
    skills/
      skill-market/SKILL.md
      skill-list/SKILL.md
      skill-search/SKILL.md
      skill-download/SKILL.md
      skill-disable/SKILL.md
      skill-uninstall/SKILL.md
      skill-update/SKILL.md
      skill-upload/SKILL.md
  skill-market-codex/
    .codex-plugin/plugin.json
    skills/
      skill-market/SKILL.md
      skill-list/SKILL.md
      skill-search/SKILL.md
      skill-download/SKILL.md
      skill-disable/SKILL.md
      skill-uninstall/SKILL.md
      skill-update/SKILL.md
      skill-upload/SKILL.md
skills/
  INDEX.md
  claude/<skill-name>/SKILL.md
  codex/<skill-name>/SKILL.md
```

Claude and Codex plugins are independent. Claude and Codex managed skills are also independent. If the same workflow needs both platforms, publish two variants and keep their manifests and skills separate.

The `plugins/skill-market-*` directories contain only the bootstrap management skills needed for native plugin installation. Marketplace-managed skills live under the top-level `skills/` directory, not inside the bootstrap plugin.

Management skills must not upload, delete, or modify `skill-market-claude` or `skill-market-codex`. Bootstrap plugin changes are developer-only repository changes.

## Register Marketplace

Claude:

```bash
claude plugin marketplace add git@github.com:myqz-wld/skill-market.git
claude plugin install skill-market-claude@skill-market
claude plugin marketplace update skill-market
claude plugin update skill-market-claude@skill-market
```

Codex:

```bash
codex plugin marketplace add git@github.com:myqz-wld/skill-market.git
codex plugin add skill-market-codex@skill-market
codex plugin marketplace upgrade skill-market
```

For local plugin development only, register `/path/to/skill-market` instead of the remote URL.

## Repository Configuration

The installed management skills use the remote repository as the source of truth:

1. `SKILL_MARKET_REPO_URL` environment variable.
2. `~/.skill-market/config.json` with a `repoUrl` string.
3. Default remote: `git@github.com:myqz-wld/skill-market.git`.

They use a local cache to avoid fetching the network on every operation:

1. `SKILL_MARKET_CACHE` environment variable.
2. `~/.skill-market/config.json` with a `cachePath` string.
3. Default cache: `~/.skill-market/cache/skill-market`.

`SKILL_MARKET_REPO` or config field `repoPath` is only an explicit local development override. It is not the default.

Example config:

```json
{
  "repoUrl": "git@github.com:myqz-wld/skill-market.git",
  "cachePath": "~/.skill-market/cache/skill-market"
}
```

After installation, the management skills are available from the installed plugin namespace:

```text
Claude: /skill-market-claude:skill-market, /skill-market-claude:skill-list, /skill-market-claude:skill-search, /skill-market-claude:skill-download, /skill-market-claude:skill-disable, /skill-market-claude:skill-uninstall, /skill-market-claude:skill-update, /skill-market-claude:skill-upload
Codex:  skill-market, skill-list, skill-search, skill-download, skill-disable, skill-uninstall, skill-update, skill-upload
```

## What the Built-in Skills Do

After installing the plugin, use the management skills to:

- list managed skills and their catalog status from `skills/INDEX.md`
- search marketplace plugins and standalone skills
- download plugin or skill packages without installing
- disable Claude plugins and standalone skills without deleting their files
- disable Codex standalone skills without deleting their files; Codex plugin disable is unsupported by the current CLI
- uninstall installed plugins or standalone skills
- update installed plugins or standalone skills
- upload new or updated skills/plugins by creating a branch and PR

Upload is not publish. A skill or plugin is published only after the PR is merged.

`skills/INDEX.md` is the remote skill catalog index. Local management state is stored in `~/.skill-market/managed-skills.json`.

Local state example:

```json
{
  "version": 1,
  "skills": [
    {
      "adapter": "codex",
      "name": "example-skill",
      "catalogPath": "skills/codex/example-skill",
      "activePath": "~/.codex/skills/example-skill",
      "disabledPath": "~/.codex/skills.disabled/example-skill",
      "status": "installed"
    }
  ]
}
```

Only skills installed through Skill Market or explicitly adopted by the user are managed. `skill-list` must not list unrelated local skills. When a requested operation touches a local skill absent from `managed-skills.json`, ask the user before adopting or modifying it.

## Upload Policy

All uploads must go through PR:

1. Create branch `market/<type>/<adapter>/<name>`.
2. For plugin uploads, add or update `plugins/<plugin-name>/` and the corresponding marketplace catalog.
3. For standalone skill uploads, add or update `skills/<adapter>/<skill-name>/` and `skills/INDEX.md`.
4. Commit and push.
5. Open a PR.
6. Merge the PR to publish.

Marketplace deletion follows the same rule: remove or retire the plugin through a PR, then publish only after merge.

See [CONTRIBUTING.md](CONTRIBUTING.md).
