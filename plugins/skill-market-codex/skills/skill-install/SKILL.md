---
name: skill-install
description: Install a Codex Skill Market plugin or standalone Codex skill and record managed standalone skill state with its catalog version.
---

# Skill Install for Codex

Use this skill when the user wants a Skill Market entry installed locally. Download-only requests belong to `skill-download`; install changes local Codex state.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, `SKILL_MARKET_CACHE_TTL_SECONDS`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` / `cacheTtlSeconds` override those defaults. `repoPath` is only an explicit local development override. `~/.skill-market/config.json` is required: if it is missing, create it with the default `repoUrl`, `cachePath`, and `cacheTtlSeconds` values before continuing.

For install, clone the cache when missing. Fetch when the user asks for latest before install or the cache marker is missing or older than `cacheTtlSeconds`; default TTL is `86400` seconds. `cacheTtlSeconds: 0` disables automatic TTL refresh. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale before installing.

## Install

- Plugin: run `codex plugin add <plugin-name>@skill-market`.
- Standalone Codex skill: read its `Version` from `skills/INDEX.md`, then copy `skills/codex/<skill-name>/` from the cache to `~/.codex/skills/<skill-name>/`.

Before installing over an existing active or disabled local skill absent from `~/.skill-market/managed-skills.json`, ask the user before adopting or overwriting it.

After installing a standalone skill, add or update its entry in `~/.skill-market/managed-skills.json` with `adapter: "codex"`, `catalogPath: "skills/codex/<skill-name>"`, `installedVersion: "<catalog-version>"`, `activePath: "~/.codex/skills/<skill-name>"`, `disabledPath: "~/.codex/skills.disabled/<skill-name>"`, and `status: "installed"`. If a managed disabled copy already exists at `disabledPath`, remove or replace it before setting status to `installed`.
