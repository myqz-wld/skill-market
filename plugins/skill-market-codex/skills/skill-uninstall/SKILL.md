---
name: skill-uninstall
description: Uninstall an installed Codex Skill Market plugin or standalone Codex skill from the local machine.
---

# Skill Uninstall for Codex

Use this skill to remove local installations. This does not remove anything from the remote marketplace repository.

If the user wants to preserve local files, use `skill-disable` instead of uninstalling.

## Uninstall

- Plugin: run `codex plugin remove <plugin-name>@skill-market`.
- Standalone Codex skill: remove `~/.codex/skills/<skill-name>/`.

Before uninstalling a standalone skill, check `skills/INDEX.md`. If the skill is not listed there, it is unmanaged; ask the user to confirm before deleting it.

If the user wants the item removed from Skill Market itself, route that to `skill-upload` as a deletion PR.
