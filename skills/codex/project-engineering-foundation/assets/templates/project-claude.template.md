# CLAUDE.md

> Repository-level instructions and the shared SSOT for paired AI-coding entries.
> This file contains the minimum repository workflow. Extra engineering or review skills, when present, are enhancement layers.
> `AGENTS.md` is the companion entry for runtime/tool differences. Keep shared repository rules here to avoid drift.

## Repository Baseline

- OS / package manager: <example: macOS / pnpm, Linux / cargo, or Windows / pip>
- Runtime versions: <example: Node >= 18, Go 1.22, or Python 3.11>
- Special environment constraints: <optional, such as docker compose dependencies>

## Base Directory Structure

Create or maintain files in this structure. Do not create parallel directories for the same file type unless the project already has a stronger convention.

- `CLAUDE.md`: shared project workflow SSOT for repository baseline, directory structure, after-change requirements, plan/review lifecycle, review expiry, file-size guardrail, project-specific triggers, project conventions, and validation.
- `AGENTS.md`: entry and tool differences; it references and follows the shared rules in `CLAUDE.md`.
- `UI_COPY_LANGUAGE.md`: SSOT for user-facing UI/CLI copy language and locale mode.
- `README.md`: user and maintainer instructions for setup, usage, validation, and structure.
- `src/`: first-party source code.
- `scripts/`: project scripts and automation helpers.
- `build/` or `dist/`: build outputs; keep one or both names according to the project toolchain.
- `ref/changelogs/INDEX.md`: final changelog index.
- `ref/reviews/INDEX.md`: final review index; final review files live at `ref/reviews/REVIEW_X.md`.
- `ref/plans/INDEX.md`: final plan index; final plan files live under `ref/plans/`.
- `ref/conventions/INDEX.md`: promoted project convention index; convention bodies use `ref/conventions/<X>-<topic>.md`.
- `ref/conventions/tally.md`: counter for repeated user feedback and repeated agent pitfalls.
- `.refs/`: add to `.gitignore`; store only non-final plan/review working copies here, never final records.

## Required After Changes

Before starting, run `ls ref/conventions ref/changelogs ref/plans ref/reviews 2>/dev/null || true` to see existing records. Missing directories are setup work, not an error. After changes, apply these minimum rules before any project-specific triggers.

1. When user-visible behavior, file structure, startup steps, ports, dependencies, or validation steps change, update the matching `README.md` section. Pure bug fixes and internal refactors do not require README changes.
2. For each meaningful feature, behavior, API, or dependency change, write `ref/changelogs/CHANGELOG_X.md` and update `ref/changelogs/INDEX.md`. For debug, performance, security, or review-driven fixes, write `ref/reviews/REVIEW_X.md` and update `ref/reviews/INDEX.md`. Choose `X` as one higher than the current maximum after checking with `ls`; do not guess. Keep index summaries to 80 characters or one short sentence.
3. Add `.refs/` to `.gitignore`. Keep non-final plans in the current environment's plan workspace; if no stronger contract exists, use `<repo>/.refs/plans/<plan-id>.md`. Keep non-final review drafts and raw reviewer output in the current review workspace; if no stronger contract exists, use `<repo>/.refs/reviews/<review-id>.md` or session output. At final handoff, archive plans to `ref/plans/` and reviews to `ref/reviews/REVIEW_X.md`, update the matching index, and clean up workspace copies.
4. Record repeated user feedback or repeated agent pitfalls in `ref/conventions/tally.md`: increment an existing semantically identical entry by 1, or add a new `count: 1` entry. When `count >= 3`, run the configured project review process, promote the item to `ref/conventions/<X>-<topic>.md`, and update `ref/conventions/INDEX.md`.

Project-specific triggers:

- <example: after changing main or preload code, restart dev>
- <example: after changing DB schema, add a migration file and bump user_version>
- <example: after changing an IPC channel, sync the preload facade>

## UI/CLI Copy Language

Write active project documentation and maintainer/agent-facing instructions in English by default, including changelogs, plans, reviews, and conventions. Exceptions are `UI_COPY_LANGUAGE.md`, user-facing UI/CLI copy governed by that file, locale examples, quoted/source text, and explicit non-English trigger anchors or examples.

Before adding or changing user-facing UI or CLI copy, read `UI_COPY_LANGUAGE.md` and follow its active mode. If the requested copy language or supported locales differ from that file, update `UI_COPY_LANGUAGE.md` first, then make the UI/CLI copy changes.

## Project-Specific Conventions

> Repeated design decisions to check before changing related code. Promote dynamic conventions into `ref/conventions/<X>-<topic>.md`; keep only entry-critical project invariants in this section.

<!-- Pattern, one section per topic:

### <topic such as auth, state machine, data migration, IPC boundary, event dedupe, or CSS pitfall>

- One-sentence rule and rationale.
- Counterexample, known pitfall, or related CHANGELOG id.
-->

## Review Expiry And Minimum Re-Review Scope

Use this section to determine the minimum scope for the next review. `ref/reviews/` records expiring coverage; it is not a permanent exemption list.

The next review's minimum scope is:

```text
unreviewed files union expired reviewed files union scope_unknown files
```

Since the latest REVIEW baseline that covered a file, that file expires when any condition is true:

- Net change is at least `min(200 lines, 30% of current LOC)`.
- At least 3 distinct commits touched the file.
- At least 90 days have passed and the file changed at least once.
- REVIEW frontmatter sets `expired: true`.

Before review, run `bash scripts/file-level-review-expiry.sh` from the repository root. The foundation template copies this script into the project. If the script is missing, use `git log` to apply the conditions above manually.

## File-Size Guardrail (500 LOC)

Before submitting, attempt to split any source file over 500 LOC. Generated code, lockfiles, snapshots, migrations, and fixtures are exempt.

Split in this order:

1. Extract module-level pure functions, types, and constants.
2. Move same-directory submodules behind stable import paths.
3. Split classes through a facade and shared context only after a plan or review.

When a file truly cannot be split, record the file and specific reason in the related changelog's "do not split" protection list.

## Validation Flow

```bash
<typecheck command>
<build command>
<test command>
```

After changing <main / preload / native module / config ...>, <restart dev / reload / recompile>.

## Deployment / Packaging

<Optional. Add `#` comments to explain why each step exists. List packaging pitfalls with related CHANGELOG ids.>
