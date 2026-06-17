---
name: flow-arch-plantuml
description: Use when the user asks to create or update a flow, architecture, sequence, activity, component, or PlantUML diagram. Focuses on drawing; writes new `.puml` diagrams to an explicit user path or a temporary directory such as `/tmp/flow-arch-plantuml/`, and does not render PNG/SVG.
---

# Flow / Architecture PlantUML

Use this skill to create or update PlantUML `.puml` diagrams when requested. Ask only for missing drawing inputs, end the turn, then inspect with `shell` and edit `.puml` files with `apply_patch` after the required information is available; for new diagrams, use `/tmp/flow-arch-plantuml/` unless the user explicitly specifies an output path.

## When To Use

Invoke this skill when the user asks for a diagram, including requests such as "画架构图", "画流程图", "画 PlantUML", "flow diagram", "sequence diagram", "architecture diagram", "component diagram", "activity diagram", or "update this diagram".

## Drawing Inputs

Gather only the inputs needed to draw the diagram. Ask only for required inputs the user has not already provided.

1. **Diagram type:** Sequence, activity, or component — see PlantUML Rules for guidance.
2. **Topic and name:** The subject being diagrammed and the intended filename.
3. **Source evidence:** The source files, description, or context needed to draw accurately.

No blocking user-question tool is available in this environment. After asking for required inputs, end the turn and wait for the user's next message. Do not ask for an output directory for a new diagram; apply the output rules below.

## Workflow

1. Gather missing drawing inputs; end the turn if a required input is missing and wait for the user's response.
2. Read the relevant source or context evidence with `shell`.
3. Create or update `.puml` files with `apply_patch` using the file rules below.
4. Check `@startuml` / `@enduml` pairing and run `plantuml -syntax <file>.puml` through `shell` when PlantUML is installed.
5. Report the changed `.puml` files, the output path, the syntax-check result, any PlantUML CLI gap, and any unresolved required input.

## File Rules

- Use the user's requested diagram path or directory when provided.
- When updating an existing `.puml`, edit that file.
- For new diagrams without an explicit user path, create files under `/tmp/flow-arch-plantuml/`; create that directory first if it does not exist.
- Do not infer an output directory from repository diagram conventions or existing `.puml` files.
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
