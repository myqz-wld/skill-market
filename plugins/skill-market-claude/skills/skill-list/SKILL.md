---
description: List managed Claude Skill Market skills and identify local Claude skills that are not managed.
disable-model-invocation: true
---

# Skill List for Claude

Use this skill to list managed Skill Market entries and local unmanaged Claude skills.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` override those defaults. `repoPath` is only an explicit local development override.

Use the cache as-is when it exists. Clone the remote only when the cache is missing; fetch only when the user asks for latest status.

## List

1. Read `skills/INDEX.md`; this is the managed skill ledger.
2. Report each Claude row with skill name, path, status, and description.
3. Scan `~/.claude/skills/` and `~/.claude/skills.disabled/` when the user asks for local state.
4. Mark local skills absent from `skills/INDEX.md` as `unmanaged`.

Do not disable, update, uninstall, or overwrite unmanaged local skills without explicit user confirmation.
