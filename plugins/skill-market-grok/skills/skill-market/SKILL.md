---
name: skill-market
description: "Route general Grok Skill Market requests to the focused local inventory, catalog discovery, download, install, update, enable, disable, uninstall, proposal, or configuration workflow."
---
# Skill Market for Grok

Use the installed plugin root in `GROK_PLUGIN_ROOT`. Run only `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics.

Route to one sibling Skill: local inventory → `skill-list`; catalog browse/search/id lookup → `skill-discover`; export → `skill-download`; lifecycle → the same-named Skill; catalog add/update/retire/remove or PR → `skill-propose`. Load that sibling before acting.

Default to Grok; use other adapters only when explicitly requested, with no implicit target expansion. For configuration only, run `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" config show --json`, `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" config set <key> <value> --json`, or `node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs" config unset <key> --json`; `show` must not create config, and set/unset require the exact requested key/value.
