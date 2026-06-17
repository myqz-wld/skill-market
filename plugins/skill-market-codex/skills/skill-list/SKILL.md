---
name: skill-list
description: List Codex skills managed by Skill Market with installed and catalog versions, without scanning unrelated local skills.
---

# Skill List for Codex

Use this skill when the user wants Codex entries managed by Skill Market, not a scan of every local Codex skill.

## Repository Source

Before reading the catalog or cache:

- Ensure `~/.skill-market/config.json` exists; if missing, create it with default `repoUrl: git@github.com:myqz-wld/skill-market.git`, `cachePath: ~/.skill-market/cache/skill-market`, and `cacheTtlSeconds: 86400`.
- Resolve settings as environment variable > config field > default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `SKILL_MARKET_CACHE_TTL_SECONDS` map to `repoUrl`, `cachePath`, and `cacheTtlSeconds`.
- Use `repoUrl` as the source of truth and `cachePath` only as a working copy. Use `SKILL_MARKET_REPO` or config `repoPath` only when the user explicitly chooses a local development checkout; never default to the current directory. When selected, read that checkout directly and skip cache clone, fetch, markers, and TTL.
- Without `repoPath`, clone the cache when missing. Fetch when the user asks for latest status or `<cachePath>/.skill-market-cache.json` is missing or older than `cacheTtlSeconds`; `0` disables automatic TTL refresh.
- After clone or fetch, write the cache marker with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale.

## List

1. Read `~/.skill-market/managed-skills.json`; this is the local managed state file.
2. Report only Codex entries from that state file, including name, local status, `installedVersion`, `catalogPath`, `activePath`, and `disabledPath`.
3. Read `skills/INDEX.md` only to enrich managed entries with remote catalog version, status, and description. Flag entries where `installedVersion` differs from the catalog `Version`.
4. If the state file is missing or has no Codex entries, report that no Codex skills are currently managed.

Do not scan or list unrelated local skills from `~/.codex/skills/` by default. If the user names a specific local skill and asks to manage it, ask for confirmation before adding it to `managed-skills.json`.
