---
name: plantuml-diagrams
description: "Use when creating or updating source-backed PlantUML `.puml` diagrams, including sequence, activity, component, flow, or architecture diagrams, for requests such as 画架构图, 画流程图, 画 PlantUML, or update this diagram. Writes `.puml` files only and does not render PNG/SVG."
---

# PlantUML Diagrams

Create or update only PlantUML `.puml` files. Ask only for required missing drawing inputs; if any are missing, end the turn. Once inputs are available, inspect source evidence with `shell` and edit `.puml` files with `apply_patch`. For new diagrams, use `/tmp/plantuml-diagrams/` unless the user explicitly specifies an output path.

## Drawing Inputs

Gather only the inputs needed to draw the diagram. Ask only for required inputs the user has not already provided.

1. **Diagram type:** Sequence, activity, or component; see PlantUML Rules for guidance.
2. **Topic:** The subject being diagrammed. Use the user's filename or path only when provided; otherwise generate the filename from the topic using the file rules below.
3. **Source evidence:** The source files, description, or context needed to draw accurately.

No blocking user-question tool is available in this environment. After asking for required inputs, end the turn and wait for the user's next message. Do not ask for an output directory for a new diagram; apply the output rules below.

## Evidence Requirements

Before drawing, read the relevant source files or user-provided context. Trace each major node, edge, call chain, and state transition to a source file path plus function, class, config, or interface name, or to specific user-provided text.

Do not add unproved relationships just to make the diagram look complete. Include inferred relationships only when they are necessary to explain the diagram; mark each one with a PlantUML `note` that labels it as inferred. Keep detailed evidence and every inferred relationship in the final report instead of embedding every source detail in the diagram.

## Workflow

1. Resolve only missing required drawing inputs; stop after asking when required input is missing.
2. Read source or context evidence with `shell`, then build an evidence map for major nodes, edges, call chains, and state transitions.
3. Create or update `.puml` files with `apply_patch` using the evidence map and the file rules below.
4. Check `@startuml` / `@enduml` pairing; when PlantUML is installed, run `plantuml -syntax <file>.puml` through `shell`.
5. Report changed files, output path, validation status, PlantUML CLI gaps, unresolved required inputs, and the required final-report evidence fields.

## File Rules

- Use the user's requested diagram path or directory when provided.
- When updating an existing `.puml`, edit that file.
- For new diagrams without an explicit user path, create files under `/tmp/plantuml-diagrams/`; create that directory first if it does not exist.
- Do not infer an output directory from repository diagram conventions or existing `.puml` files.
- Name files with kebab-case topics, such as `auth-login-flow.puml` or `mcp-server-architecture.puml`.
- When one topic needs both flow and architecture views, create separate files whose names identify each diagram's job.

## PlantUML Rules

Start every diagram with this header:

```plantuml
' source: <plan-id, issue, commit hash, or brief evidence label>
' description: <one-sentence subject>
' last_updated: <YYYY-MM-DD>
@startuml <kebab-case diagram name>

' diagram body

@enduml
```

- Use the `.puml` extension.
- Use PlantUML comments with `'`.
- Use the kebab-case file stem as the `@startuml` diagram name unless the user gave a specific diagram name.
- Add a PlantUML `note` when a design choice, invariant, rejection condition, or non-obvious ordering matters.
- Do not render diagrams. Do not run `plantuml -tpng` or `plantuml -tsvg`; this skill writes source `.puml` only.

Choose the diagram type by the behavior being documented:

- **Sequence:** cross-process, cross-service, or adapter call chains.
- **Activity:** one-actor workflows, decision trees, or state transitions.
- **Component:** module dependencies, process boundaries, or data flow.

Map broad requests to the closest type: flow diagrams usually become activity diagrams, architecture diagrams usually become component diagrams, and interaction-heavy architecture diagrams usually become sequence diagrams.

Open `references/plantuml-patterns.md` only when syntax examples for these diagram types or `note` usage are needed.

## Final Report

Include these fields:

- `Evidence used`: source paths plus function, class, config, or interface names, or the user-provided text used for major diagram elements.
- `Inferred relationships`: every relationship marked as inferred in the diagram, or `None`.
- `Unverified assumptions`: missing sources, skipped validation, uncertain behavior, or `None`.
- For existing `.puml` updates, added, modified, and deleted diagram elements with the evidence basis for each change.

## Failure Handling

- If PlantUML CLI is unavailable, verify `@startuml` / `@enduml` pairing with `shell` and report that strict syntax validation was not run.
- If `plantuml -syntax` fails, fix the `.puml`, rerun the check, and report the final status.
- If multiple `.puml` files describe the same flow, choose more specific topic names and explain the difference in the final report.
