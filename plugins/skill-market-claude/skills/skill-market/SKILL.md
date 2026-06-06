---
description: Manage this Claude plugin marketplace repository: browse, install, update, delete, download, and submit skill/plugin uploads through PRs.
disable-model-invocation: true
---

# Skill Market for Claude

Use this skill to manage the native Claude plugin marketplace repository at:

```text
/Users/wanglidong/Repository/skill-market
```

The repository is the market. It provides no service, API, or custom installer. Use Claude Code's plugin marketplace mechanism and normal git operations.

## Marketplace Files

Read these first:

```text
.claude-plugin/marketplace.json
plugins/
```

For Claude plugins, source paths come from `.claude-plugin/marketplace.json`.

## Browse

List available Claude plugins by reading `.claude-plugin/marketplace.json`, then inspect each `plugins/<name>/` directory.

## Install / Update / Delete

Prefer native Claude plugin commands when the user asks to manage installed marketplace plugins:

```bash
claude plugin marketplace add /Users/wanglidong/Repository/skill-market
claude plugin install <plugin-name>@skill-market
claude plugin marketplace update skill-market
claude plugin update <plugin-name>@skill-market
claude plugin remove <plugin-name>@skill-market
```

Deleting an installed plugin means uninstalling it with Claude's plugin command. Deleting a marketplace plugin means opening a PR that removes or retires the marketplace entry and associated plugin files.

If the user asks to inspect or copy files instead of installing through Claude, operate on the repository files directly.

## Download

Download means export a plugin or skill package without installing it. Copy or archive the selected `plugins/<name>/` directory to the destination requested by the user.

## Upload Through PR

Uploading means proposing a marketplace change. It is not published until PR merge.

1. Confirm the target is Claude or cross-adapter.
2. Check `git status`; do not mix unrelated dirty changes.
3. Create a branch named `market/<type>/claude/<name>`.
4. Add or update the plugin under `plugins/<plugin-name>/`.
5. Ensure `.claude-plugin/plugin.json` exists for Claude plugins.
6. Add or update skills under `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`.
7. Update `.claude-plugin/marketplace.json`.
8. Commit, push, and create a PR.

Before PR merge, tell the user the upload is proposed, not published.

## Delete From Marketplace Through PR

1. Confirm the target is a Claude marketplace deletion.
2. Create a branch named `market/delete/claude/<name>`.
3. Remove or retire the plugin entry in `.claude-plugin/marketplace.json`.
4. Remove plugin files only when the user explicitly wants the repository copy deleted.
5. Commit, push, and create a PR.

Before PR merge, tell the user the deletion is proposed, not published.
