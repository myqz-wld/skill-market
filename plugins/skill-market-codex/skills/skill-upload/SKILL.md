---
name: skill-upload
description: Propose a Codex Skill Market plugin, standalone Codex skill, or deletion by creating a branch and pull request.
---

# Skill Upload for Codex

Use this skill when the user wants to propose Codex catalog changes through a pull request. Upload is not publish; publish happens only after the PR is merged.

## Repository Source

Before creating the PR branch:

- Ensure `~/.skill-market/config.json` exists; if missing, create it with default `repoUrl: git@github.com:myqz-wld/skill-market.git`, `cachePath: ~/.skill-market/cache/skill-market`, and `cacheTtlSeconds: 86400`.
- Resolve settings as environment variable > config field > default. `SKILL_MARKET_REPO_URL` and `SKILL_MARKET_CACHE` map to `repoUrl` and `cachePath`.
- Use `repoUrl` as the source of truth and `cachePath` only as a working copy. Use `SKILL_MARKET_REPO` or config `repoPath` only when the user explicitly chooses a local development checkout; never default to the current directory. When selected, read that checkout directly and skip cache clone, fetch, markers, and TTL.
- Without `repoPath`, clone the cache when missing, fetch `main`, write the cache marker with `repoUrl`, `fetchedAt`, and `head`, and create the upload branch from the latest `main`.

## Upload Through PR

Reject both bootstrap plugins (`skill-market-codex` and `skill-market-claude`) as upload or deletion targets. Bootstrap plugin changes are developer-only repository changes and must not be proposed through Skill Market management skills.

1. Confirm whether the target is a Codex plugin, standalone Codex skill, or deletion.
2. Create branch `market/<type>/codex/<name>`.
3. For plugin uploads, add or update `plugins/<plugin-name>/`, ensure `.codex-plugin/plugin.json` exists, and update `.agents/plugins/marketplace.json`.
4. For standalone skill uploads, add or update `skills/codex/<skill-name>/SKILL.md`, set or bump its `Version`, and update the row in `skills/INDEX.md`.
5. For deletions, remove or retire the catalog row and remove files only when the user explicitly asks.
6. Commit, push the branch, and create a PR with `gh pr create`.

When creating or editing prompt assets in the upload, keep paired Codex and Claude or template-backed files behaviorally aligned while preserving adapter-specific paths, manifests, and commands. Write maintainer- or agent-facing instructions in English by default; use another language only for explicit user request, UI/CLI or product copy, examples, deliberate trigger anchors, or quoted/source text.

If `gh` is not authenticated, push the branch when possible and give the exact `gh auth login` / `gh pr create` command needed to finish.
