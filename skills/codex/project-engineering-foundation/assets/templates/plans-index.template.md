# Plans Index

## Scope

Only final plan documents enter `ref/plans/`. Keep non-final plans in the current environment's plan workspace; if no stronger contract exists, use `<repo>/.ref/plans/`. Add `.ref/` to `.gitignore`. When a plan reaches a final state, archive the final document and plan-specific support materials under `ref/plans/`, update this index, and remove workspace copies.

## Naming

Final plans use `PLAN_X_<topic>.md`. Before creating one, run `ls ref/plans/`, set `X` to the maximum existing plan number in this directory plus 1, and do not guess. `<topic>` is short stable kebab-case and must not be vague like `update`, `fix`, or `misc`. Update this index in the same change.

## File Structure

- Goal
- Context / constraints
- Task breakdown
- Validation
- Final status / handoff

## Index Table

| Plan | Status | Completed At | Summary | Related Changelog/Review |
|---|---|---:|---|---|
| <fill after first final plan> | | | | |
