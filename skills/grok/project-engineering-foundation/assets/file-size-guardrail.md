# Single-File Size Guardrail (<= 500 Lines)

> Any code source file with LOC > 500 triggers a split attempt. Exclude test fixtures and machine-generated migrations, lockfiles, snapshots, and generated code. Run this check after editing that file and before commit.

## Choose The Lowest-Risk Split

1. **Extract module-level pure functions, types, or constants.** This is the lowest-risk option; do it first. The original file imports them back and call sites stay unchanged.
2. **Directory-ize with same-directory submodules or subcomponents.** Example: `foo.ts -> foo/index.ts + foo/bar.ts`; most module resolvers preserve existing imports.
3. **Split a class with collaborators, facade delegation, and shared context.** This is the highest-risk option. State ownership changes are architectural and require a plan plus the repository's configured review flow.

## When The File Cannot Be Split

If concurrency ordering is complex, state ownership is tightly coupled, or split risk exceeds value, record the path, concrete reason, and revisit trigger in the relevant final record. Use the changelog's "Do Not Split Protection" for feature, behavior, API, or dependency changes; use the review's "Residual Risk" for debug, performance, security, or review-driven work. Do not ignore it silently; record the decision so the next split pass does not re-litigate the same file.

## Threshold Changes

Changing the 500-line threshold is a project policy change and must use the repository's configured review flow. The threshold check itself, line count > threshold, is mechanical and does not need adversarial review.
