---
name: flow-arch-plantuml
description: Use when the user asks to create or update a flow, architecture, sequence, activity, component, or PlantUML diagram. Asks for missing drawing inputs, creates or updates PlantUML `.puml` diagrams in the repository's established diagram location, and does not render PNG/SVG.
---

# Flow / Architecture PlantUML

Use this skill to create or update PlantUML `.puml` diagrams when requested. Ask missing drawing inputs in the response, end the turn, then inspect with `shell` and edit `.puml` files with `apply_patch` after the required information is available.

## When To Use

Invoke this skill when the user asks for a diagram, including requests such as "画架构图", "画流程图", "画 PlantUML", "flow diagram", "sequence diagram", "architecture diagram", "component diagram", "activity diagram", or "update this diagram".

## Drawing Inputs

Gather these inputs before editing diagrams. Ask only for inputs the user has not already provided.

1. **Diagram type:** Sequence, activity, or component — see PlantUML Rules for guidance.
2. **Topic and name:** The subject being diagrammed and the intended filename.
3. **Diagram location:** Create a new `.puml` or update an existing `.puml` in the repository's established diagram location. If no established diagram location exists, ask where the diagram should live.
4. **Source evidence:** The source files, description, or context needed to draw accurately.

No blocking user-question tool is available in this environment. After asking, end the turn and wait for the user's next message. Do not create or edit `.puml` files before the required inputs are available.

## Workflow

1. Gather missing drawing inputs; end the turn if a required input is missing and wait for the user's response.
2. Locate the repository's established diagram location by listing existing `.puml` files and nearby diagram conventions with `shell`; ask the user if no clear location exists.
3. Read the relevant source or context evidence with `shell`.
4. Create or update `.puml` files with `apply_patch` using the file rules below.
5. Check `@startuml` / `@enduml` pairing and run `plantuml -syntax <file>.puml` through `shell` when PlantUML is installed.
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

- If PlantUML CLI is unavailable, verify `@startuml` / `@enduml` pairing with `shell` and report that strict syntax validation was not run.
- If `plantuml -syntax` fails, fix the `.puml`, rerun the check, and report the final status.
- If multiple `.puml` files describe the same flow, choose more specific topic names and explain the difference in the final report.
