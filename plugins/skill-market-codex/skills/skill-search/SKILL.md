---
name: skill-search
description: Search the remote Skill Market catalog for Codex plugins and standalone Codex skills, using a local cache when available.
---

# Skill Search for Codex

Use this skill to search Skill Market without installing anything.

## Repository Source

Use the remote repository as the source of truth:

1. `SKILL_MARKET_REPO_URL` environment variable.
2. `~/.skill-market/config.json` field `repoUrl`.
3. Default: `git@github.com:myqz-wld/skill-market.git`.

Use the local cache only as a working copy:

1. `SKILL_MARKET_CACHE` environment variable.
2. `~/.skill-market/config.json` field `cachePath`.
3. Default: `~/.skill-market/cache/skill-market`.

Only use `SKILL_MARKET_REPO` or config field `repoPath` when the user explicitly wants a local development checkout. Do not treat the current directory as the default repository.

For search, use the cache as-is when it exists. Clone the remote only when the cache is missing, and fetch only when the user asks for latest results.

## Search Targets

- Codex plugins: `.agents/plugins/marketplace.json` and `plugins/`.
- Standalone Codex skills: `skills/INDEX.md` and `skills/codex/`.

Return matches with type, adapter, name, repository path, and a short description.
