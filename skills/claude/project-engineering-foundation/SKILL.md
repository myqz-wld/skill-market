---
name: project-engineering-foundation
description: "Use when creating a new AI-coding repository or repairing one that lacks the durable engineering structure: CLAUDE.md/AGENTS.md/UI_COPY_LANGUAGE.md entries, src/build layout, ref/ record indexes, plan/review lifecycle, review expiry, convention promotion, UI/CLI copy-language SSOT, and 500-line file-size rules. One-time setup only; not for routine maintenance."
---

# Project Engineering Foundation

Use this skill for one-shot setup. Inspect the repository first, preserve project-specific invariants, and install ongoing process rules into project files. After setup, the project follows its own `CLAUDE.md` workflow SSOT and `UI_COPY_LANGUAGE.md` UI/CLI copy-language SSOT. Use Bash for inspection and file tools for project file edits.

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

Use only the needed template from `assets/templates/`; create or update project files with file tools, not shell redirection. Merge missing template sections into existing files instead of overwriting project-specific instructions.

Instantiate `assets/templates/project-claude.template.md` as `CLAUDE.md`, `assets/templates/project-agents.template.md` as `AGENTS.md`, and `assets/templates/ui-copy-language.template.md` as `UI_COPY_LANGUAGE.md`. Fill placeholders from repository inspection. Keep active language mode and supported locales only in `UI_COPY_LANGUAGE.md`, not `CLAUDE.md`. Write active documentation and maintainer/agent-facing instructions in English by default; exceptions are `UI_COPY_LANGUAGE.md`, UI/CLI copy governed by that file, locale examples, quoted/source text, and explicit non-English trigger anchors or examples.

## Layout Rules

- Put first-party source under `src/`. Do not put fixtures, generated artifacts, or dependencies there.
- Put project scripts and automation helpers under `scripts/`.
- Pick one build output root, `build/` or `dist/`, and keep all toolchain output under it.
- Add both `build/` and `dist/` to `.gitignore`, even if the project currently uses only one.
- Add `.refs/` to `.gitignore`; it is the non-terminal plan/review working area, not a durable reference archive.
- Keep AI-coding reference artifacts in `ref/`; do not ignore `ref/`.
- Keep `UI_COPY_LANGUAGE.md` at project root; update it before changing the active UI/CLI copy language mode or supported locales.

## Bundled Helpers To Copy Into The Project

Copy `scripts/file-level-review-expiry.sh` from this skill into the project at `scripts/file-level-review-expiry.sh` so the generated review-expiry check is runnable without this skill. When repairing oversized existing files, read `assets/file-size-guardrail.md` before restructuring; generated `CLAUDE.md` carries the compact ongoing rule.

## Existing Repository Repair

When the repository already has part of the structure, diff it against the tree above and current templates, then add only missing files or sections. Never delete or rewrite project-specific invariants. If `CLAUDE.md` predates the current template, merge missing rule sections without overwriting customized values.

## Resources

- `assets/templates/`: project entry, UI/CLI copy language, changelog, review, plan, and convention templates.
- `assets/file-size-guardrail.md`: detailed split-risk policy.
- `scripts/file-level-review-expiry.sh`: mechanical review-expiry helper; copied into projects at setup.
