# CLAUDE.md

Read `AGENTS.md` before making changes. It is the canonical repository contract; this file contains only Claude-specific additions.

## Claude-Specific Rules

- In an installed Claude plugin, resolve the bundled CLI and resources from `CLAUDE_PLUGIN_ROOT`; do not assume the repository checkout or current working directory is the plugin root.
- Keep Claude package ids and CLI selection pinned to the `claude` adapter unless the user explicitly requests another adapter.
- Detect and preserve native `user`, `project`, `local`, or managed-policy scope for plugin lifecycle operations. If scope cannot be determined safely, return a blocked result instead of guessing.
- Keep deterministic cache, filesystem, state, native-plugin, Git, and GitHub mechanics in the bundled CLI rather than reproducing them in a Skill prompt.
- Mutating focused Skills (`skill-download`, `skill-install`, `skill-update`, `skill-enable`, `skill-disable`, `skill-uninstall`, and `skill-propose`) must declare `disable-model-invocation: true`. The router, `skill-list`, and `skill-discover` omit it so Claude can select read-only discovery and routing flows normally.
- Validate the Claude bootstrap package with `claude plugin validate plugins/skill-market-claude` whenever its manifest, Skills, hooks, commands, agents, or bundled resources change.
