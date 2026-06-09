---
name: skill-uninstall
description: Remove an installed Claude Skill Market plugin or standalone Claude skill from the local machine.
disable-model-invocation: true
---

# Skill Uninstall for Claude

Use this skill when the user wants a Claude Skill Market installation removed from local disk. Do not mutate the remote marketplace repository.

If the user wants to preserve local files, use `skill-disable` instead of uninstalling.

## Uninstall

- Plugin: run `claude plugin remove <plugin-name>@skill-market`.
- Standalone Claude skill: remove `~/.claude/skills/<skill-name>/`.

Before uninstalling a standalone skill, check `~/.skill-market/managed-skills.json`. If the skill is not listed there, it is unmanaged; ask the user to confirm before deleting it. When uninstalling a managed skill, remove both `activePath` and `disabledPath` when either exists, keep `installedVersion`, then set status to `uninstalled` instead of dropping the record.

If the user wants the item removed from Skill Market itself, route that to `skill-upload` as a deletion PR.
