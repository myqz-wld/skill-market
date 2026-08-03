---
name: skill-propose
description: "Propose explicit Codex Skill Market add, update, retire, or remove changes through a validated local commit and optionally a confirmed pull request."
---
# Skill Propose for Codex

Resolve `<plugin-root>` as the parent of the `skills/` directory containing this loaded Skill. Run only `node "<plugin-root>/cli/bin/skill-market.mjs"`; do not reproduce its cache, filesystem, state, native-plugin, Git, or GitHub mechanics. Use this for catalog proposals, not local lifecycle changes; bootstrap Skill Market plugins are forbidden targets.

Create one UTF-8 JSON spec with exactly `schemaVersion: 1`, `action: add|update|retire|remove`, a 1–160 character `summary`, and 1–50 explicit `targets`. Every target requires canonical `id`; add/update require `sourcePath` and semver `version`; add requires `description`; add/update may include `category` and `keywords`. Reject unknown fields, resolve relative sources from the spec, start new standalone packages at `0.0.1`, require increasing update versions, and never expand adapters implicitly.

Run these local phases with the exact returned proposal ID:

```text
node "<plugin-root>/cli/bin/skill-market.mjs" proposal plan --spec <json-file> [source options] --json
node "<plugin-root>/cli/bin/skill-market.mjs" proposal prepare <proposal-id> --json
node "<plugin-root>/cli/bin/skill-market.mjs" proposal status <proposal-id> --json
```

Plan source options are `--read-repo-url`, `--base-ref`, `--cache-path`, `--cache-ttl-seconds`, and `--repo-path`. Do not edit proposal state/worktrees, catalogs, versions, or Git history. After prepare, show targets, prepared commit, diff hash, branch, and warnings.

At submit time, obtain confirmation for fork/push/PR effects, then run `node "<plugin-root>/cli/bin/skill-market.mjs" proposal submit <proposal-id> --confirm-external-effects [--push-mode auto|direct|fork] [--push-url URL] [--fork-push-url URL] [--head-owner LOGIN] [--draft] --json`. Never force-push; retry the same pushed proposal to resume PR discovery.

Abort local work with `node "<plugin-root>/cli/bin/skill-market.mjs" proposal abort <proposal-id> [--confirm-discard] --json`; add `--confirm-discard` only after approval of reported local drift. Pushed/submitted proposals cannot be aborted.

Parse stdout as JSON even on exit 1–4. Report `ok/noop` summary, data, and warnings. For `needs_confirmation`, show the complete error and ask before retrying with only the named flag. Stop on `unsupported`. For `blocked/error`, report `nextAction`, perform it only within scope, and retry only when `retryable` is true.

Never hand-edit Skill Market config, cache, managed state, proposal state, catalog, or installed package paths.
