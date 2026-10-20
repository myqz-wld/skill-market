# Structural acceptance

Choose checks in the blueprint, implement applicable checks with the selected
stack, and execute them. Severity comes from the user's policy. Distinguish a
structure-only deliverable from a scaffold whose boot/import path was exercised.
Do not introduce business features to manufacture a smoke scenario.

## Scope and core

1. Compare the changed-path set and behavior against the agreed scaffold or
   architecture adjustment. A new login/CRUD/reporting flow is out of scope.
2. If project.yaml was selected, parse it with a real YAML parser, validate the
   bundled schema and apply references/manifest.md semantics. Otherwise validate
   the existing agreed role map, not a second manifest.
3. Resolve selected roles, module ownership and document links. Reject missing
   required targets and escaping paths; omit optional absent capabilities.
4. Validate selected metadata formats and fields by document class. Evaluate the
   actual date/milestone/manual plan policy. An archived record's old expiry does
   not make it a current failing plan.
5. Check sizes and actual eagerly loaded entry context only when a budget was
   selected, honoring advisory/blocking/off mode and explicit exclusions.
6. Check accepted ADR immutability only with a selected rule and known baseline.
   Validate superseded targets and replacement cycles; missing authority/baseline
   is unknown, not an invented pass.
7. Run the agreed generic startup/import/configuration smoke and, for an existing
   project, relevant baseline/regression checks. Report pre-existing failures.
8. Scan changed shareable content for private paths/secrets without persisting raw
   matches. Review package members when distribution is within scope.

Do not execute arbitrary manifest commands as a side effect of reading metadata.
Checks must not deploy, mutate live databases, grant trust or fetch unapproved
remote baselines. Local setup requirements remain explicit.

## Capability setup, not product behavior

| Selected capability | Structural evidence |
|---|---|
| ui | Framework empty page/entry loads; selected token/story/test tooling resolves |
| api | Selected contract/tooling parses; generic health example only if agreed; existing interfaces remain compatible |
| async | Worker/task entry imports or starts; selected local wiring validates, without a new business job |
| data | Migration configuration and ownership resolve; existing migrations may run against a disposable database if in scope; no invented domain tables |
| ops | Chosen environment/config/deploy syntax validates; no deployment performed by a check |
| security | Architecture's relevant trust/data boundaries are recorded; no claim that product controls were implemented |
| library | Package builds/imports and archive members match the scaffold; no new functional API |
| multi-service | Declared applications and dependency boundaries resolve; local startup where selected and available |

Future capabilities can be documented without pretending their runtime exists.
Enabling a pack needs meaningful structural artifacts, not success-only commands
or arbitrary placeholder schemas. Report runtime checks that are not applicable.
A compatibility comparison without a previous release establishes a baseline;
it does not prove backward compatibility with an invented version.

## Retrieval acceptance

Use three applicable lookup tasks: locate an owning module/contract, locate a
structural check or configuration, and distinguish current policy from historical
rationale. If there is no history yet, test a current/superseded pair in a disposable
fixture using the chosen metadata convention. Do not add fake history to the repo.

Observe the actual sources found, files read and search-scope expansions. Confirm
task-map roles resolve, applicable hidden paths are reachable, optional roles are
omitted, and history/generation exclusions can be lifted for a relevant task.
Verify an old valid ADR remains discoverable; a newer superseded draft or review
must not become current authority merely because of its date. Missing metadata
must not silently mean active.

Exercise a bad path and, when selected, an oversized file or expired checkpoint in
a fixture. The checker must warn/fail exactly as the chosen policy says. For an off
policy it must not enforce a template's numeric recommendation. A prose rule is
not an implemented check; report navigation trials separately from automated gates.

## Generated consistency and optional AI integration

Inspect generators first. Prefer check mode or temporary output comparison,
including added, removed and untracked outputs. Respect declared committed versus
build-only outputs and reproducibility policy. Do not regenerate over dirty user
files merely to test consistency. Repeat the selected check/generation to detect
unexplained changes.

When AI integration is enabled, verify owned entries, native imports, task routes
and selected context budgets. When testing its removal, use a disposable fixture,
disable integration and remove only managed outputs/sources; human core checks
must still work. Preserve unrelated native settings. Report whether this ran.

## Handoff

List passed checks, not-applicable checks with reasons, and blocked/skipped checks
with the next action. Include selected policies and delegated decisions, changed
paths, structural startup/check commands and residual setup. Do not equate a file
or directory's existence with working enforcement or finished product behavior.
