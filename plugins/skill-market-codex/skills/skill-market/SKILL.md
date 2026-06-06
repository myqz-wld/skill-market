---
name: skill-market
description: Manage this Codex plugin marketplace repository: browse, install, update, delete, download, and submit skill/plugin uploads through PRs.
---

# Skill Market for Codex

Use this skill to manage the native Codex plugin marketplace repository. Resolve the repository path in this order:

1. `SKILL_MARKET_REPO` environment variable.
2. `~/.skill-market/config.json` with a `repoPath` string.
3. Default: `/Users/wanglidong/Repository/skill-market`.

If a configured path does not exist or is not a directory, report the bad value and use the next source in the list.

After resolving the repository path, refer to it as `<repo-path>` and run repository file and git operations from that path.

The repository is the market. It provides no service, API, or custom installer. Use Codex's plugin marketplace structure and normal git operations.

## Catalog Files

Read these first:

```text
.agents/plugins/marketplace.json
plugins/
skills/INDEX.md
skills/codex/
```

For Codex plugins, source paths come from `.agents/plugins/marketplace.json`.
For standalone Codex skills, source paths live under `skills/codex/<skill-name>/`.
Do not place managed standalone skills under `plugins/skill-market-codex/`; that plugin contains only this bootstrap management skill.

## Browse

List available Codex plugins by reading `.agents/plugins/marketplace.json`, then inspect each `plugins/<name>/` directory.
List available standalone Codex skills by reading `skills/INDEX.md`, then inspect `skills/codex/<skill-name>/`.

## Install / Update / Delete

Use native Codex plugin commands when the user asks to manage installed marketplace plugins:

```bash
codex plugin marketplace add <repo-path>
codex plugin add <plugin-name>@skill-market
codex plugin marketplace upgrade skill-market
codex plugin remove <plugin-name>@skill-market
```

For standalone Codex skills, install and update by copying `<repo-path>/skills/codex/<skill-name>/` to `~/.codex/skills/<skill-name>/`. Delete an installed standalone skill by removing `~/.codex/skills/<skill-name>/`.

Deleting an installed plugin means uninstalling it with Codex's plugin command. Deleting a marketplace plugin or standalone skill from this repository means opening a PR that removes or retires the catalog entry and associated files.

If the current Codex environment cannot run plugin commands, explain the exact marketplace/plugin entry that should be installed and keep changes inside the repository.

## Download

Download means export a plugin or skill package without installing it. Copy or archive the selected `plugins/<name>/` or `skills/codex/<skill-name>/` directory to the destination requested by the user.

## Upload Through PR

Uploading means proposing a marketplace change. It is not published until PR merge.

1. Confirm the target is a Codex plugin, Codex standalone skill, or cross-adapter upload.
2. Check `git status`; do not mix unrelated dirty changes.
3. Create a branch named `market/<type>/codex/<name>`.
4. For plugin uploads, add or update `plugins/<plugin-name>/`, ensure `.codex-plugin/plugin.json` exists, and update `.agents/plugins/marketplace.json`.
5. For standalone skill uploads, add or update `skills/codex/<skill-name>/SKILL.md` and update `skills/INDEX.md`.
6. Commit, push, and create a PR.

Before PR merge, tell the user the upload is proposed, not published.

## Delete From Marketplace Through PR

1. Confirm the target is a Codex plugin or standalone skill marketplace deletion.
2. Create a branch named `market/delete/codex/<name>`.
3. For plugin deletion, remove or retire the plugin entry in `.agents/plugins/marketplace.json`.
4. For standalone skill deletion, remove or retire the skill row in `skills/INDEX.md`.
5. Remove repository files only when the user explicitly wants the repository copy deleted.
6. Commit, push, and create a PR.

Before PR merge, tell the user the deletion is proposed, not published.
