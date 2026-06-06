---
description: Entry point for the Claude Skill Market management skills.
disable-model-invocation: true
---

# Skill Market for Claude

Use this skill as the entry point for Skill Market. Prefer the focused skills for actual work:

- `skill-list`: list skills already managed by Skill Market.
- `skill-search`: search plugins and standalone Claude skills.
- `skill-download`: download a package without installing it.
- `skill-install`: install a plugin or standalone Claude skill.
- `skill-disable`: disable a local installation without deleting its files.
- `skill-uninstall`: remove a local installation.
- `skill-update`: update a local installation from the remote catalog.
- `skill-upload`: create a branch and PR for uploads or marketplace deletions.

## Repository Model

The remote repository is the source of truth. The default remote is:

```text
git@github.com:myqz-wld/skill-market.git
```

The local cache is only a working copy. The default cache path is:

```text
~/.skill-market/cache/skill-market
```

Configuration overrides:

- `SKILL_MARKET_REPO_URL` or `~/.skill-market/config.json` field `repoUrl`.
- `SKILL_MARKET_CACHE` or `~/.skill-market/config.json` field `cachePath`.
- `SKILL_MARKET_REPO` or config field `repoPath` only for explicit local development.

Do not treat the current directory as the default repository.

## Storage

- Bootstrap management skills live inside `plugins/skill-market-claude/skills/`.
- Managed standalone Claude skills live under `skills/claude/`.
- Claude plugins are listed in `.claude-plugin/marketplace.json` and live under `plugins/`.

Upload is not publish. A skill or plugin is published only after its PR is merged.

`skills/INDEX.md` is the remote skill catalog index. Local Claude management state lives in `~/.skill-market/managed-skills.json`.

Only skills installed through Skill Market or explicitly adopted by the user are managed. Do not list unrelated local Claude skills. If a requested operation touches a local skill absent from `managed-skills.json`, ask the user before adopting or modifying it.
