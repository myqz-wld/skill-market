---
name: project-engineering-foundation
description: "Use when starting or maintaining a long-lived AI-coding repository. Sets up CLAUDE.md/AGENTS.md, README update rules, src/build layout, ref/changelogs and ref/reviews records, convention promotion, review-expiry checks, and the 500-line file-size guardrail."
---

# Project Engineering Foundation

Use this skill to give a repository a stable AI-coding operating model. Inspect the existing repository first, preserve project-specific invariants in project files, and keep reusable workflow rules in this skill. Use `rg` / shell for inspection and `apply_patch` for manual file edits.

## New Project Setup

Create or complete this shape on the first durable commit:

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
    ├── plans/
    └── conventions/
        ├── INDEX.md
        ├── tally.md
        └── <X>-<topic>.md
```

Use the templates under `assets/templates/`; read only the needed template and create or update the project file with `apply_patch`, not shell redirection. Merge missing sections into existing files instead of overwriting project-specific instructions.

- `project-claude.template.md` and `project-agents.template.md` for the project entry points.
- `changelog-index.template.md`, `changelog.template.md`, `reviews-index.template.md`, and `review.template.md` for `ref/`.
- `conventions-index.template.md`, `conventions-tally.template.md`, and `convention-single.template.md` for promoted conventions.

## Layout Rules

- Put first-party source under `src/`. Do not put fixtures, generated artifacts, or dependencies there.
- Pick one build output root, `build/` or `dist/`, and keep all toolchain output under it.
- Leave metadata and top-level config at the repo root: `README.md`, license, package manifests, lockfiles, config files, and CI folders.
- Add both `build/` and `dist/` to `.gitignore`, even if the project currently uses only one.
- Keep AI-coding reference artifacts in `ref/`; do not ignore `ref/`.

## Change Records

Before feature work, inspect existing context:

```bash
ls ref/conventions ref/changelogs ref/reviews
```

Write one record after each meaningful change that changes behavior, structure, dependencies, verification, or review coverage:

- Feature changes, behavior changes, API changes, dependency upgrades: `ref/changelogs/CHANGELOG_X.md` plus `ref/changelogs/INDEX.md`.
- Debug, performance, security, or review-driven fixes: `ref/reviews/REVIEW_X.md` plus `ref/reviews/INDEX.md`.
- After any review workflow that produces durable findings, put durable review records in `ref/reviews/REVIEW_X.md`; the review capability produces findings, this skill owns where the record lives.
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

When preparing a review, run the bundled helper from the repository root through the shell tool:

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

- `assets/templates/`: project entry, changelog, review, and convention templates. Read only the needed template and copy its relevant sections into project files with `apply_patch`.
- `assets/file-size-guardrail.md`: detailed split-risk policy.
- `scripts/file-level-review-expiry.sh`: mechanical review-expiry helper.
