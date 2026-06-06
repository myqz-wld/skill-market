---
name: skill-market
description: Use this skill when the user wants Claude to browse, install, update, download, or submit PR uploads for the Skill Market repository.
---

# Skill Market for Claude

Use this skill to manage the Skill Market repository. The market provides no service, CLI, API, or installer; all actions are performed by Claude using repository files and git.

## Repository

```text
/Users/wanglidong/Repository/skill-market
```

## When to Use

Use this skill when the user asks to:

- browse market skills or plugins
- install or update a Claude skill from the market
- download a Claude skill or plugin package from the market
- upload a Claude skill or plugin by creating a PR

## Read / Browse

Read:

```text
registry/INDEX.md
registry/skills/claude/
registry/plugins/claude/
```

Do not treat Codex entries as Claude-compatible unless the user explicitly asks to inspect them.

## Install / Update Skill

Copy:

```text
registry/skills/claude/<name>/ -> ~/.claude/skills/<name>/
```

Rules:

- Replacing an existing local skill is allowed only after confirming the target path.
- Update is the same operation as install: copy the current registry version over the local directory.
- Preserve the full package directory, including `references/`, `scripts/`, and `assets/`.

## Download Skill

Copy or archive the registry package to the user-requested destination. Do not install it unless the user asks for installation.

## Upload Skill

Uploads must go through PR:

1. Check git status and refuse to mix unrelated dirty changes.
2. Create a branch named `market/skill/claude/<name>`.
3. Add the package under `registry/skills/claude/<name>/`.
4. Verify `SKILL.md` frontmatter `name` equals `<name>` and has `description`.
5. Update `registry/INDEX.md`.
6. Commit the registry and index changes.
7. Push the branch.
8. Create a PR. If `gh` is unavailable, provide the push branch and PR creation instructions.

PR merge is the only publish step. Before merge, tell the user the skill is proposed, not published.

## Plugin Upload

Use:

```text
registry/plugins/claude/<name>/
```

Require `MARKET.md` with install instructions, permissions, dependencies, and maintainer. Upload still follows the same branch, commit, push, PR flow.
