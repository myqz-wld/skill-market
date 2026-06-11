---
name: skill-list
description: List Claude skills managed by Skill Market with installed and catalog versions, without scanning unrelated local skills.
disable-model-invocation: true
---

# Skill List for Claude

Use this skill when the user wants Claude entries managed by Skill Market, not a scan of every local Claude skill.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, `SKILL_MARKET_CACHE_TTL_SECONDS`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` / `cacheTtlSeconds` override those defaults. `repoPath` is only an explicit local development override. `~/.skill-market/config.json` is required: if it is missing, create it with the default `repoUrl`, `cachePath`, and `cacheTtlSeconds` values before continuing.

For list, clone the cache when missing. Fetch when the user asks for latest status or the cache marker is missing or older than `cacheTtlSeconds`; default TTL is `86400` seconds. `cacheTtlSeconds: 0` disables automatic TTL refresh. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale.

## List

1. Read `~/.skill-market/managed-skills.json`; this is the local managed state file.
2. Report only Claude entries from that state file, including name, local status, `installedVersion`, `catalogPath`, `activePath`, and `disabledPath`.
3. Read `skills/INDEX.md` only to enrich managed entries with remote catalog version, status, and description. Flag entries where `installedVersion` differs from the catalog `Version`.
4. If the state file is missing or has no Claude entries, report that no Claude skills are currently managed.

Do not scan or list unrelated local skills from `~/.claude/skills/` by default. If the user names a specific local skill and asks to manage it, ask for confirmation before adding it to `managed-skills.json`.
