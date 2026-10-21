---
name: skill-propose
description: "Propose explicit Codex Skill Market add, update, retire, or remove changes through a validated local commit and optionally a confirmed pull request."
---
# Skill Propose for Codex

Resolve `<plugin-root>` as the parent of the `skills/` directory containing this loaded Skill. Run only `node "<plugin-root>/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics. Use this for catalog proposals, not local lifecycle changes; bootstrap Skill Market plugins are forbidden targets.

Before creating a spec or selecting options, read `node "<plugin-root>/cli/bin/skill-market.mjs" help --json`.
Use `proposal.spec` and `commands.proposal.actions` in the returned `data` for
fields, limits, version rules, command syntax, options and effects. Follow
`proposal.safety` and `proposal.recovery` for constraints and recovery.
Create one UTF-8 JSON spec for the requested action and exact canonical package
IDs; never expand adapters implicitly.

Run these local phases with the exact returned proposal ID:

```text
node "<plugin-root>/cli/bin/skill-market.mjs" proposal plan --spec <json-file> [source options] --json
node "<plugin-root>/cli/bin/skill-market.mjs" proposal prepare <proposal-id> --json
node "<plugin-root>/cli/bin/skill-market.mjs" proposal status <proposal-id> --json
```

Do not edit proposal state/worktrees, catalogs, versions, or Git history. After
prepare, show targets, prepared commit, diff hash, branch, validation results and
warnings.

Before submit, verify the prepared commit and diff hash. Reuse existing explicit
authorization only if it covers this proposal and its fork/push/PR effects;
otherwise obtain the missing authorization for the prepared result. Then run
`node "<plugin-root>/cli/bin/skill-market.mjs" proposal submit <proposal-id> --confirm-external-effects [submit options] --json`.
Never force-push; retry the same pushed proposal within the authorized scope to
resume PR discovery.

Abort requested local work with `node "<plugin-root>/cli/bin/skill-market.mjs" proposal abort <proposal-id> [--confirm-discard] --json`.
Inspect reported local drift first; add `--confirm-discard` only when existing or
new explicit authorization covers discarding those exact changes.
Pushed/submitted proposals cannot be aborted.

Parse stdout as JSON even on exit 1–4. Report the summary, data and warnings.
For `needs_confirmation`, show the exact condition and reuse existing explicit
authorization only if it covers that condition; otherwise ask before adding the
named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`;
perform recovery only within scope and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
