---
name: skill-install
description: Install a Claude Skill Market plugin or standalone Claude skill and record managed standalone skill state with its catalog version.
disable-model-invocation: true
---

# Skill Install for Claude

Use this skill when the user wants a Skill Market entry installed locally. Download-only requests belong to `skill-download`; install changes local Claude state.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, `SKILL_MARKET_CACHE_TTL_SECONDS`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` / `cacheTtlSeconds` override those defaults. `repoPath` is only an explicit local development override.

For install, clone the cache when missing. Fetch when the user asks for latest before install or the cache marker is missing or older than `cacheTtlSeconds`; default TTL is `86400` seconds. `cacheTtlSeconds: 0` disables automatic TTL refresh. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale before installing.

## Install

- Plugin: run `claude plugin install <plugin-name>@skill-market`.
- Standalone Claude skill: read its `Version` from `skills/INDEX.md`, then copy `skills/claude/<skill-name>/` from the cache to `~/.claude/skills/<skill-name>/`.

Before installing over an existing active or disabled local skill absent from `~/.skill-market/managed-skills.json`, ask the user before adopting or overwriting it.

After installing a standalone skill, add or update its entry in `~/.skill-market/managed-skills.json` with `adapter: "claude"`, `catalogPath: "skills/claude/<skill-name>"`, `installedVersion: "<catalog-version>"`, `activePath: "~/.claude/skills/<skill-name>"`, `disabledPath: "~/.claude/skills.disabled/<skill-name>"`, and `status: "installed"`. If a managed disabled copy already exists at `disabledPath`, remove or replace it before setting status to `installed`.
