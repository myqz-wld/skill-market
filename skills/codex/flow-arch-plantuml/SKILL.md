---
name: flow-arch-plantuml
description: Use when the user asks for a flow/architecture diagram or a change affects a core workflow, state machine, protocol, process boundary, schema, permission boundary, or module architecture. Confirms the diagram gate, updates PlantUML `.puml` SSOT files under `ref/flows` or `ref/architecture`, maintains INDEX files, and does not render PNG/SVG.
---

# Flow / Architecture PlantUML

Use this skill to decide whether a core workflow or architecture change needs a PlantUML diagram, then create or update the `.puml` SSOT and matching `ref/flows` or `ref/architecture` INDEX after confirmation. Ask missing decisions in the response, end the turn, then inspect with `shell` and edit `.puml` / INDEX files with `apply_patch` after the user confirms.

## When To Use

Invoke this skill when any condition applies:

- The user asks for a diagram, including requests such as "画架构图", "画流程图", "画 PlantUML", "flow diagram", or "architecture diagram".
- The change affects a core workflow, state machine, cross-process or cross-service protocol, database/schema contract, permission boundary, sandbox/tool contract, event routing, lifecycle transition, or module dependency.
- A plan or review says a core flow changed and its durable diagram is missing or stale.

Do not use this skill for typo fixes, local UI tweaks, isolated business logic edits, or bug fixes that do not change design, contracts, or flow. If the core-flow boundary is unclear, ask the user whether the change needs a diagram and follow that decision.

## Confirmation Gate

Resolve these decisions before editing diagrams. Ask only for decisions the user has not already provided.

1. **Core change:** Does this change affect a core workflow or architecture? If the user directly asked for a diagram, treat this as yes. If the user says no, stop and report that the diagram update was skipped by user decision.
2. **Diagram type:** Use a flow diagram (sequence/activity), an architecture diagram (component), or both.
3. **File action:** Create a new file, update an existing `.puml`, or mark an existing `.puml` archived.

No blocking user-question tool is available in this environment. After asking, end the turn and wait for the user's next message. Do not create or edit `.puml` or INDEX files before confirmation.

## Workflow

1. Resolve the confirmation gate and wait for the user decision.
2. List existing `.puml` files and read the matching INDEX files with `shell`.
3. Read the relevant source, plan, or review evidence with `shell`.
4. Create or update `.puml` files with `apply_patch` using the file rules below.
5. Update INDEX rows for new, changed, or archived diagrams with `apply_patch`.
6. Check `@startuml` / `@enduml` pairing and run `plantuml -syntax <file>.puml` through `shell` when PlantUML is installed.
7. Report the changed `.puml` and INDEX files, the syntax-check result, and any PlantUML CLI gap.

## File And INDEX Rules

- Put sequence and activity diagrams under `<main-repo>/ref/flows/<topic>.puml`.
- Put component, module-dependency, and process-boundary diagrams under `<main-repo>/ref/architecture/<topic>.puml`.
- Name files with kebab-case topics, such as `archive-plan-flow.puml` or `mcp-server-architecture.puml`.
- When one topic needs both flow and architecture views, create separate files whose names identify each diagram's job.
- If the directories are missing, run `shell: mkdir -p ref/flows ref/architecture`, then create empty INDEX files with `apply_patch`.

Use a four-column INDEX table. Keep existing localized column names when updating an existing INDEX; for new INDEX files use:

```markdown
| File | Status | Related plan / commit | Summary |
|---|---|---|---|
| archive-plan-flow.puml | active | plan-id | archive_plan closeout sequence |
```

- **Status:** `active` for the current SSOT, `archived` for retained stale diagrams, or `draft` for unconfirmed diagrams.
- **Archived diagrams:** add a PlantUML comment inside the `.puml`: `' ARCHIVED: <reason>`.
- **Related plan / commit:** link to `ref/plans/<plan-id>.md` or write a 7-character short hash.
- **Summary:** describe the diagram's subject in at most 80 characters.

## PlantUML Rules

Start every diagram with this header:

```plantuml
' plan: <plan-id> or commit: <hash>
' description: <one-sentence subject>
' last_updated: <ISO date>
@startuml <topic-name>

' diagram body

@enduml
```

- Use the `.puml` extension.
- Use PlantUML comments with `'`.
- Add a PlantUML `note` when a design choice, invariant, rejection condition, or non-obvious ordering matters.
- Do not render diagrams. Do not run `plantuml -tpng` or `plantuml -tsvg`; rendered files are local side effects and do not belong in the repository.

Choose the diagram type by the behavior being documented:

- **Sequence:** cross-process, cross-service, or adapter call chains.
- **Activity:** one-actor workflows, decision trees, or state transitions.
- **Component:** module dependencies, process boundaries, or data flow.

Open `references/plantuml-patterns.md` only when syntax examples for these diagram types or `note` usage are needed.

## Failure Handling

- If PlantUML CLI is unavailable, verify `@startuml` / `@enduml` pairing with `shell` and report that strict syntax validation was not run.
- If `plantuml -syntax` fails, fix the `.puml`, rerun the check, and report the final status.
- If multiple `.puml` files describe the same flow, choose more specific topic names and explain the difference in INDEX summaries.

## Review Workflow Relationship

This skill only creates or maintains `.puml` files. If a review or plan says a core flow has no diagram, finish that workflow first, then invoke this skill. Do not run it in parallel with another workflow that writes `.puml` or INDEX files.
