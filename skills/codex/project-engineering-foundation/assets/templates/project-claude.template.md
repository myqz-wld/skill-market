# CLAUDE.md

> Shared repository workflow for paired AI-coding entries.
> Put runtime or tool differences in `AGENTS.md` to avoid drift.

## Repository Baseline

- OS / package manager: <example: macOS / pnpm, Linux / cargo, or Windows / pip>
- Runtime versions: <example: Node >= 18, Go 1.22, or Python 3.11>
- Special environment constraints: <optional, such as docker compose dependencies>

## Base Directory Structure

Create or maintain files in this structure. Do not create parallel directories for the same file type unless the project already has a stronger convention.

- `CLAUDE.md`: shared workflow for repository baseline, directory structure, after-change requirements, plan/review lifecycle, review expiry, file-size guardrail, project-specific triggers, project conventions, and validation.
- `AGENTS.md`: entry and tool differences; it references and follows the shared rules in `CLAUDE.md`.
- `UI_COPY_LANGUAGE.md`: SSOT for user-facing UI/CLI copy language and locale mode.
- `README.md`: user and maintainer instructions for setup, usage, validation, and structure.
- `src/`: first-party source code.
- `scripts/`: project scripts and automation helpers, including copied foundation helpers after setup.
- `build/` or `dist/`: build outputs; keep one or both names according to the project toolchain.
- `ref/changelogs/INDEX.md`: final changelog index; final changelogs use `ref/changelogs/CHANGELOG_X_<topic>.md`.
- `ref/reviews/INDEX.md`: final review index; final reviews use `ref/reviews/REVIEW_X_<topic>.md`.
- `ref/plans/INDEX.md`: final plan index; final plans use `ref/plans/PLAN_X_<topic>.md`.
- `ref/conventions/INDEX.md`: promoted project convention index; convention bodies use `ref/conventions/CONVENTION_X_<topic>.md`.
- `ref/conventions/tally.md`: counter for repeated user feedback and repeated agent pitfalls.
- `.ref/`: add to `.gitignore`; store only non-final plan/review working copies here, never final records.

## Required After Changes

Before starting, run `ls ref/conventions/ ref/changelogs/ ref/plans/ ref/reviews/ 2>/dev/null || true` to see existing records. Missing directories are setup work, not an error. Before creating any final `ref/` record, run `ls <target-dir>/`, choose `X` as the maximum existing same-type number plus 1, and do not guess. Use a short stable kebab-case `<topic>` that is not vague like `update`, `fix`, or `misc`. After changes, apply these minimum rules before any project-specific triggers.

1. When user-visible behavior, file structure, startup steps, ports, dependencies, or validation steps change, update the matching `README.md` section. Pure bug fixes and internal refactors do not require README changes.
2. For each meaningful feature, behavior, API, or dependency change, write `ref/changelogs/CHANGELOG_X_<topic>.md` and update `ref/changelogs/INDEX.md`. For debug, performance, security, or review-driven fixes, write `ref/reviews/REVIEW_X_<topic>.md` and update `ref/reviews/INDEX.md`. Keep index summaries to 80 characters or one short sentence.
3. Add `.ref/` to `.gitignore`. Keep non-final plans in the current environment's plan workspace; if no stronger contract exists, use `<repo>/.ref/plans/<plan-id>.md`. Keep non-final review drafts and raw reviewer output in the current review workspace; if no stronger contract exists, use `<repo>/.ref/reviews/<review-id>.md` or session output. At final handoff, archive plans to `ref/plans/PLAN_X_<topic>.md` and reviews to `ref/reviews/REVIEW_X_<topic>.md`, update the matching index, and clean up workspace copies.
4. Keep the advisory plan archive pre-commit hook installed by running `bash scripts/plan-archive-reminder-pre-commit.sh --install` after setup or whenever `.git/hooks/pre-commit` is reset. The hook checks `.ref/plans/` for non-final plan files, reminds the committer to consider archiving plans to `ref/plans/` and updating `ref/plans/INDEX.md`, and must not block commits.
5. Record repeated user feedback or repeated agent pitfalls in `ref/conventions/tally.md`: increment an existing semantically identical entry by 1, or add a new `count: 1` entry. When `count >= 3`, run the configured project review process, promote the item to `ref/conventions/CONVENTION_X_<topic>.md`, and update `ref/conventions/INDEX.md`.

Project-specific triggers:

- <example: after changing main or preload code, restart dev>
- <example: after changing DB schema, add a migration file and bump user_version>
- <example: after changing an IPC channel, sync the preload facade>

## UI/CLI Copy Language

Write active project documentation and maintainer/agent-facing instructions in English by default, including changelogs, plans, reviews, and conventions. Exceptions are `UI_COPY_LANGUAGE.md`, user-facing UI/CLI copy governed by that file, locale examples, quoted/source text, and explicit non-English trigger anchors or examples.

Before adding or changing user-facing UI or CLI copy, read `UI_COPY_LANGUAGE.md` and follow its active mode. If the requested copy language or supported locales differ from that file, update `UI_COPY_LANGUAGE.md` first, then make the UI/CLI copy changes.

## Project-Specific Conventions

> Repeated design decisions to check before changing related code. Promote dynamic conventions into `ref/conventions/CONVENTION_X_<topic>.md`; keep only entry-critical project invariants in this section.

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

Before review, run `bash scripts/file-level-review-expiry.sh` from the repository root. If the script is missing, use `git log` to apply the conditions above manually.

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
