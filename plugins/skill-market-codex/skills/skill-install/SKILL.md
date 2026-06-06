---
name: skill-install
description: Install a Codex Skill Market plugin or standalone Codex skill and record standalone skill management state.
---

# Skill Install for Codex

Use this skill to install a Skill Market entry. Download is separate; install changes local Codex state.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` override those defaults. `repoPath` is only an explicit local development override.

Use the cache as-is when it exists. Clone the remote only when the cache is missing; fetch only when the user asks for latest before install.

## Install

- Plugin: run `codex plugin add <plugin-name>@skill-market`.
- Standalone Codex skill: copy `skills/codex/<skill-name>/` from the cache to `~/.codex/skills/<skill-name>/`.

Before installing over an existing active or disabled local skill absent from `~/.skill-market/managed-skills.json`, ask the user before adopting or overwriting it.

After installing a standalone skill, add or update its entry in `~/.skill-market/managed-skills.json` with `adapter: "codex"`, `catalogPath: "skills/codex/<skill-name>"`, `activePath: "~/.codex/skills/<skill-name>"`, `disabledPath: "~/.codex/skills.disabled/<skill-name>"`, and `status: "installed"`. If a managed disabled copy already exists at `disabledPath`, remove or replace it before setting status to `installed`.
