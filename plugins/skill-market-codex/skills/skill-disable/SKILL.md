---
name: skill-disable
description: Disable an installed Codex Skill Market standalone skill without deleting its files.
---

# Skill Disable for Codex

Use this skill to disable a local standalone skill while preserving files. This does not remove anything from the remote marketplace repository.

## Disable

- Standalone Codex skill: move `~/.codex/skills/<skill-name>/` to `~/.codex/skills.disabled/<skill-name>/`.
- Codex plugin: the current Codex CLI exposes `add`, `list`, `marketplace`, and `remove`, but no plugin disable command. Do not use `codex plugin remove` as a fake disable.

Before disabling a standalone skill, check `skills/INDEX.md`. If the skill is not listed there, it is unmanaged; ask the user to confirm before moving it.

Create `~/.codex/skills.disabled/` if it does not exist. Do not overwrite an existing disabled copy unless the user explicitly asks.

If the user wants the item removed from local disk, route that to `skill-uninstall`. If the user wants the item removed from Skill Market itself, route that to `skill-upload` as a deletion PR.
