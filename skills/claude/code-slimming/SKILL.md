---
name: code-slimming
description: "Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, symbols, dependencies, repeated logic, merge candidates, or oversized files. Produces an evidence-backed scan report first, waits for explicit candidate approval, then edits only approved items with validation."
---

# Code Slimming

Use this skill to reduce code size with evidence. Run a scan-only phase first, wait for candidate approval, then edit only approved items. Use `rg` / Bash for inspection and file tools for edits.

## Workflow

1. Confirm the target repository, cleanup scope, and exclusions. If scope is unclear, inspect entry points, package/module metadata, source roots, tests, build config, routing/config files, scripts, and public exports before proposing candidates.
2. Establish the scan cache using the Local Cache rules below. Do not change repository files during the scan phase.
3. Scan for unused files, symbols, exports, dependencies, duplicate or mergeable logic, repeated constants, and oversized files that invite extraction.
4. Produce a candidate report. Start with `No repository files changed. Scan cache: <path>`, then list each candidate's ID, type, location, evidence, confidence, risk, proposed action, and validation.
5. Stop until the user approves candidate IDs or revises scope. Map broad approval back to explicit candidate IDs before editing.
6. Re-check each approved candidate against the current tree, edit only approved items, and run the planned validation.

## Local Cache

Use local state for scan data. Do not commit cache data, and do not edit `.gitignore` during the scan phase.

- When project-local cache is already ignored, store scan output under `.code-slimming/local/scans/<timestamp>/`. Otherwise store it under `/tmp/code-slimming/<repo-name-or-hash>/scans/<timestamp>/`.
- Include a `manifest.json` with scan scope, commands, tool versions, generated report paths, and candidate IDs.
- Reuse a prior scan only when its manifest matches the current repository root, scope, git HEAD when available, toolchain files, and source paths checked by the report.
- If `.code-slimming/local/` is not ignored, use `/tmp` and include a report note asking whether the user wants to add `.code-slimming/local/` to `.gitignore` for later runs.

## Scan Rules

Use project-native evidence first. Prefer existing typecheck, lint, test, coverage, dependency, bundler, and language-server commands over ad hoc parsing. When no tool exists, combine static reference search with entry-point inspection.

Classify every candidate:

- **High confidence:** private file, symbol, export, or dependency has no references across source, tests, config, routes, generated entry manifests, and documented extension points.
- **Medium confidence:** references are absent, but the project uses dynamic loading, reflection, plugin registration, string-based routing, serialization names, CLI commands, or public package exports.
- **Low confidence:** evidence suggests cleanup, but runtime entry points or user-facing contracts are unclear.

Do not propose automatic deletion for migrations, fixtures, snapshots, generated code, vendored code, public APIs, command-line entry points, plugin manifests, route files, schema files, or configuration files unless the report includes project-specific evidence that they are unused.

## Candidate Report

Produce the report before edits and ask the user to choose candidate IDs to apply, reject, or investigate further. Use stable IDs such as `CS-001`; use candidate types such as `unused-file`, `unused-function`, `duplicate-code`, `mergeable-helper`, `dead-dependency`, or `large-file-split`. If evidence is weak, recommend investigation instead of deletion.

## Execution Rules

Apply only approved candidates.

- Re-open each target file before editing and confirm the evidence still matches the current tree.
- Preserve public behavior unless the user explicitly approved a breaking change.
- Remove stale imports, exports, tests, documentation references, build config entries, and dependency declarations that become invalid because of the approved change.
- Prefer small edits that remove one candidate at a time when risk is high.
- If an approved merge changes ownership or module boundaries, keep the smallest stable facade that preserves imports, then remove the facade only when references are updated and validation passes.

## Validation

Run the validation plan from the scan report. At minimum, run the narrowest relevant typecheck, lint, tests, build, or import/reference search that proves the approved removals are not still referenced.

Finish with a compact report: approved candidate IDs applied, files changed, validation results, candidates skipped with reasons, and any follow-up risk that still needs user decision.
