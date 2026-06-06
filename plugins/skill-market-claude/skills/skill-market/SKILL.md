---
description: Manage this Claude plugin marketplace repository: browse, install, update, delete, download, and submit skill/plugin uploads through PRs.
disable-model-invocation: true
---

# Skill Market for Claude

Use this skill to manage the native Claude plugin marketplace repository. Resolve the repository path in this order:

1. `SKILL_MARKET_REPO` environment variable.
2. `~/.skill-market/config.json` with a `repoPath` string.
3. Default: `/Users/wanglidong/Repository/skill-market`.

If a configured path does not exist or is not a directory, report the bad value and use the next source in the list.

After resolving the repository path, refer to it as `<repo-path>` and run repository file and git operations from that path.

The repository is the market. It provides no service, API, or custom installer. Use Claude Code's plugin marketplace mechanism and normal git operations.

## Catalog Files

Read these first:

```text
.claude-plugin/marketplace.json
plugins/
skills/INDEX.md
skills/claude/
```

For Claude plugins, source paths come from `.claude-plugin/marketplace.json`.
For standalone Claude skills, source paths live under `skills/claude/<skill-name>/`.
Do not place managed standalone skills under `plugins/skill-market-claude/`; that plugin contains only this bootstrap management skill.

## Browse

List available Claude plugins by reading `.claude-plugin/marketplace.json`, then inspect each `plugins/<name>/` directory.
List available standalone Claude skills by reading `skills/INDEX.md`, then inspect `skills/claude/<skill-name>/`.

## Install / Update / Delete

Use native Claude plugin commands when the user asks to manage installed marketplace plugins:

```bash
claude plugin marketplace add <repo-path>
claude plugin install <plugin-name>@skill-market
claude plugin marketplace update skill-market
claude plugin update <plugin-name>@skill-market
claude plugin remove <plugin-name>@skill-market
```

For standalone Claude skills, install and update by copying `<repo-path>/skills/claude/<skill-name>/` to `~/.claude/skills/<skill-name>/`. Delete an installed standalone skill by removing `~/.claude/skills/<skill-name>/`.

Deleting an installed plugin means uninstalling it with Claude's plugin command. Deleting a marketplace plugin or standalone skill from this repository means opening a PR that removes or retires the catalog entry and associated files.

If the user asks to inspect or copy files instead of installing through Claude, operate on the repository files directly.

## Download

Download means export a plugin or skill package without installing it. Copy or archive the selected `plugins/<name>/` or `skills/claude/<skill-name>/` directory to the destination requested by the user.

## Upload Through PR

Uploading means proposing a marketplace change. It is not published until PR merge.

1. Confirm the target is a Claude plugin, Claude standalone skill, or cross-adapter upload.
2. Check `git status`; do not mix unrelated dirty changes.
3. Create a branch named `market/<type>/claude/<name>`.
4. For plugin uploads, add or update `plugins/<plugin-name>/`, ensure `.claude-plugin/plugin.json` exists, and update `.claude-plugin/marketplace.json`.
5. For standalone skill uploads, add or update `skills/claude/<skill-name>/SKILL.md` and update `skills/INDEX.md`.
6. Commit, push, and create a PR.

Before PR merge, tell the user the upload is proposed, not published.

## Delete From Marketplace Through PR

1. Confirm the target is a Claude plugin or standalone skill marketplace deletion.
2. Create a branch named `market/delete/claude/<name>`.
3. For plugin deletion, remove or retire the plugin entry in `.claude-plugin/marketplace.json`.
4. For standalone skill deletion, remove or retire the skill row in `skills/INDEX.md`.
5. Remove repository files only when the user explicitly wants the repository copy deleted.
6. Commit, push, and create a PR.

Before PR merge, tell the user the deletion is proposed, not published.
