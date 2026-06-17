---
name: flow-arch-plantuml
description: Use when the user asks to create or update a flow, architecture, sequence, activity, component, or PlantUML diagram. Asks for missing drawing inputs, creates or updates PlantUML `.puml` diagrams in the repository's established diagram location or `tmp/` fallback, and does not render PNG/SVG.
---

# Flow / Architecture PlantUML

Use this skill to create or update PlantUML `.puml` diagrams when requested. Use `AskUserQuestion` for missing drawing inputs when available; inspect with Bash/Read and edit `.puml` files with file tools; default new diagrams to `tmp/` when no output location is specified or established.

## When To Use

Invoke this skill when the user asks for a diagram, including requests such as "画架构图", "画流程图", "画 PlantUML", "flow diagram", "sequence diagram", "architecture diagram", "component diagram", "activity diagram", or "update this diagram".

## Drawing Inputs

Gather these inputs before editing diagrams. Ask only for required inputs the user has not already provided.

1. **Diagram type:** Sequence, activity, or component — see PlantUML Rules for guidance.
2. **Topic and name:** The subject being diagrammed and the intended filename.
3. **Diagram location:** Update an existing `.puml` when requested. For new diagrams, use a user-specified location, otherwise the repository's established diagram location, otherwise `tmp/`.
4. **Source evidence:** The source files, description, or context needed to draw accurately.

Wait for the user's inputs if required information is missing. Do not ask only for a missing output directory; apply the location fallback in File Rules.

## Workflow

1. Gather missing drawing inputs; wait for the user's response if required inputs are missing.
2. Locate the repository's established diagram location by listing existing `.puml` files and nearby diagram conventions; use `tmp/` for new diagrams if no clear location exists.
3. Read the relevant source or context evidence.
4. Create or update `.puml` files using the file rules below.
5. Check `@startuml` / `@enduml` pairing and run `plantuml -syntax <file>.puml` when PlantUML is installed.
6. Report the changed `.puml` files, the chosen location, the syntax-check result, any PlantUML CLI gap, and any unresolved required input.

## File Rules

- Use the user's requested diagram path or directory when provided.
- Use the repository's established diagram location for new PlantUML source files when the user does not specify a location.
- If the repository has no established diagram location, create new diagrams under `tmp/`; create that directory first if it does not exist.
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
