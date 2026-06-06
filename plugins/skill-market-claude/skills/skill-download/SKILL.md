---
description: Download a Claude Skill Market plugin or standalone Claude skill package without installing it.
disable-model-invocation: true
---

# Skill Download for Claude

Use this skill to export a package from Skill Market without installing it.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` override those defaults. `repoPath` is only an explicit local development override.

Use the cache as-is when it exists. Clone the remote only when the cache is missing; fetch only when the user asks for the latest package.

## Download

- Plugin package: copy or archive `plugins/<plugin-name>/`.
- Standalone Claude skill package: copy or archive `skills/claude/<skill-name>/`.

Download never installs or updates local Claude state. Do not overwrite an existing destination unless the user explicitly asks.
