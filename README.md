# Skill Market

Skill Market is a native plugin marketplace repository for Claude and Codex.

It does not provide a service, API, custom CLI, or custom installer. Claude and Codex use their own plugin marketplace mechanisms. The only built-in capability in this repository is a `skill-market` skill packaged as native plugins for each platform.

## Marketplace Layout

```text
.claude-plugin/marketplace.json          # Claude marketplace catalog
.agents/plugins/marketplace.json        # Codex marketplace catalog
plugins/
  skill-market-claude/
    .claude-plugin/plugin.json
    skills/skill-market/SKILL.md
  skill-market-codex/
    .codex-plugin/plugin.json
    skills/skill-market/SKILL.md
```

Claude and Codex plugins are independent. If the same workflow needs both platforms, publish two plugin variants and keep their manifests and skills separate.

## Register Locally

Claude:

```bash
claude plugin marketplace add /Users/wanglidong/Repository/skill-market
claude plugin install skill-market-claude@skill-market
claude plugin marketplace update skill-market
claude plugin update skill-market-claude@skill-market
```

Codex:

```bash
codex plugin marketplace add /Users/wanglidong/Repository/skill-market
codex plugin add skill-market-codex@skill-market
codex plugin marketplace upgrade skill-market
```

## Repository Path Configuration

The installed `skill-market` skill resolves the marketplace repository path in this order:

1. `SKILL_MARKET_REPO` environment variable.
2. `~/.skill-market/config.json` with a `repoPath` string.
3. Default: `/Users/wanglidong/Repository/skill-market`.

Example config:

```json
{
  "repoPath": "/Users/wanglidong/Repository/skill-market"
}
```

After installation, the built-in skill is available from the installed plugin namespace:

```text
Claude: /skill-market-claude:skill-market
Codex:  skill-market
```

## What the Built-in Skill Does

After installing the plugin, use the `skill-market` skill to:

- browse marketplace plugins
- install/update/delete installed marketplace plugins using the environment's native plugin permissions
- download plugin or skill packages by copying/archiving repository directories
- upload new or updated skills/plugins by creating a branch and PR
- delete marketplace entries by creating a branch and PR

Upload is not publish. A skill or plugin is published only after the PR is merged.

## Upload Policy

All uploads must go through PR:

1. Create branch `market/<type>/<adapter>/<name>`.
2. Add or update the plugin under `plugins/<plugin-name>/`.
3. Update the corresponding marketplace catalog.
4. Commit and push.
5. Open a PR.
6. Merge the PR to publish.

Marketplace deletion follows the same rule: remove or retire the plugin through a PR, then publish only after merge.

See [CONTRIBUTING.md](CONTRIBUTING.md).
