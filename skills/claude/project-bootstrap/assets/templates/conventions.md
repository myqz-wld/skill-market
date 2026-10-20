{{Selected metadata block or existing format; do not impose YAML front matter.}}

# Development conventions

## Tools and policy ownership

{{Link native runtime/dependency/task files. Identify each policy's authoritative
configuration; do not duplicate versions or enforce blueprint recommendations.}}

## Documents and history

{{Selected metadata syntax/fields by document class; current/draft/superseded/
archived meanings; replacement-link field; meaningful update/review dates.
For plans, record the chosen date/milestone/manual checkpoint policy or none.
ADR lifecycle/immutability applies only when selected and verifiable.}}

Current authority outranks recency. Plans describe intent; reviews prove only their
recorded baseline. Missing status/baseline is uncertain. Follow superseded links.
Archive completed work with actual outcomes and fix links; never refresh dates to
hide stale content or automatically delete historical user work.

## File and entry size

{{Selected source/prose thresholds, warn/block/off mode, exclusions and native
checker configuration. No default 500-line requirement may remain here unless
chosen. If AI is enabled, record its selected startup budget including imports.}}

For selected limits, record authored-file exceptions with exact path, reason and
revisit trigger. Split cohesive responsibilities while preserving behavior;
avoid creating fragments solely to meet a line count.

## Generated sources and private data

Generated files identify their source via compatible markers or a manifest.
Change the owned source and regenerate; preserve authored additions.
Use portable references in shared records and keep secrets/private machine paths
outside artifacts. Inspect actual package inputs, not just ignore patterns.

## Checks and change triggers

{{Actual structural/regression/check commands and chosen CI/advisory behavior.
Update affected navigation when paths or authority change. Raw logs use the
selected ignored workspace. No check implies deployment/restart permission.}}
