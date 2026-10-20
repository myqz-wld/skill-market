---
name: project-bootstrap
description: "Create new-project scaffolds or adjust existing architecture. Ask consequential questions, choose reversible defaults, and verify structure and document navigation. Does not implement new product features."
---

# Project Bootstrap for Grok

Scope is limited to new-project scaffolding and existing-project architecture
adjustment. Understand product intent only to choose structure and capabilities.
Do not implement new business features, user journeys or domain behavior.

A new scaffold may include framework startup, an empty page, health response,
package import or CLI help plus structural smoke checks. Existing adjustments may
move modules, repair imports/configuration and enforce agreed boundaries while
preserving observable behavior. Login, checkout, reporting, CRUD and other product
work stay outside this skill, even when described as a "first useful example".
For a mixed request, identify that boundary and agree on the structural portion;
do not silently implement the feature or claim the entire product request is done.

## 1. Establish the target and scope

Choose **scaffold** for a new project or **adjust** for existing architecture.
Discussion and read-only inspection are stages within those modes. A feature-only
request should leave this workflow; briefly explain its scope without starting an
architecture interview or changing project structure.

The skill directory is a resource location, not the target project. Before any
project write, identify the target and read its instructions, working changes,
native runtime/dependency files and relevant structure. A discussion can start
without a directory. For existing projects read `references/existing-repositories.md`.
Reuse prior answers and authorization; preserve established project conventions.

## 2. Interview in dependency order

Read `references/interview.md`. Resolve scope and hard constraints, then delivery
units and needed capabilities. Inspect evidence before asking. Ask only unanswered
questions whose answers materially change architecture, compatibility, cost,
scope or workflow; normally batch two or three related questions when needed.
There is no minimum question count. Use an available native question interface
under its live contract, or concise chat.

Reuse established conventions. Select reversible routine details yourself and
briefly disclose useful defaults in the blueprint; no separate delegation is
needed. Omit advanced controls without a concrete need. File-size advisories,
metadata syntax and similar configurable settings are not a mandatory question
list. Ask about conflicts, consequential unknowns and new blocking policy gates.
A user's delegation covers its stated scope; silence does not authorize unresolved
consequential choices or external effects. Label agent-chosen defaults honestly.

## 3. Present an actionable blueprint

Read `references/architecture.md`, `references/manifest.md` and
`references/retrieval.md`. Use `assets/templates/blueprint.md` as an outline:

- Structural outcome, target, excluded feature work and existing invariants.
- Stack, repository/layout boundaries, selected capabilities and concrete paths.
- A brief note on noteworthy defaults and policy exceptions, with honest origins.
- Files to create, move, merge or generate; sources of truth and task navigation.
- Structural smoke/regression checks, deferred choices and external prerequisites.

Show only the selected tree. Resolve consequential unknowns and the concrete write
scope together; proceed when already authorized instead of repeating approval.
Optional advanced policies may stay deferred; routine defaults need not delay work.
Do not silently turn an advisory into a new blocking enforcement rule.
Save a durable plan only when the work warrants it, in the project's chosen format.

## 4. Build or adjust architecture

Read `references/engineering-practices.md` and `references/validation.md`.
Use Grok's available native file-editing and execution tools under their
live contracts; do not assume Claude/Codex tool names or configuration.

Instantiate applicable templates with established, confirmed or agent-chosen
routine settings, adapting metadata syntax and paths to the project policy. Consolidate small documentation
roles when useful; create no imaginary modules, empty reports or policy directories.
Use native scaffold tooling after inspecting its effects. Respect project-local
runtime compatibility and package tooling; user-level versions are only fallbacks.

Create only infrastructure needed for the selected scaffold or restructuring.
Use generic boot/import/configuration checks rather than domain implementations.
For existing architecture, keep behavior and public contracts stable; separately
surface any requested breaking change before editing dependent code.

Use project.yaml and its bundled schema only if that manifest was selected;
otherwise preserve the agreed equivalent role/path map. Register actual commands,
not placeholder success tasks. A structure-only result need not invent dev/test
commands or install a framework. Disclose missing tooling and incomplete checks.

For selected AI integration, read `references/adapters.md`; for distribution
setup, `references/distribution.md`; for opted-in review tracking,
`references/review-coverage.md`. Do not load these for unrelated projects.

## 5. Verify and hand off

Execute the agreed structural checks and relevant existing regression checks.
Test task navigation and historical-document handling as described in
`references/validation.md`. Repeated generation or adoption must preserve owned
sources and unrelated user work. Use disposable fixtures for validation.

Report changed structure, decisions, actual commands/results and remaining setup.
Separate passed, not applicable and unverified checks. Confirm feature work was
left outside this deliverable; do not claim a working business workflow or begin
implementing the product's next feature as part of this skill.

Resources and templates resolve from this skill directory. Their example docs/,
.agents/ and code paths refer to the future target project.
