---
name: skill-market
description: "Route general Codex Skill Market requests to the focused local inventory, catalog discovery, download, install, update, enable, disable, uninstall, proposal, or configuration workflow."
---
# Skill Market for Codex

Resolve `<plugin-root>` as the parent of the `skills/` directory containing this loaded Skill. Run only `node "<plugin-root>/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Route to one sibling Skill: local inventory → `skill-list`; catalog browse/search/id lookup → `skill-discover`; export → `skill-download`; lifecycle → the same-named Skill; catalog add/update/retire/remove or PR → `skill-propose`. Load that sibling before acting.

Default to Codex; use other adapters only when explicitly requested, with no implicit target expansion. For configuration only, run `node "<plugin-root>/cli/bin/skill-market.mjs" config show --json`, `node "<plugin-root>/cli/bin/skill-market.mjs" config set <key> <value> --json`, or `node "<plugin-root>/cli/bin/skill-market.mjs" config unset <key> --json`; `show` must not create config, and set/unset require the exact requested key/value.
