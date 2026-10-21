---
name: project-bootstrap
description: "Create runnable new-project scaffolds or refactor existing architecture for AI-led development. Use for project structure and engineering setup; keep new business features outside scope."
---

# Project Bootstrap

Deliver a runnable new scaffold or an existing project with the agreed architecture
changes implemented. Code, dependencies, runtime configuration, build/start tasks
and meaningful checks are in scope; new business features and domain-rule redesign
remain separate work.

Determine whether the target is new or existing, and whether the request is
assessment-only. An assessment stays read-only and ends after stage 2.
Follow **read the code → confirm requirements → scaffold/refactor and verify**.
Work on the actual target using the current adapter's native tools; preserve user edits.

Optimize for AI-led engineering: focused context, explicit contracts, durable
project knowledge and trustworthy checks. Cover the constraints, knowledge,
implementation, verification and tooling layers according to actual project needs.

This skill runs during setup or architectural change, not routine development.
Materialize lasting rules, record locations, retrieval, evolution guidance and selected
checks/tools in the target project. Later sessions must work from that project alone,
without this installed skill, its resource paths or another skill as a prerequisite.

This file is the sole navigator for bundled resources. Read the relevant complete
sections directly at the indicated step, before dependent work. Other resources
remain self-contained; target-project documents may link their own authorities.
A missing resource blocks only the work that requires it.

Stage outputs may live in the conversation or existing project records. Create
documents only when they serve implementation, resumption or ongoing maintenance.

## 1. Read the code and establish the baseline

Start with [inspection guidance](references/inspection.md), using the existing-project
or empty-target section. Before handling project data, read the constraints and privacy
sections of [AI-led engineering rules](references/ai-development.md); read its knowledge,
file/language, tooling or parallel-work sections when those concerns apply.

- **Existing project:** trace relevant entrypoints, configuration, module responsibilities,
  public contracts, dependencies and tests. Record user edits, protected behavior,
  actual build/start/check commands and baseline failures.
- **New target:** inspect project instructions, constraints and any supplied starter.
  Explicitly distinguish available starter code from an empty target with no baseline.

Inspect the project's actual coding tools, shared/native instructions and project policy.
The current adapter does not determine which tools the target project supports.
Use sanitized schemas/examples instead of private configuration payloads. Run applicable
baseline checks only when their effects fit the requested scope; distinguish failed
checks from unavailable ones.
When locating or designing project knowledge, read
[documentation retrieval](references/documentation.md) before dependent searches or edits.

With the inspected facts, read the capability-selection section and matching layout
in [reference architectures](references/architecture.md). Use the relevant responsibilities,
dependency rules and evolution sections for affected boundaries. Read other mappings
only if the requirements call for them; keep the final layout open until stage 2.

**Stage output:** an evidence-backed current-state map, preserved invariants,
baseline results and architectural choices that remain unresolved.

## 2. Confirm architectural requirements

Use [requirements guidance](references/requirements.md) to cover applicable concerns
and separate:

- Observed facts and existing decisions: reuse their evidence and authorization.
- Reversible implementation defaults: disclose the choice within the permitted scope.
- Unresolved consequential choices: ask when they affect architecture, compatibility,
  privacy, external effects or acceptance; batch related questions.

Keep source/document/comment language and user-facing locale distinct. Apply the
existing file/context, privacy, retrieval and acceptance policies; resolve actual gaps
without turning every policy value into a question.
When source or artifacts may be public while development records stay private, read
[publication boundaries](references/publication.md) before choosing record destinations,
instruction ownership or export behavior. Reuse the chosen visibility profile for all
outputs; public files must not reference or depend on internal files.
For multiple runtime/deployment environments, read
[environment design](references/environments.md) before settling profiles, configuration
precedence, isolated resources, deployment units and verification scope.

Present the concrete tree, justified deviations and capability choices: needed now,
conditional future, omitted or unresolved. Cover dependencies of selected capabilities.
Identify current extension points and observable triggers for later module/layer/package
changes; keep conditional evolution separate from today's implementation.

Settle remaining choices, permitted writes, preserved contracts, explicitly allowed
compatibility changes and executable acceptance together. Proceed on existing
authorization without a repeated approval gate. While answers are pending, continue
independent inspection; unresolved prerequisites block dependent writes, and silence
is not acceptance.

**Stage output:** settled requirements, selected architecture, write scope,
compatibility contract and runnable acceptance. For an assessment, deliver the
proposed delta and evidence here, then stop.

## 3. Scaffold or refactor, then verify

Before changing files, read the matching scaffold/refactor section and applicable
execution/material rules in [implementation guidance](references/implementation.md),
plus the applicable checks in [validation requirements](references/validation.md).
Read each selected template below before producing its output.

1. **Prepare bounded steps when needed.** For multi-step work, retain scope, baseline,
   migration order, checkpoints, recovery and the next action in the existing task format.
2. **Implement the architecture.** Create a real entrypoint and runtime wiring, or migrate
   code with its callers, imports, configuration, build/start tasks and tests. Preserve
   the agreed behavior; validate explicitly authorized compatibility changes against
   their agreed contracts. Reopen only decisions affected by newly consequential findings.
3. **Verify each meaningful boundary.** Implement or reuse appropriate native focused/fast/full
   checks, repair in-scope regressions and rerun affected checks. Preserve protected acceptance;
   changed expectations require an authorized requirement change.
4. **Update project materials.** Ground them in actual code, paths, interfaces and working
   commands. Keep one owner per fact, remove unused sections/placeholders and merge small
   subjects into existing documentation. AGENTS.md is the shared native instruction entry;
   Claude's CLAUDE.md imports it and adds only Claude-specific rules. If those files must
   stay private, materialize them locally from the selected internal source owner.
   Preserve authored instructions and their scope. Provide working scoped knowledge
   lookup. Maintain task routes, links and any derived index when sources move or
   change status. Route later AI work to real extension
   points, architectural triggers, source lookup and validation requirements. Put the
   actual record destinations and any setup/sync/check/export commands in project-owned
   instructions. Keep public materials independently usable without internal content.
5. **Complete runnable acceptance.** Execute applicable build/type and regression checks,
   the actual startup/request, CLI or library-import path, and selected environment,
   protection, artifact-exclusion and diagnostic checks. Use isolated data and task-owned
   processes, preserving existing user services. Verify retrieval against actual sources.
   For a selected private/public boundary, exercise the real isolated export, forbidden
   reference checks and public run path; preparing output does not authorize publication.

| Output needed | Read directly and adapt to the project |
|---|---|
| Multi-step implementation or migration record | [Plan template](assets/templates/plan.md) |
| Setup and verified run/check commands | [Quickstart template](assets/templates/quickstart.md) |
| Current architecture and concrete evolution guidance | [Architecture template](assets/templates/architecture.md) |
| Task-oriented knowledge discovery | [Documentation map template](assets/templates/documentation-map.md) |
| A substantial module's contract and local context | [Module template](assets/templates/module.md) |
| Shared project instructions in AGENTS.md | [Shared AI instruction template](assets/templates/agent-rules.md) |
| Target project uses Claude: importing CLAUDE.md and Claude-only additions | [Claude instruction template](assets/templates/claude-rules.md) |
| New or adjusted native-compatible EditorConfig | [EditorConfig template](assets/templates/editorconfig) |

Select templates by actual need; they do not require separate output files.
Keep local execution, configured hooks/CI, native instruction loading and actual
deployment evidence distinct. Static files or working links alone cannot prove
runtime behavior or enforcement. Required checks blocked by prerequisites leave
delivery incomplete; identify the missing check and prerequisite.

**Stage output:** implemented architecture, verified runnable commands and useful
project materials. Report preserved behavior, agreed compatibility changes, actual
results and remaining work; distinguish baseline failures from regressions.
Archive only completed scope and stop before unrequested business feature work.
