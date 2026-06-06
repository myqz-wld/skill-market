---
description: Disable an installed Claude Skill Market plugin or standalone Claude skill without deleting its files.
disable-model-invocation: true
---

# Skill Disable for Claude

Use this skill to disable a local installation while preserving files. This does not remove anything from the remote marketplace repository.

## Disable

- Plugin: run `claude plugin disable <plugin-name>@skill-market`.
- Standalone Claude skill: move `~/.claude/skills/<skill-name>/` to `~/.claude/skills.disabled/<skill-name>/`.

Create `~/.claude/skills.disabled/` if it does not exist. Do not overwrite an existing disabled copy unless the user explicitly asks.

If the user wants the item removed from local disk, route that to `skill-uninstall`. If the user wants the item removed from Skill Market itself, route that to `skill-upload` as a deletion PR.
