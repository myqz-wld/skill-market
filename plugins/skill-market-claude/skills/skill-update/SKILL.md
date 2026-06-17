---
name: skill-update
description: Update an installed Claude Skill Market plugin or standalone Claude skill from the remote catalog.
disable-model-invocation: true
---

# Skill Update for Claude

Use this skill when the user wants an installed Claude Skill Market item refreshed from the remote catalog.

## Repository Source

Before changing local state:

- Ensure `~/.skill-market/config.json` exists; if missing, create it with default `repoUrl: git@github.com:myqz-wld/skill-market.git`, `cachePath: ~/.skill-market/cache/skill-market`, and `cacheTtlSeconds: 86400`.
- Resolve settings as environment variable > config field > default. `SKILL_MARKET_REPO_URL` and `SKILL_MARKET_CACHE` map to `repoUrl` and `cachePath`.
- Use `repoUrl` as the source of truth and `cachePath` only as a working copy. Use `SKILL_MARKET_REPO` or config `repoPath` only when the user explicitly chooses a local development checkout; never default to the current directory. When selected, read that checkout directly and skip cache clone, fetch, markers, and TTL.
- Without `repoPath`, clone the cache when missing, then fetch the remote and fast-forward the cache before copying files. After fetch, write the cache marker with `repoUrl`, `fetchedAt`, and `head`.

## Update

- Plugin: run `claude plugin marketplace update skill-market`, then `claude plugin update <plugin-name>@skill-market`.
- Standalone Claude skill: read its catalog `Version` from `skills/INDEX.md`, then copy `skills/claude/<skill-name>/` from the cache to `~/.claude/skills/<skill-name>/`.

Before updating a standalone skill already present under `~/.claude/skills/`, check `~/.skill-market/managed-skills.json`. If the skill is not listed there, it is unmanaged; ask the user to confirm before adopting or overwriting it. When updating a managed skill, compare `installedVersion` with the catalog `Version`; if they match, report that it is already current unless the user asked to force a reinstall. After copying to `activePath`, remove or replace any existing files at `disabledPath`, set `installedVersion` to the catalog version, and set status to `installed`.

Report when Claude requires a new session or restart before the updated plugin takes effect.
