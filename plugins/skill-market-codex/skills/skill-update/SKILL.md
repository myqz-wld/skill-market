---
name: skill-update
description: Update an installed Codex Skill Market plugin or standalone Codex skill from the remote catalog.
---

# Skill Update for Codex

Use this skill to update local installations from Skill Market.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` override those defaults. `repoPath` is only an explicit local development override.

For update, fetch the remote and fast-forward the cache before copying files.

## Update

- Plugin from a Git marketplace: run `codex plugin marketplace upgrade skill-market`, then reinstall when needed.
- Plugin from a local marketplace source: run `codex plugin remove <plugin-name>@skill-market`, then `codex plugin add <plugin-name>@skill-market`.
- Standalone Codex skill: copy `skills/codex/<skill-name>/` from the cache to `~/.codex/skills/<skill-name>/`.

Before updating a standalone skill already present under `~/.codex/skills/`, check `~/.skill-market/managed-skills.json`. If the skill is not listed there, it is unmanaged; ask the user to confirm before adopting or overwriting it. When updating a managed skill, copy to `activePath`, remove or replace any existing files at `disabledPath`, then set status to `installed`.

Report when Codex requires a new session before the updated plugin takes effect.
