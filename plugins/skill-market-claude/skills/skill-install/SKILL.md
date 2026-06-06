---
description: Install a Claude Skill Market plugin or standalone Claude skill and record standalone skill management state.
disable-model-invocation: true
---

# Skill Install for Claude

Use this skill to install a Skill Market entry. Download is separate; install changes local Claude state.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` override those defaults. `repoPath` is only an explicit local development override.

Use the cache as-is when it exists. Clone the remote only when the cache is missing; fetch only when the user asks for latest before install.

## Install

- Plugin: run `claude plugin install <plugin-name>@skill-market`.
- Standalone Claude skill: copy `skills/claude/<skill-name>/` from the cache to `~/.claude/skills/<skill-name>/`.

Before installing over an existing active or disabled local skill absent from `~/.skill-market/managed-skills.json`, ask the user before adopting or overwriting it.

After installing a standalone skill, add or update its entry in `~/.skill-market/managed-skills.json` with `adapter: "claude"`, `catalogPath: "skills/claude/<skill-name>"`, `activePath: "~/.claude/skills/<skill-name>"`, `disabledPath: "~/.claude/skills.disabled/<skill-name>"`, and `status: "installed"`. If a managed disabled copy already exists at `disabledPath`, remove or replace it before setting status to `installed`.
