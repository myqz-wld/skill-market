---
name: skill-update
description: Update an installed Claude Skill Market plugin or standalone Claude skill from the remote catalog.
disable-model-invocation: true
---

# Skill Update for Claude

Use this skill when the user wants an installed Claude Skill Market item refreshed from the remote catalog.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` override those defaults. `repoPath` is only an explicit local development override. `~/.skill-market/config.json` is required: if it is missing, create it with the default `repoUrl`, `cachePath`, and `cacheTtlSeconds` (`86400`) values before continuing.

For update, fetch the remote and fast-forward the cache before copying files.

## Update

- Plugin: run `claude plugin marketplace update skill-market`, then `claude plugin update <plugin-name>@skill-market`.
- Standalone Claude skill: read its catalog `Version` from `skills/INDEX.md`, then copy `skills/claude/<skill-name>/` from the cache to `~/.claude/skills/<skill-name>/`.

Before updating a standalone skill already present under `~/.claude/skills/`, check `~/.skill-market/managed-skills.json`. If the skill is not listed there, it is unmanaged; ask the user to confirm before adopting or overwriting it. When updating a managed skill, compare `installedVersion` with the catalog `Version`; if they match, report that it is already current unless the user asked to force a reinstall. After copying to `activePath`, remove or replace any existing files at `disabledPath`, set `installedVersion` to the catalog version, and set status to `installed`.

Report when Claude requires a new session or restart before the updated plugin takes effect.
