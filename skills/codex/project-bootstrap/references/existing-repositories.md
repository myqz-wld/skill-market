# Existing architecture adjustment

Inspect the supplied target before asking questions its files answer. Identify
runtime/package conventions, code/deploy units, contracts, docs, checks, current
instructions and working changes. Summarize what is established and the requested
architectural problem; use references/retrieval.md to handle historical evidence.

## Preserve and bound the change

- Map existing roles instead of introducing duplicate manifests, docs or indexes.
- Retain task names, CI, native framework layout and explicit engineering limits
  unless changing them is part of the user's architectural request.
- Name each move, merge, boundary change and compatibility requirement before
  dependent edits. Preserve unrelated working changes and authored entrypoints.
- Code movement, import repair, extraction behind stable interfaces and tooling
  updates may implement the architecture change. New product behavior may not.
- A business feature request is not permission to retrofit this entire structure.
  Surface mixed scope and keep feature implementation outside this workflow.
- Respect target exclusions. Editing this skill does not scaffold the marketplace
  repository itself.

Read-only assessment stays read-only. An explicit named structural fix authorizes
that fix without repeated permission. Existing policy is not a new questionnaire:
show reused settings and ask only about conflicts or intended changes.

## Before and after

Record relevant observable behavior/contracts and available baseline checks.
After restructuring, rerun them and inspect import/build/dependency boundaries,
changed paths and preserved user work. Separate pre-existing failures from new
regressions. A requested breaking architecture change needs explicit scope and
compatibility decisions; it must not smuggle in new feature work.

On repeated application, recognize owned generated outputs and use their source.
Merge authored content only for the agreed change. Do not replace custom rules,
reset metadata or create duplicate indexes/hooks. Prefer a small reversible
structural delta and report any acceptance check that could not be run.
