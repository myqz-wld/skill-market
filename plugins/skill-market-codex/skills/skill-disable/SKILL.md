---
name: skill-disable
description: Disable a Codex Skill Market standalone skill while preserving local files, or explain that Codex plugins cannot be disabled.
---

# Skill Disable for Codex

Use this skill when the user wants a local Codex Skill Market installation disabled but kept on disk. Do not mutate the remote marketplace repository.

## Disable

- Standalone Codex skill: move `~/.codex/skills/<skill-name>/` to `~/.codex/skills.disabled/<skill-name>/`.
- Codex plugin: the current Codex CLI exposes `add`, `list`, `marketplace`, and `remove`, but no plugin disable command. Do not use `codex plugin remove` as a fake disable.

Before disabling a standalone skill, check `~/.skill-market/managed-skills.json`. If the skill is not listed there, it is unmanaged; ask the user to confirm before adopting or moving it. When disabling a managed skill, set status to `disabled`, keep `installedVersion`, keep `activePath` as the restore target, and set `disabledPath` to the moved directory.

Create `~/.codex/skills.disabled/` if it does not exist. Do not overwrite an existing disabled copy unless the user explicitly asks.

If the user wants the item removed from local disk, route that to `skill-uninstall`. If the user wants the item removed from Skill Market itself, route that to `skill-upload` as a deletion PR.
