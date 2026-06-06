---
description: Uninstall an installed Claude Skill Market plugin or standalone Claude skill from the local machine.
disable-model-invocation: true
---

# Skill Uninstall for Claude

Use this skill to remove local installations. This does not remove anything from the remote marketplace repository.

If the user wants to preserve local files, use `skill-disable` instead of uninstalling.

## Uninstall

- Plugin: run `claude plugin remove <plugin-name>@skill-market`.
- Standalone Claude skill: remove `~/.claude/skills/<skill-name>/`.

If the user wants the item removed from Skill Market itself, route that to `skill-upload` as a deletion PR.
