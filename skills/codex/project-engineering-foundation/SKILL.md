---
name: project-engineering-foundation
description: "Use when creating a new AI-coding repository or when an existing repository lacks the durable engineering structure (CLAUDE.md/AGENTS.md/UI_COPY_LANGUAGE.md entries, src/build layout, ref/ record indexes). One-time setup: instantiates templates that install the ongoing plan/review lifecycle, change records, review-expiry, convention-promotion, UI/CLI copy language, and 500-line file-size rules into the project itself; not needed for routine maintenance afterwards."
---

# Project Engineering Foundation

Use this skill as a one-shot setup: inspect the existing repository first, preserve project-specific invariants, and write all ongoing process rules into the generated project files. `CLAUDE.md` is the project workflow SSOT, and `UI_COPY_LANGUAGE.md` is the user-facing UI/CLI copy language SSOT. After setup the project applies those rules from its own files; this skill is not loaded for routine work. Use `rg` / shell for inspection and `apply_patch` for manual file edits.

## New Project Setup

Create or complete this shape when the repository lacks a durable AI-coding structure. If an equivalent project convention already exists, extend it instead of renaming or replacing it.

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
    ├── changelogs/INDEX.md
    ├── reviews/INDEX.md
    ├── plans/INDEX.md
    └── conventions/
        ├── INDEX.md
        ├── tally.md
        └── <X>-<topic>.md
```

Use only the needed template from `assets/templates/`; create or update project files with `apply_patch`, not shell redirection. Merge missing sections into existing files instead of overwriting project-specific instructions.

Instantiate `assets/templates/project-claude.template.md` as `CLAUDE.md`, `assets/templates/project-agents.template.md` as `AGENTS.md`, and `assets/templates/ui-copy-language.template.md` as `UI_COPY_LANGUAGE.md`. The CLAUDE.md template carries the ongoing workflow rules: plan/review artifact lifecycle, change records, review expiry, file-size guardrail, convention promotion, and the instruction to obey `UI_COPY_LANGUAGE.md` for UI/CLI copy. The UI/CLI copy language template carries the active language mode and supported locales, so do not duplicate those settings in CLAUDE.md. Fill template placeholders from repository inspection, and merge missing sections into existing files instead of overwriting them.

## Layout Rules

- Put first-party source under `src/`. Do not put fixtures, generated artifacts, or dependencies there.
- Put project scripts and automation helpers under `scripts/`.
- Pick one build output root, `build/` or `dist/`, and keep all toolchain output under it.
- Add both `build/` and `dist/` to `.gitignore`, even if the project currently uses only one.
- Add `.refs/` to `.gitignore`; it is the non-terminal plan/review working area, not a durable reference archive.
- Keep AI-coding reference artifacts in `ref/`; do not ignore `ref/`.
- Keep `UI_COPY_LANGUAGE.md` at project root; update it before changing the active UI/CLI copy language mode or supported locales.

## Bundled Helpers To Copy Into The Project

During setup, copy `scripts/file-level-review-expiry.sh` from this skill into the project at `scripts/file-level-review-expiry.sh` so the review-expiry check in the generated CLAUDE.md stays runnable without this skill. When repairing an existing repository that already has oversized files, read `assets/file-size-guardrail.md` for the detailed split policy before restructuring; the generated CLAUDE.md carries the compact ongoing rule.

## Existing Repository Repair

When invoked on a repository that partially has the structure, diff the repository against the tree above and against the template sections, then add only what is missing. Never delete or rewrite project-specific invariants. If the repository's CLAUDE.md predates the current template, merge in the missing rule sections — plan/review lifecycle, change records, review expiry, file-size guardrail, convention promotion — without overwriting customized values.

## Resources

- `assets/templates/`: project entry, UI/CLI copy language, changelog, review, plan, and convention templates.
- `assets/file-size-guardrail.md`: detailed split-risk policy.
- `scripts/file-level-review-expiry.sh`: mechanical review-expiry helper; copied into projects at setup.
