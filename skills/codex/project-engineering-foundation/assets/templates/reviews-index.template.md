# Reviews Index

## Scope

Final records for debug, code review, performance audit, security review, and review-driven fixes. Keep non-final review drafts in `<repo>/.ref/reviews/` or the current review workspace, and add `.ref/` to `.gitignore`. Feature changes go in `ref/changelogs/INDEX.md` unless they are debug, performance, security, or review-driven fixes.

## Naming

Final reviews use `REVIEW_X_<topic>.md`. Before creating one, run `ls ref/reviews/`, set `X` to the maximum existing review number in this directory plus 1, and do not guess. `<topic>` is short stable kebab-case and must not be vague like `update`, `fix`, or `misc`. Update this index in the same change.

## File Structure

- Scope
- Findings
- Validation / evidence
- Residual risk
- Follow-ups

## Index Table

| File | Topic | Severity Distribution | Related Changelog |
|------|-------|-----------------------|-------------------|
| <fill after first review> | | | |
