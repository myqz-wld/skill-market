---
description: Entry point for the Claude Skill Market management skills.
disable-model-invocation: true
---

# Skill Market for Claude

Use this skill as the entry point for Skill Market. Prefer the focused skills for actual work:

- `skill-list`: list managed skills and local unmanaged skills.
- `skill-search`: search plugins and standalone Claude skills.
- `skill-download`: download a package without installing it.
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

`skills/INDEX.md` is the managed skill ledger. If a local Claude skill is not listed there, it is unmanaged; ask the user before disabling, updating, uninstalling, or overwriting it.
