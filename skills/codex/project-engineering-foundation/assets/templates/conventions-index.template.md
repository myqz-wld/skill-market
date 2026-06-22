# Conventions Index

## Purpose

Durable project-specific conventions promoted from repeated decisions or repeated mistakes. Keep dynamic conventions here under `ref/conventions/`; keep `CLAUDE.md` limited to static project invariants and workflow.

## Naming

Final conventions use `CONVENTION_X_<topic>.md`. Before creating one, run `ls ref/conventions/`, set `X` to the maximum existing convention number in this directory plus 1, and do not guess. `<topic>` is short stable kebab-case and must not be vague like `update`, `fix`, or `misc`. Update this index in the same change.

## File Structure

- Trigger
- Rule
- Rationale
- Counterexamples / pitfalls
- Links
- Scope / exceptions

## Promotion

Add candidates to `tally.md`. When `count >= 3`, run the configured review process, create `ref/conventions/CONVENTION_X_<topic>.md`, update this index, and remove the promoted candidate from `tally.md`.

## Index Table

Read relevant convention files before changing related code.

| File | Topic (<= 80 chars) | Promoted At | Related Changelog | Related Review |
|------|---------------------|-------------|-------------------|----------------|
| <fill after first promotion> | | | | |

## Candidate State

See `ref/conventions/tally.md`.

## Relationship To Project Entry

Keep only entry-critical invariants in project `CLAUDE.md`; put accumulated conventions in this directory.
