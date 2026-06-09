---
name: skill-disable
description: Disable a Claude Skill Market plugin or standalone Claude skill while preserving local files.
disable-model-invocation: true
---

# Skill Disable for Claude

Use this skill when the user wants a local Claude Skill Market installation disabled but kept on disk. Do not mutate the remote marketplace repository.

## Disable

- Plugin: run `claude plugin disable <plugin-name>@skill-market`.
- Standalone Claude skill: move `~/.claude/skills/<skill-name>/` to `~/.claude/skills.disabled/<skill-name>/`.

Before disabling a standalone skill, check `~/.skill-market/managed-skills.json`. If the skill is not listed there, it is unmanaged; ask the user to confirm before adopting or moving it. When disabling a managed skill, set status to `disabled`, keep `installedVersion`, keep `activePath` as the restore target, and set `disabledPath` to the moved directory.

Create `~/.claude/skills.disabled/` if it does not exist. Do not overwrite an existing disabled copy unless the user explicitly asks.

If the user wants the item removed from local disk, route that to `skill-uninstall`. If the user wants the item removed from Skill Market itself, route that to `skill-upload` as a deletion PR.
