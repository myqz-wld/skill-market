---
name: skill-upload
description: Propose a Codex Skill Market plugin, standalone Codex skill, or deletion by creating a branch and pull request.
---

# Skill Upload for Codex

Use this skill when the user wants to propose Codex catalog changes through a pull request. Upload is not publish; publish happens only after the PR is merged.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` override those defaults. `repoPath` is only an explicit local development override.

For upload, clone the remote into the cache when missing, fetch `main`, and create the upload branch from the latest `main`.

## Upload Through PR

Reject `skill-market-claude` and `skill-market-codex` as upload or deletion targets. Bootstrap plugin changes are developer-only repository changes and must not be proposed through Skill Market management skills.

1. Confirm whether the target is a Codex plugin, standalone Codex skill, or deletion.
2. Create branch `market/<type>/codex/<name>`.
3. For plugin uploads, add or update `plugins/<plugin-name>/`, ensure `.codex-plugin/plugin.json` exists, and update `.agents/plugins/marketplace.json`.
4. For standalone skill uploads, add or update `skills/codex/<skill-name>/SKILL.md` and update `skills/INDEX.md`.
5. For deletions, remove or retire the catalog row and remove files only when the user explicitly asks.
6. Commit, push the branch, and create a PR with `gh pr create`.

If `gh` is not authenticated, push the branch when possible and give the exact `gh auth login` / `gh pr create` command needed to finish.
