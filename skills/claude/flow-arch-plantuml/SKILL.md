---
name: flow-arch-plantuml
description: "Use when creating or updating PlantUML flow, architecture, sequence, activity, or component diagrams from source evidence. Writes `.puml` files only and does not render PNG/SVG."
---

# Flow / Architecture PlantUML

Use this skill to create or update PlantUML `.puml` diagrams when requested. Use `AskUserQuestion` only for required missing drawing inputs when available; once inputs are available, inspect with Bash/Read and edit `.puml` files with file tools. For new diagrams, use `/tmp/flow-arch-plantuml/` unless the user explicitly specifies an output path.

## When To Use

Invoke this skill when the user asks for a diagram, including requests such as "画架构图", "画流程图", "画 PlantUML", "flow diagram", "sequence diagram", "architecture diagram", "component diagram", "activity diagram", or "update this diagram".

## Drawing Inputs

Gather only the inputs needed to draw the diagram. Ask only for required inputs the user has not already provided.

1. **Diagram type:** Sequence, activity, or component; see PlantUML Rules for guidance.
2. **Topic and name:** The subject being diagrammed and the intended filename.
3. **Source evidence:** The source files, description, or context needed to draw accurately.

Wait for the user's inputs if required information is missing. Do not ask for an output directory for a new diagram; apply the output rules below.

## Evidence Requirements

Before drawing, read the relevant source files or user-provided context. Trace each major node, edge, call chain, and state transition to a source file path plus function, class, config, or interface name, or to specific user-provided text.

Mark relationships not directly proved by source or context with a PlantUML `note` that labels them as inferred. Keep detailed evidence in the final report instead of embedding every source detail in the diagram.

## Workflow

1. Gather missing drawing inputs; stop for the user's response if required input is missing.
2. Read the relevant source or context evidence.
3. Map major diagram elements to evidence, then create or update `.puml` files using the file rules below.
4. Check `@startuml` / `@enduml` pairing and run `plantuml -syntax <file>.puml` when PlantUML is installed.
5. Report the required final-report fields, changed files, output path, syntax-check result, PlantUML CLI gaps, and unresolved required inputs.

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

## Final Report

Include these fields:

- `Evidence used`: source paths plus function, class, config, or interface names, or the user-provided text used for major diagram elements.
- `Inferred relationships`: every relationship marked as inferred in the diagram, or `None`.
- `Unverified assumptions`: missing sources, skipped validation, uncertain behavior, or `None`.
- For existing `.puml` updates, added, modified, and deleted diagram elements with the evidence basis for each change.

## Failure Handling

- If PlantUML CLI is unavailable, verify `@startuml` / `@enduml` pairing and report that strict syntax validation was not run.
- If `plantuml -syntax` fails, fix the `.puml`, rerun the check, and report the final status.
- If multiple `.puml` files describe the same flow, choose more specific topic names and explain the difference in the final report.
