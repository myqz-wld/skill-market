---
name: skill-uninstall
description: Remove an installed Codex Skill Market plugin or standalone Codex skill from the local machine.
---

# Skill Uninstall for Codex

Use this skill when the user wants a Codex Skill Market installation removed from local disk. Do not mutate the remote marketplace repository.

If the user wants to preserve local files, use `skill-disable` instead of uninstalling.

## Uninstall

- Plugin: run `codex plugin remove <plugin-name>@skill-market`.
- Standalone Codex skill: remove `~/.codex/skills/<skill-name>/`.

Before uninstalling a standalone skill, check `~/.skill-market/managed-skills.json`. If the skill is not listed there, it is unmanaged; ask the user to confirm before deleting it. When uninstalling a managed skill, remove both `activePath` and `disabledPath` when either exists, keep `installedVersion`, then set status to `uninstalled` instead of dropping the record.

If the user wants the item removed from Skill Market itself, route that to `skill-upload` as a deletion PR.
