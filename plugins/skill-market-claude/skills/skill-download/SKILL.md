---
name: skill-download
description: Download a Claude Skill Market plugin or standalone Claude skill package without installing or changing local state.
disable-model-invocation: true
---

# Skill Download for Claude

Use this skill when the user wants a Skill Market package exported without installing it or changing local Claude state.

## Repository Source

Before reading the catalog or cache:

- Ensure `~/.skill-market/config.json` exists; if missing, create it with default `repoUrl: git@github.com:myqz-wld/skill-market.git`, `cachePath: ~/.skill-market/cache/skill-market`, and `cacheTtlSeconds: 86400`.
- Resolve settings as environment variable > config field > default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `SKILL_MARKET_CACHE_TTL_SECONDS` map to `repoUrl`, `cachePath`, and `cacheTtlSeconds`.
- Use `repoUrl` as the source of truth and `cachePath` only as a working copy. Use `SKILL_MARKET_REPO` or config `repoPath` only when the user explicitly chooses a local development checkout; never default to the current directory. When selected, read that checkout directly and skip cache clone, fetch, markers, and TTL.
- Without `repoPath`, clone the cache when missing. Fetch when the user asks for the latest package or `<cachePath>/.skill-market-cache.json` is missing or older than `cacheTtlSeconds`; `0` disables automatic TTL refresh.
- After clone or fetch, write the cache marker with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale.

## Download

- Plugin package: copy or archive `plugins/<plugin-name>/`.
- Standalone Claude skill package: read its `Version` from `skills/INDEX.md`, then copy or archive `skills/claude/<skill-name>/`.

If the user does not provide a destination, copy to `~/.skill-market/downloads/claude/<name>/`.

Download never installs or updates local Claude state. Do not overwrite an existing destination unless the user explicitly asks. Report the catalog version for downloaded standalone skills.
