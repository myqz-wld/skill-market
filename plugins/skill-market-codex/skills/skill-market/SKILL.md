---
name: skill-market
description: Manage this Codex plugin marketplace repository: browse, install, update, delete, download, and submit skill/plugin uploads through PRs.
---

# Skill Market for Codex

Use this skill to manage the native Codex plugin marketplace repository at:

```text
/Users/wanglidong/Repository/skill-market
```

The repository is the market. It provides no service, API, or custom installer. Use Codex's plugin marketplace structure and normal git operations.

## Marketplace Files

Read these first:

```text
.agents/plugins/marketplace.json
plugins/
```

For Codex plugins, source paths come from `.agents/plugins/marketplace.json`.

## Browse

List available Codex plugins by reading `.agents/plugins/marketplace.json`, then inspect each `plugins/<name>/` directory.

## Install / Update / Delete

Use native Codex plugin commands when the user asks to manage installed marketplace plugins:

```bash
codex plugin marketplace add /Users/wanglidong/Repository/skill-market
codex plugin add <plugin-name>@skill-market
codex plugin marketplace upgrade skill-market
codex plugin remove <plugin-name>@skill-market
```

Deleting an installed plugin means uninstalling it with Codex's plugin command. Deleting a marketplace plugin means opening a PR that removes or retires the marketplace entry and associated plugin files.

If the current Codex environment cannot run plugin commands, explain the exact marketplace/plugin entry that should be installed and keep changes inside the repository.

## Download

Download means export a plugin or skill package without installing it. Copy or archive the selected `plugins/<name>/` directory to the destination requested by the user.

## Upload Through PR

Uploading means proposing a marketplace change. It is not published until PR merge.

1. Confirm the target is Codex or cross-adapter.
2. Check `git status`; do not mix unrelated dirty changes.
3. Create a branch named `market/<type>/codex/<name>`.
4. Add or update the plugin under `plugins/<plugin-name>/`.
5. Ensure `.codex-plugin/plugin.json` exists for Codex plugins.
6. Add or update skills under `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`.
7. Update `.agents/plugins/marketplace.json`.
8. Commit, push, and create a PR.

Before PR merge, tell the user the upload is proposed, not published.

## Delete From Marketplace Through PR

1. Confirm the target is a Codex marketplace deletion.
2. Create a branch named `market/delete/codex/<name>`.
3. Remove or retire the plugin entry in `.agents/plugins/marketplace.json`.
4. Remove plugin files only when the user explicitly wants the repository copy deleted.
5. Commit, push, and create a PR.

Before PR merge, tell the user the deletion is proposed, not published.
