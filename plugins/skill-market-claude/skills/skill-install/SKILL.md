---
name: skill-install
description: Install a Claude Skill Market plugin or standalone Claude skill.
disable-model-invocation: true
---

# Skill Install for Claude

Use this skill when the user wants a Skill Market entry installed locally. Download-only requests belong to `skill-download`; install changes local Claude state.

## Repository Source

Before reading the catalog or cache:

- Ensure `~/.skill-market/config.json` exists; if missing, create it with default `repoUrl: git@github.com:myqz-wld/skill-market.git`, `cachePath: ~/.skill-market/cache/skill-market`, and `cacheTtlSeconds: 86400`.
- Resolve settings as environment variable > config field > default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `SKILL_MARKET_CACHE_TTL_SECONDS` map to `repoUrl`, `cachePath`, and `cacheTtlSeconds`.
- Use `repoUrl` as the source of truth and `cachePath` only as a working copy. Use `SKILL_MARKET_REPO` or config `repoPath` only when the user explicitly chooses a local development checkout; never default to the current directory. When selected, read that checkout directly and skip cache clone, fetch, markers, and TTL.
- Without `repoPath`, clone the cache when missing. Fetch when the user asks for latest before install or `<cachePath>/.skill-market-cache.json` is missing or older than `cacheTtlSeconds`; `0` disables automatic TTL refresh.
- After clone or fetch, write the cache marker with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale before installing.

## Install

- Plugin: run `claude plugin install <plugin-name>@skill-market`.
- Standalone Claude skill: read its `Version` from `skills/INDEX.md`, then copy `skills/claude/<skill-name>/` from the cache to `~/.claude/skills/<skill-name>/`.

Before installing over an existing active or disabled local skill absent from `~/.skill-market/managed-skills.json`, ask the user before adopting or overwriting it.

After installing a standalone skill, add or update its entry in `~/.skill-market/managed-skills.json` with `adapter: "claude"`, `catalogPath: "skills/claude/<skill-name>"`, `installedVersion: "<catalog-version>"`, `activePath: "~/.claude/skills/<skill-name>"`, `disabledPath: "~/.claude/skills.disabled/<skill-name>"`, and `status: "installed"`. If a managed disabled copy already exists at `disabledPath`, remove or replace it before setting status to `installed`.
