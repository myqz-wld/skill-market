---
name: flow-arch-plantuml
description: Use when the user asks for a flow/architecture diagram or a change affects a core workflow, state machine, protocol, process boundary, schema, permission boundary, or module architecture. Confirms the diagram gate, creates or updates PlantUML `.puml` diagrams in the repository's established diagram location, and does not render PNG/SVG.
---

# Flow / Architecture PlantUML

Use this skill to decide whether a core workflow or architecture change needs a PlantUML diagram, then create or update the `.puml` source diagram after confirmation. Use `AskUserQuestion` for missing decisions when available; inspect with Bash/Read and edit `.puml` files with file tools.

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
3. **File action:** Create a new `.puml` or update an existing `.puml` in the repository's established diagram location. If no established diagram location exists, ask where the diagram should live before editing.

Wait for the user's decision. Do not create or edit `.puml` files before confirmation.

## Workflow

1. Resolve the confirmation gate and wait for the user decision.
2. Locate the repository's established diagram location by listing existing `.puml` files and nearby diagram conventions; ask the user if no clear location exists.
3. Read the relevant source, plan, or review evidence.
4. Create or update `.puml` files using the file rules below.
5. Check `@startuml` / `@enduml` pairing and run `plantuml -syntax <file>.puml` when PlantUML is installed.
6. Report the changed `.puml` files, the syntax-check result, any PlantUML CLI gap, and any unresolved location decision.

## File Rules

- Use the repository's established diagram location for PlantUML source files.
- If the repository has no established diagram location, ask the user to choose one before creating a new diagram.
- Name files with kebab-case topics, such as `auth-login-flow.puml` or `mcp-server-architecture.puml`.
- When one topic needs both flow and architecture views, create separate files whose names identify each diagram's job.

## PlantUML Rules

Start every diagram with this header:

```plantuml
' source: <plan-id, issue, commit hash, or brief evidence label>
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

- If PlantUML CLI is unavailable, verify `@startuml` / `@enduml` pairing and report that strict syntax validation was not run.
- If `plantuml -syntax` fails, fix the `.puml`, rerun the check, and report the final status.
- If multiple `.puml` files describe the same flow, choose more specific topic names and explain the difference in the final report.

## Review Workflow Relationship

This skill only creates or updates `.puml` files. If a review or plan says a core flow has no diagram, finish that workflow first, then invoke this skill. Do not run it in parallel with another workflow that writes `.puml` files.
