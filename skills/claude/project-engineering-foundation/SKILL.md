---
name: project-engineering-foundation
description: "Use when inspecting, minimally repairing, or fully initializing an AI-coding repository's durable engineering structure: CLAUDE.md/AGENTS.md/UI_COPY_LANGUAGE.md entries, src/build layout, ref/ record indexes, plan/review lifecycle, review expiry, convention promotion, UI/CLI copy-language SSOT, and 500-line file-size rules. Existing repositories default to inspect-only unless edits are authorized; one-time setup/repair only, not routine maintenance."
---

# Project Engineering Foundation

Use this skill for one-shot inspection, repair, or setup. Inspect the repository first, preserve project-specific invariants, and choose an execution mode before editing. After setup, the project follows its own `CLAUDE.md` workflow SSOT and `UI_COPY_LANGUAGE.md` UI/CLI copy-language SSOT. Use Bash for inspection and file tools for project file edits.

## Execution Mode

Choose the mode before making file changes.

- `inspect-only`: default for existing repositories or unclear user intent. Report missing structure, equivalent existing conventions, recommended minimal repairs, and risks. Do not edit files.
- `minimal repair`: use only when the user explicitly asks to repair, fill gaps, or add missing foundation pieces. Add only critical missing files or rules, and merge template fragments without overwriting existing conventions.
- `full foundation setup`: use for new repositories or explicit full initialization. Create the complete `CLAUDE.md`, `AGENTS.md`, `UI_COPY_LANGUAGE.md`, `ref/` structure, helper scripts, and related rules as needed.

Existing repositories stay in `inspect-only` unless the user authorizes edits. New repositories may enter `full foundation setup`. Explicit repair or gap-filling requests may enter `minimal repair`. Explicit full initialization may enter `full foundation setup`.

## Setup And Repair Flow

Create or complete this shape only in `minimal repair` or `full foundation setup`. If an equivalent project convention already exists, extend it instead of renaming or replacing it.

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
        └── tally.md
```

Use only the needed template from `assets/templates/`; create or update project files with file tools, not shell redirection. Merge missing template sections into existing files instead of overwriting project-specific instructions.

Instantiate `assets/templates/project-claude.template.md` as `CLAUDE.md`, `assets/templates/project-agents.template.md` as `AGENTS.md`, and `assets/templates/ui-copy-language.template.md` as `UI_COPY_LANGUAGE.md`. Fill placeholders from repository inspection. Keep active language mode and supported locales only in `UI_COPY_LANGUAGE.md`, not `CLAUDE.md`. Write active documentation and maintainer/agent-facing instructions in English by default; exceptions are `UI_COPY_LANGUAGE.md`, UI/CLI copy governed by that file, locale examples, quoted/source text, and explicit non-English trigger anchors or examples.

For final archives, follow the matching generated `INDEX.md` template as the naming and file-structure source of truth, including the `ls <dir>/` max-number + 1 rule. Keep non-final drafts in `.ref/` or the current environment workspace, not final `ref/` archives.

## Layout Rules

- Put first-party source under `src/`. Do not put fixtures, generated artifacts, or dependencies there.
- Put project scripts and automation helpers under `scripts/`.
- Pick one build output root, `build/` or `dist/`, and keep all toolchain output under it.
- Add both `build/` and `dist/` to `.gitignore`, even if the project currently uses only one.
- Add `.ref/` to `.gitignore`; it is the non-terminal plan/review working area, not a durable reference archive.
- Keep AI-coding reference artifacts in `ref/`; do not ignore `ref/`.
- Keep `UI_COPY_LANGUAGE.md` at project root; update it before changing the active UI/CLI copy language mode or supported locales.

## Bundled Helpers To Copy Into The Project

Copy `scripts/file-level-review-expiry.sh` from this skill into the project at `scripts/file-level-review-expiry.sh` so the generated review-expiry check is runnable without this skill.

Copy `scripts/plan-archive-reminder-pre-commit.sh` from this skill into the project at `scripts/plan-archive-reminder-pre-commit.sh`, then run `bash scripts/plan-archive-reminder-pre-commit.sh --install` from the repository root. The installer appends a managed block to the local `.git/hooks/pre-commit` hook instead of replacing existing hook logic. The hook must remain advisory: it checks `.ref/plans/` for non-final plan files, reminds the committer to consider archiving plans to `ref/plans/` and updating `ref/plans/INDEX.md`, then exits 0.

When repairing oversized existing files, read `assets/file-size-guardrail.md` before restructuring; generated `CLAUDE.md` carries the compact ongoing rule.

## Existing Repository Repair

When the repository already has part of the structure, diff it against the tree above and current templates, then report only in `inspect-only` or add only missing files or sections in `minimal repair`. Never delete or rewrite project-specific invariants. If `CLAUDE.md` predates the current template, merge missing rule sections without overwriting customized values.

## Resources

- `assets/templates/`: project entry, UI/CLI copy language, changelog, review, plan, and convention templates.
- `assets/file-size-guardrail.md`: detailed split-risk policy.
- `scripts/file-level-review-expiry.sh`: mechanical review-expiry helper; copied into projects at setup.
- `scripts/plan-archive-reminder-pre-commit.sh`: advisory pre-commit helper that reminds users to archive non-final plan files.
