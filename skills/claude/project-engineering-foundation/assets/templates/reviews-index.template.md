# Reviews Index

> Scope: final debug, code review, performance audit, security review, and review-driven fix records. Keep non-final review drafts in `<repo>/.ref/reviews/` and add `.ref/` to `.gitignore`. Feature changes go in `ref/changelogs/INDEX.md`.

## Naming

Use `REVIEW_X.md`, where `X` is the next integer aligned with existing review files. Before creating a review, run `ls ref/reviews/` and choose one higher than the current maximum.

## File Structure

- Trigger
- Method: reviewer pair or fallback method, scope, and tools
- Adjudication: confirmed, refuted, and partial/unverified findings with evidence
- Fixes grouped by severity
- Related changelog for fixes landed in the same task
- Agent pitfall candidates when applicable

## Index

| File | Topic | Severity Distribution | Related Changelog |
|------|-------|-----------------------|-------------------|
| <fill after first review> | | | |
