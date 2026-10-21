# Confirm architecture requirements

Use inspection evidence to ask only consequential unanswered questions. The goal
is a settled architectural change and runnable acceptance, not a broad product
specification or a questionnaire about every possible capability.

## Coverage

| Topic | New scaffold | Existing architecture change |
|---|---|---|
| Outcome | App, CLI, library or other actual deliverable; minimal runnable entry | Specific coupling/boundary problem and desired improvement |
| Constraints | Required runtime/framework, dependencies, environments and interfaces | Native constraints, consumers and compatibility obligations |
| Ownership | Responsibilities and data boundaries needed now | Current versus proposed owners and dependency direction |
| Capabilities | Reference parts needed now, omitted, conditional future or unresolved | Actual capability/dependency gaps and justified additions/removals |
| Evolution | Likely next iterations and justified extension seams | Concrete change patterns or new consumers driving a split |
| Behavior | Minimal startup/import behavior; business features excluded | Public behavior, domain rules and data to preserve |
| AI engineering | Actual coding tools, shared AGENTS.md, conditional Claude import/additions, protected acceptance and native check/record owners | Preserve authored rules and scope while consolidating shared instructions; identify missing native integration or enforcement |
| Documentation retrieval | Task-oriented entry, approved search corpus and native lookup/maintenance tools | Preserve useful docs navigation; resolve demonstrated discovery gaps, stale routes and source-authority conflicts |
| File/context policy | Source language/formats, document/comment language, size budgets and exceptions | Preserve native warn/block/off settings and applicable policy owners |
| Product text | UI/CLI locale when user-facing text exists | Preserve established locale and resource ownership |
| Privacy | Allowed context/data, private configuration, synthetic examples and actual package exclusions | Preserve working secrets, inspect changed artifacts and resolve specific exposure risks |
| Publication boundary | Public/private repository mode, publishable materials, internal record root and visibility of native AI entries | Tracked/history exposure, public-to-private references, existing export ownership and migration scope |
| Environments | Actual profiles, deployment units, precedence, secrets/data isolation and intended run/deploy effects | Preserve effective configuration, resource separation and compatibility across profiles |
| Acceptance | Setup, build where applicable, representative run and smoke checks | Baseline comparison, affected regressions and runnable entry |
| Scope | Code/configuration/material outputs and relevant external constraints | Exact migration boundaries, protected edits and rollback needs |

Consider applicable rows, but do not ask for facts already present in code,
project policy or the conversation. Mark irrelevant topics as not applicable
with a reason. Missing documentation does not make a known code fact unknown.

## Conversation sequence

1. Summarize the inspected state and the architectural problem.
2. Ask the few answers that change the reference choice, module boundaries or
   compatibility. Recommend a concrete option with its material tradeoff.
3. Ask about plausible upcoming iterations that could justify extension seams.
   Do not invent a roadmap, microservices or future consumers for the user.
4. Resolve document language and user-facing locale separately when unset; source
   formats and comments follow the selected engineering contract. Prior explicit
   policy or scoped delegation can settle these; defaults remain labeled as defaults.
5. For selected environments, resolve deployment/configuration/data boundaries and
   which acceptance requires actual remote effects versus local evidence. Do not
   silently add production access, an environment or a new review gate.
6. When development material stays private, settle its storage, local native entries,
   independent public build/run and any selected export checks before writing records.
   Local preparation and remote publication are separate effects; reuse existing answers.
7. Show the selected reference tree, capability choices, necessary deviations, write scope and runnable
   acceptance. Resolve remaining consequential choices together and proceed on
   existing authorization; routine filenames/defaults need no additional approval.

Normally batch two or three related questions. Use the available native question
mechanism; continue independent investigation while waiting. Silence does not
settle a choice. Reopen only decisions changed by new evidence.

## Decision record and entry condition

A compact record contains topic, value/scope, origin/evidence, status and affected
work. Distinguish observed facts, explicit answers, delegated choices and disclosed
defaults. Status can be settled, pending, deferred or not applicable.

Deferred items must not be prerequisites of the current implementation. A required
runtime dependency or unresolved compatibility change cannot be deferred while
claiming the resulting project will be runnable.

Implementation starts when the actual architectural scope, preserved behavior
and executable acceptance are settled. This may already be satisfied by the user's
request and existing project contracts; do not ask for the same authorization again.
A read-only assessment ends with its proposed delta and evidence.
