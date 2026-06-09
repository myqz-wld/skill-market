---
name: project-engineering-foundation
description: "Use when starting, repairing, or maintaining a long-lived AI-coding repository. Establishes project agent prompts, README update rules, src/build layout, durable records under ref/, convention promotion, review-expiry checks, and the 500-line file-size guardrail."
---

# Project Engineering Foundation

Use this skill to give or restore a repository's stable AI-coding operating model. Inspect the existing repository first, preserve project-specific invariants in project files, and keep reusable workflow rules in this skill. Use Bash for inspection and file tools for project file edits.

## New Project Setup

Create or complete this shape when the repository lacks a durable AI-coding structure. If an equivalent project convention already exists, extend it instead of renaming or replacing it.

```text
project-root/
├── CLAUDE.md
├── AGENTS.md
├── README.md
├── src/
├── build/ or dist/
└── ref/
    ├── changelogs/INDEX.md
    ├── reviews/INDEX.md
    ├── plans/INDEX.md
    └── conventions/
        ├── INDEX.md
        ├── tally.md
        └── <X>-<topic>.md
```

Use only the needed template from `assets/templates/`; create or update project files with file tools, not shell redirection. Merge missing sections into existing files instead of overwriting project-specific instructions.

## Layout Rules

- Put first-party source under `src/`. Do not put fixtures, generated artifacts, or dependencies there.
- Pick one build output root, `build/` or `dist/`, and keep all toolchain output under it.
- Add both `build/` and `dist/` to `.gitignore`, even if the project currently uses only one.
- Add `.refs/` to `.gitignore`; it is the non-terminal plan/review working area, not a durable reference archive.
- Keep AI-coding reference artifacts in `ref/`; do not ignore `ref/`.

## Plan And Review Artifacts

Use this rule when plan or review documents are not terminal yet. Keep active work in the current environment's working location; when no stronger project contract exists, use ignored paths under `<repo>/.refs/`, not `ref/`.

When a plan or review reaches its terminal state, clean up the working copy in the same closeout:

- Move final plans to `ref/plans/` and final reviews to `ref/reviews/`, then update the matching INDEX.
- Remove the non-terminal working copy or mark it archived so there is not a second active copy.

## Change Records

Before feature work, inspect existing context. If a directory is missing, create it during setup instead of treating the `ls` failure as fatal:

```bash
ls ref/conventions ref/changelogs ref/plans ref/reviews 2>/dev/null || true
```

Write one record after each meaningful change that changes behavior, structure, dependencies, verification, or review coverage:

- Feature, behavior, API, dependency, or structure changes: write `ref/changelogs/CHANGELOG_X.md` and update `ref/changelogs/INDEX.md`.
- Debug, performance, security, or review-driven fixes: write `ref/reviews/REVIEW_X.md` and update `ref/reviews/INDEX.md`.
- After any review workflow that produces durable findings, store the final review record under `ref/reviews/`.
- Use the next integer `X`; find it with `ls`, not by guessing.
- Keep INDEX summaries under 80 Chinese characters or one short English sentence.

Update `README.md` only when user-visible behavior, file structure, startup flow, ports, dependencies, or verification steps change.

## Review Expiry

Treat `ref/reviews/` as expiring coverage, not permanent exemption. The next review minimum scope is:

```text
unreviewed files ∪ expired reviewed files ∪ scope_unknown files
```

A reviewed file expires when any condition is true since its latest covering REVIEW baseline:

- Net churn is at least `min(200 lines, 30% of current LOC)`.
- Distinct commit count is at least 3.
- At least 90 days have passed and the file changed at least once.
- REVIEW frontmatter has `expired: true`.

When preparing a review, run the bundled helper from the repository root with Bash:

```bash
bash <path-to-this-skill>/scripts/file-level-review-expiry.sh
```

## File-Size Guardrail

Any source file over 500 LOC triggers a split attempt before commit. Exclude generated code, lockfiles, snapshots, migrations, and fixtures. Read `assets/file-size-guardrail.md` when a file crosses the threshold.

Prefer split approaches in this order:

1. Extract module-level pure functions, types, or constants.
2. Directory-ize into same-directory submodules that preserve import paths.
3. Split a class with a facade and shared context only after a plan/review pass.

If the file truly cannot be split, record it in the relevant changelog under a "do not split" protection list with a concrete reason.

## Convention Promotion

Store repeated feedback and repeated agent pitfalls in `ref/conventions/tally.md`. Increment an existing semantic match; otherwise add a new row with `count: 1`.

Promote only at `count >= 3`: create `ref/conventions/<X>-<topic>.md`, update `ref/conventions/INDEX.md`, and remove the candidate from tally. Do not promote one-off preferences or trivial observations.

## Resources

- `assets/templates/`: project entry, changelog, review, plan, and convention templates.
- `assets/file-size-guardrail.md`: detailed split-risk policy.
- `scripts/file-level-review-expiry.sh`: mechanical review-expiry helper.
