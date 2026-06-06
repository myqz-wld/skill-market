---
description: List Claude skills managed by Skill Market without listing unrelated local skills.
disable-model-invocation: true
---

# Skill List for Claude

Use this skill to list Claude skills managed by Skill Market.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` override those defaults. `repoPath` is only an explicit local development override.

Use the cache as-is when it exists. Clone the remote only when the cache is missing; fetch only when the user asks for latest status.

## List

1. Read `~/.skill-market/managed-skills.json`; this is the local managed state file.
2. Report only Claude entries from that state file, including name, local status, `activePath`, `disabledPath`, and catalog path.
3. Read `skills/INDEX.md` only to enrich managed entries with remote catalog status and description.
4. If the state file is missing or has no Claude entries, report that no Claude skills are currently managed.

Do not scan or list unrelated local skills from `~/.claude/skills/` by default. If the user names a specific local skill and asks to manage it, ask for confirmation before adding it to `managed-skills.json`.
