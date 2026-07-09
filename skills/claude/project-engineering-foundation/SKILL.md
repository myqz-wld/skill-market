---
name: project-engineering-foundation
description: "Use when inspecting, minimally repairing, or fully initializing an AI-coding repository's durable engineering structure: CLAUDE.md/AGENTS.md/UI_COPY_LANGUAGE.md entries, src/build layout, installable artifact build metadata, time-bucketed ref/ record indexes, ref/ and .ref handling for LLM-facing materials, plan/review lifecycle, review expiry, UI/CLI copy-language SSOT, and 500-line file-size rules. Existing repositories default to inspect-only unless edits are authorized; one-time setup/repair only, not routine maintenance."
---

# Project Engineering Foundation

Use this skill for one-shot inspection, repair, or setup. Inspect the repository first, preserve project-specific invariants, and choose an execution mode before editing. After setup, the project follows its own `CLAUDE.md` workflow SSOT and `UI_COPY_LANGUAGE.md` UI/CLI copy-language SSOT. Use Bash for inspection and file tools for project file edits.

## Execution Mode

Choose the mode before making file changes.

- `inspect-only`: default for existing repositories or unclear user intent. Report missing current foundation structure, project-owned rules that already cover the same responsibility, recommended minimal repairs, and risks. Do not edit files.
- `minimal repair`: use only when the user explicitly asks to repair, fill gaps, or add missing foundation pieces. Add only missing foundation files or rules required by the requested repair, and merge template fragments without overwriting existing project rules.
- `full foundation setup`: use for new repositories or explicit full initialization. Create the complete `CLAUDE.md`, `AGENTS.md`, `UI_COPY_LANGUAGE.md`, `ref/` structure, helper scripts, and related rules while preserving stronger project-specific invariants.

Existing repositories stay in `inspect-only` unless the user authorizes edits. New repositories may enter `full foundation setup`. Explicit repair or gap-filling requests may enter `minimal repair`. Explicit full initialization may enter `full foundation setup`.

## Setup And Repair Flow

In `inspect-only`, report this shape and do not create files. Create or complete it only in `minimal repair` or `full foundation setup`. If the project already has a stronger local rule for the same responsibility, report it and merge only the current foundation pieces the user authorizes.

```text
project-root/
├── CLAUDE.md
├── AGENTS.md
├── UI_COPY_LANGUAGE.md
├── README.md
├── src/
├── scripts/
├── build/ or dist/
└── ref/
    ├── changelogs/
    │   ├── INDEX.md
    │   ├── recent-3-days/INDEX.md
    │   ├── recent-week/INDEX.md
    │   ├── recent-month/INDEX.md
    │   └── history/INDEX.md
    ├── reviews/
    │   ├── INDEX.md
    │   ├── recent-3-days/INDEX.md
    │   ├── recent-week/INDEX.md
    │   ├── recent-month/INDEX.md
    │   └── history/INDEX.md
    └── plans/
        ├── INDEX.md
        ├── recent-3-days/INDEX.md
        ├── recent-week/INDEX.md
        ├── recent-month/INDEX.md
        └── history/INDEX.md
```

Use only the needed templates from `assets/templates/`; create or update project files with file tools, not shell redirection. Merge missing template sections into existing files instead of overwriting project-specific instructions.

Instantiate `assets/templates/project-claude.template.md` as `CLAUDE.md`, `assets/templates/project-agents.template.md` as `AGENTS.md`, and `assets/templates/ui-copy-language.template.md` as `UI_COPY_LANGUAGE.md`. Fill placeholders from repository inspection. Keep active language mode and supported locales only in `UI_COPY_LANGUAGE.md`, not `CLAUDE.md`. Write active documentation and maintainer/agent-facing instructions in English by default; exceptions are `UI_COPY_LANGUAGE.md`, UI/CLI copy governed by that file, locale examples, quoted/source text, and explicit non-English trigger anchors or examples.

Treat `README.md` and `build/` or `dist/` as project-shape checks, not prompt templates: update or create `README.md` only when missing or inaccurate, and choose the output root that matches the toolchain.

Instantiate `changelogs-index.template.md`, `reviews-index.template.md`, and `plans-index.template.md` as the root `INDEX.md` files. Instantiate `changelog-bucket-index.template.md`, `review-bucket-index.template.md`, and `plan-bucket-index.template.md` in each matching bucket directory. In `full foundation setup`, create all four bucket directories for changelogs, reviews, and plans. In `minimal repair`, add only bucket directories and indexes required by the requested repair.

For final typed `ref/` records, this skill installs the directory and index framework. After setup, generated project files govern runtime record behavior; do not restate those workflow rules in this skill.

## Layout Rules

- Put first-party source under `src/`. Do not put fixtures, generated artifacts, or dependencies there.
- Put project scripts and automation helpers under `scripts/`.
- Pick one build output root, `build/` or `dist/`, and keep all toolchain output under it.
- Add both `build/` and `dist/` to `.gitignore`, even if the project currently uses only one.
- Add `.ref/` to `.gitignore`; it is the non-final AI-work workspace for plans, reviews, raw outputs, spike drafts, scratch notes, and other unarchived LLM-facing material, not a durable reference archive.
- Keep archived AI-coding reference artifacts in `ref/`; do not ignore `ref/`. Put unarchived drafts, scratch notes, raw logs, and non-final LLM-facing materials in `.ref/`.
- Keep `UI_COPY_LANGUAGE.md` at project root; update it before changing the active UI/CLI copy language mode or supported locales.

## Installable Artifact Metadata

During inspection, identify whether the repository builds an installable or distributed artifact, such as a desktop app, packaged CLI, native app, installer, plugin, or distributed tool. Do not add this requirement for pure libraries or repositories with no package, install, or distribution surface. When instantiating `project-claude.template.md` for a pure library or no-distribution repository, omit the installable-artifact metadata block from `Deployment / Packaging`; when repairing an existing generated file, remove that block if it does not apply.

When a package/install surface exists, add or update the generated project's `CLAUDE.md` `Deployment / Packaging` section to require packaging to generate and ship build metadata, such as `build-info.json`, with at least app/package name, semantic version when available, full git commit, short commit, branch when available, dirty flag when determinable, and build timestamp. Require the installed artifact to expose a human-readable version/status entry and a machine-checkable freshness command or equivalent, such as `--version` and `--check-installed` when a CLI wrapper exists. The freshness check must compare installed metadata with the current source checkout commit, may compare local `origin/main`, must not fetch remotes, and must report missing metadata distinctly from a commit mismatch.

## Bundled Helpers And Repair References

Copy these helpers from this skill into the generated project's `scripts/` directory so `CLAUDE.md` can reference runnable project-local commands:

- `scripts/file-level-review-expiry.sh` -> `scripts/file-level-review-expiry.sh`
- `scripts/ref-archive-reminder-pre-commit.sh` -> `scripts/ref-archive-reminder-pre-commit.sh`

After copying the ref archive reminder, run `bash scripts/ref-archive-reminder-pre-commit.sh --install` from the repository root. The installer creates or replaces only its current managed block in `.git/hooks/pre-commit` and preserves unrelated hook logic. The hook must remain advisory: it checks `.ref/` for unarchived files, prints an LLM-facing classification checklist, then exits 0.

When repairing oversized existing files, read `assets/file-size-guardrail.md` before restructuring; generated `CLAUDE.md` carries the compact ongoing rule.

## Existing Repository Repair

For existing repositories, compare current files, project-owned rules, generated indexes, and copied helpers against the current foundation shape and relevant templates. Classify findings as already satisfied, project-owned rule, missing, conflicting local invariant, or risk.

In `inspect-only`, report those findings and recommended minimal repairs without editing. In `minimal repair`, add only the missing pieces requested by the repair scope, or merge missing current-template sections into existing generated files. Extend project-owned rules in place; do not delete, rename, or rewrite project-specific invariants, and do not create parallel structures for the same responsibility.

## Resources

- `assets/templates/`: generated-project templates for project entry files, UI/CLI copy language, changelog, review, plan, root indexes, and bucket indexes.
- `assets/file-size-guardrail.md`: repair reference for oversized existing files; read before restructuring.
- `scripts/file-level-review-expiry.sh`: copied helper for project-local review-expiry checks.
- `scripts/ref-archive-reminder-pre-commit.sh`: copied helper for the advisory `.ref/` archive pre-commit reminder.
