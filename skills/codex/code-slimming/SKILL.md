---
name: code-slimming
description: "Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, functions, classes, exports, dependencies, repeated logic, or consolidation opportunities. Scans first, reports candidates with evidence and risk, waits for user approval, then edits only approved items with validation."
---

# Code Slimming

Use this skill to reduce code size without guessing. Scan first, report evidence-backed candidates, and stop for user decision before changing source files. Use `rg` / shell for inspection and `apply_patch` for manual edits.

## Workflow

1. Confirm the target repository and scope. If the user did not name a scope, scan the project entry points, package/module metadata, source roots, tests, build config, routing/config files, scripts, and public exports before proposing candidates.
2. Establish scan cache without changing repository files. Use `.code-slimming/local/` only when it already exists and is ignored; otherwise use `/tmp/code-slimming/<repo-name-or-hash>/<timestamp>/` and report the cache path.
3. Scan for unused files, unused functions, unused classes, duplicate logic, overlapping helpers, mergeable functions, mergeable methods, mergeable classes, mergeable code blocks, repeated constants, dead dependencies, and large files that invite extraction.
4. Report candidates to the user with evidence, confidence, risk, proposed action, and validation plan. End the scan phase without editing source files.
5. Wait for the user to approve candidate IDs or revise scope. Do not execute code removal, function merging, class merging, or dependency deletion before this decision.
6. After approval, re-check that each approved candidate is still valid, edit only approved items, and run the planned validation.

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

## Report Format

Produce a scan report before edits:

```text
No repository files changed. Scan cache: <path>

Candidate ID: CS-001
Type: unused-file | unused-function | unused-class | duplicate-code | mergeable-function | mergeable-method | mergeable-helper | mergeable-class | mergeable-code | dead-dependency | large-file-split
Location: <path[:line] or package>
Evidence: <commands, searches, references checked>
Confidence: high | medium | low
Risk: <behavior/API/test risk>
Proposed action: <delete, merge into X, inline, extract, keep with note>
Validation: <commands or manual checks after edit>
```

Ask the user to choose candidate IDs to apply, reject, or investigate further. If the evidence is weak, recommend investigation rather than deletion.

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
