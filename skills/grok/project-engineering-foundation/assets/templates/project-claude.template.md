# CLAUDE.md

> Shared repository workflow for paired AI-coding entries.
> Put runtime or tool differences in `AGENTS.md` to avoid drift.

## Repository Baseline

- OS / package manager: <example: macOS / pnpm, Linux / cargo, or Windows / pip>
- Runtime versions: <example: Node >= 18, Go 1.22, or Python 3.11>
- Special environment constraints: <optional, such as docker compose dependencies>

## Base Directory Structure

Create or maintain files in this structure. Do not create parallel directories for the same file type unless the project already has a stronger project rule.

- `CLAUDE.md`: shared workflow for repository baseline, directory structure, after-change requirements, plan/review lifecycle, review expiry, file-size guardrail, project-specific triggers, archived reference materials, and validation.
- `AGENTS.md`: entry and tool differences; it references and follows the shared rules in `CLAUDE.md`.
- `UI_COPY_LANGUAGE.md`: SSOT for user-facing UI/CLI copy language and locale mode.
- `README.md`: user and maintainer instructions for setup, usage, validation, and structure.
- `src/`: first-party source code.
- `scripts/`: project scripts and automation helpers, including copied foundation helpers after setup.
- `build/` or `dist/`: one project-selected build output root; keep all generated toolchain output under that root.
- `ref/changelogs/INDEX.md`: final changelog routing index; final changelogs use `ref/changelogs/<bucket>/CHANGELOG_X_<topic>.md`.
- `ref/reviews/INDEX.md`: final review routing index; final reviews use `ref/reviews/<bucket>/REVIEW_X_<topic>.md`.
- `ref/plans/INDEX.md`: final plan routing index; final plans use `ref/plans/<bucket>/PLAN_X_<topic>.md`.
- `ref/*/{recent-3-days,recent-week,recent-month,history}/INDEX.md`: mutually exclusive time-bucket indexes for final records.
- `.ref/`: add to `.gitignore`; store non-final plans, reviews, raw outputs, spike drafts, scratch notes, and other unarchived LLM-facing material here, never final records.

## Required After Changes

Before starting, run `find ref/changelogs ref/plans ref/reviews -maxdepth 2 -type f -name '*.md' 2>/dev/null || true` to see existing records. Missing directories are setup work, not an error. Before creating or moving any final typed `ref/` record, read the relevant root `ref/<type>/INDEX.md` and the affected bucket `INDEX.md`; those copied project files are the naming, bucket, and rebucketing source of truth. Scan every same-type bucket directory, choose `X` as the maximum existing same-type number plus 1, and do not guess. Use a short stable kebab-case `<topic>` that is not vague like `update`, `fix`, or `misc`.

1. When user-visible behavior, file structure, startup steps, ports, dependencies, or validation steps change, update the matching `README.md` section. Pure bug fixes and internal refactors do not require README changes.
2. For each meaningful feature, behavior, API, or dependency change, write `ref/changelogs/<bucket>/CHANGELOG_X_<topic>.md`, rebucket all changelogs by `changed_at`, and update `ref/changelogs/INDEX.md` plus every affected bucket `INDEX.md`. For debug, performance, security, or review-driven fixes, write `ref/reviews/<bucket>/REVIEW_X_<topic>.md`, rebucket all reviews by `reviewed_at`, and update `ref/reviews/INDEX.md` plus every affected bucket `INDEX.md`. Keep index summaries to 80 characters or one short sentence.
3. Add `.ref/` to `.gitignore`. Keep non-final plans in the current environment's plan workspace; if no stronger contract exists, use `<repo>/.ref/plans/<plan-id>.md`. Keep non-final review drafts and raw reviewer output in the current review workspace; if no stronger contract exists, use `<repo>/.ref/reviews/<review-id>.md` or session output. At final handoff, archive plans to `ref/plans/<bucket>/PLAN_X_<topic>.md`, rebucket all plans by completed date, update `ref/plans/INDEX.md` plus every affected bucket `INDEX.md`, and clean up workspace copies.
4. Store archived LLM-facing extra materials, including spike documents, investigation notes, architecture notes, and reusable evidence, somewhere under `ref/` and link them from the relevant final record when applicable. Keep temporary scratch, raw logs, and non-final drafts in `.ref/` or the current environment workspace.
5. Keep the advisory `.ref` archive pre-commit hook installed by running `bash scripts/ref-archive-reminder-pre-commit.sh --install` after setup or whenever `.git/hooks/pre-commit` is reset. The installer creates or replaces only its managed block and preserves unrelated hook logic. The hook checks `.ref/` for unarchived files and prints an LLM-facing classification checklist: archive durable context under `ref/`, keep intentionally non-final workspace material in `.ref/`, or clean up scratch files. It is advisory and exits 0; LLMs must still act on the check or explicitly justify leaving files in `.ref/`.

Project-specific triggers:

- <example: after changing main or preload code, restart dev>
- <example: after changing DB schema, add a migration file and bump user_version>
- <example: after changing an IPC channel, sync the preload facade>

## UI/CLI Copy Language

Write active project documentation and maintainer/agent-facing instructions in English by default, including changelogs, plans, reviews, and archived reference materials. Exceptions are `UI_COPY_LANGUAGE.md`, user-facing UI/CLI copy governed by that file, locale examples, quoted/source text, and explicit non-English trigger anchors or examples.

Before adding or changing user-facing UI or CLI copy, read `UI_COPY_LANGUAGE.md` and follow its active mode. If the requested copy language or supported locales differ from that file, update `UI_COPY_LANGUAGE.md` first, then make the UI/CLI copy changes.

## Review Expiry And Minimum Re-Review Scope

Use this section to determine the minimum scope for the next review. `ref/reviews/` records expiring coverage; it is not a permanent exemption list.

The next review's minimum scope is:

```text
unreviewed files union expired reviewed files union scope_unknown files
```

`scope_unknown files` are files whose previous review coverage cannot be trusted because the review lacks a parseable `review-scope`, lacks a usable `baseline_commit`, or cannot be mapped to the current path.

Since the latest REVIEW `baseline_commit` that covered a file, that file expires when any condition is true:

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

When a file truly cannot be split, record the path, concrete reason, and revisit trigger in the relevant final record: use the changelog's "Do Not Split Protection" for feature, behavior, API, or dependency changes, or the review's "Residual Risk" for debug, performance, security, or review-driven work.

## Validation Flow

```bash
<typecheck command>
<build command>
<test command>
```

After changing <main / preload / native module / config ...>, <restart dev / reload / recompile>.

## Deployment / Packaging

<Optional. Add short notes for non-obvious packaging steps; link related final record ids for known pitfalls.>

<Include the following block only when this repository builds an installable or distributed artifact; omit or remove it for pure libraries and repositories with no package, install, or distribution surface.>

When this repository builds an installable desktop app, packaged CLI, native app, installer, plugin, or distributed tool:

- Packaging must generate and ship build metadata, such as `build-info.json`, with at least app/package name, semantic version when available, full git commit, short commit, branch when available, dirty flag when determinable, and build timestamp.
- The installed artifact must expose a human-readable version/status entry and a machine-checkable freshness command or equivalent, such as `--version` and `--check-installed` when a CLI wrapper exists.
- The freshness check compares installed metadata with the current source checkout commit, may compare local `origin/main`, never fetches remotes, and reports missing metadata separately from a commit mismatch.
