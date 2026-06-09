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
      skill-install/SKILL.md
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
      skill-install/SKILL.md
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

For `skill-list`, `skill-search`, `skill-download`, and `skill-install`, cache freshness is controlled by:

1. `SKILL_MARKET_CACHE_TTL_SECONDS` environment variable.
2. `~/.skill-market/config.json` with a `cacheTtlSeconds` number.
3. Default TTL: `86400` seconds.

A positive TTL refreshes the cache when the freshness marker is missing or older than the TTL. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`. Set `cacheTtlSeconds` to `0` to disable automatic TTL refresh; explicit latest requests still fetch. `skill-update` and `skill-upload` always fetch before changing local state or creating PRs.

`SKILL_MARKET_REPO` or config field `repoPath` is only an explicit local development override. It is not the default and bypasses cache TTL.

Example config:

```json
{
  "repoUrl": "git@github.com:myqz-wld/skill-market.git",
  "cachePath": "~/.skill-market/cache/skill-market",
  "cacheTtlSeconds": 86400
}
```

`activePath` is the active install location. `disabledPath` is the canonical disabled location and may be precomputed while status is `installed`. `installedVersion` records the standalone skill version copied from `skills/INDEX.md`.

After installation, the management skills are available from the installed plugin namespace:

```text
Claude: /skill-market-claude:skill-market, /skill-market-claude:skill-list, /skill-market-claude:skill-search, /skill-market-claude:skill-download, /skill-market-claude:skill-install, /skill-market-claude:skill-disable, /skill-market-claude:skill-uninstall, /skill-market-claude:skill-update, /skill-market-claude:skill-upload
Codex:  skill-market, skill-list, skill-search, skill-download, skill-install, skill-disable, skill-uninstall, skill-update, skill-upload
```

## What the Built-in Skills Do

After installing the plugin, use the management skills to:

- list managed skills from `~/.skill-market/managed-skills.json` and enrich them with catalog version and status from `skills/INDEX.md`
- search marketplace plugins and standalone skills
- download plugin or skill packages without installing
- install plugins or standalone skills and record standalone skills in local managed state
- disable Claude plugins and standalone skills without deleting their files
- disable Codex standalone skills without deleting their files; Codex plugin disable is unsupported by the current CLI
- uninstall installed plugins or standalone skills
- update installed plugins or standalone skills
- upload new or updated skills/plugins by creating a branch and PR

Upload is not publish. A skill or plugin is published only after the PR is merged.

`skills/INDEX.md` is the remote skill catalog index. It records a semver `Version` for each standalone skill. Start new standalone skills at `0.0.1` and bump the version whenever the published skill package changes. Local management state is stored in `~/.skill-market/managed-skills.json`.

`skill-download` exports packages without installing them. If the user does not provide a destination, use `~/.skill-market/downloads/<adapter>/<name>/`.

Local state example:

```json
{
  "version": 1,
  "skills": [
    {
      "adapter": "codex",
      "name": "example-skill",
      "catalogPath": "skills/codex/example-skill",
      "installedVersion": "0.0.1",
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
3. For standalone skill uploads, add or update `skills/<adapter>/<skill-name>/`, bump that skill's `Version` in `skills/INDEX.md`, and keep the catalog row path/status/description current.
4. Commit and push.
5. Open a PR.
6. Merge the PR to publish.

Marketplace deletion follows the same rule: remove or retire the plugin through a PR, then publish only after merge.

See [CONTRIBUTING.md](CONTRIBUTING.md).
