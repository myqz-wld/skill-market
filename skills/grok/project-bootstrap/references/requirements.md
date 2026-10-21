# Confirm architecture requirements

Use inspection evidence to settle the architecture and engineering conventions
needed for a runnable project. A project convention governs later changes; a
task-local choice governs only the current work. Preserve settled decisions and
scoped delegation. Use the following topics to find consequential gaps, not as a
mandatory questionnaire or a requirement to add policies.

## Coverage

| Topic | New scaffold | Existing architecture change |
|---|---|---|
| Outcome | App, CLI, library or other actual deliverable; minimal runnable entry | Specific coupling/boundary problem and desired improvement |
| Constraints | Required runtime/framework, dependencies, environments and interfaces | Native constraints, consumers and compatibility obligations |
| Ownership | Responsibilities and data boundaries needed now | Current versus proposed owners and dependency direction |
| Capabilities | Reference parts needed now, omitted, conditional future or unresolved | Actual capability/dependency gaps and justified additions/removals |
| Evolution | Likely next iterations and justified extension seams | Concrete change patterns or new consumers driving a split |
| Behavior | Runnable foundation and its acceptance within the requested outcome | Public behavior, domain rules and data to preserve |
| AI engineering | Actual coding tools, shared AGENTS.md, conditional Claude import/additions, protected acceptance and native check/record owners | Preserve authored rules and scope while consolidating shared instructions; identify missing native integration or enforcement |
| Documentation retrieval | Task-oriented entry, approved search corpus and native lookup/maintenance tools | Preserve useful docs navigation; resolve demonstrated discovery gaps, stale routes and source-authority conflicts |
| File/context policy | Source language/formats, document/comment language, size budgets and exceptions | Preserve native warn/block/off settings and applicable policy owners |
| Product text | UI/CLI locale when user-facing text exists | Preserve established locale and resource ownership |
| Privacy | Allowed context/data, private configuration, synthetic examples and actual package exclusions | Preserve working secrets, inspect changed artifacts and resolve specific exposure risks |
| Publication boundary | Public/private repository mode, publishable materials, internal record root and visibility of native AI entries | Tracked/history exposure, public-to-private references, existing export ownership and migration scope |
| Environments | Actual profiles, deployment units, precedence, secrets/data isolation and intended run/deploy effects | Preserve effective configuration, resource separation and compatibility across profiles |
| Acceptance | Setup, build where applicable, representative run and smoke checks | Baseline comparison, affected regressions and runnable entry |
| Scope | Code/configuration/material outputs and relevant external constraints | Exact migration boundaries, protected edits and rollback needs |

Apply the coverage to the inspected project; ask where a missing decision changes
the proposed work or a lasting contract. Reuse code, policy and previous answers.
Missing documentation does not make a known code fact unknown.

## Conversation sequence

1. Summarize the inspected state and the architectural problem.
2. Ask the few answers that change the reference choice, module boundaries or
   compatibility. Recommend a concrete option with its material tradeoff.
3. Ask about plausible upcoming iterations that could justify extension seams.
   Do not invent a roadmap, microservices or future consumers for the user.
4. Resolve missing conventions that materially affect implementation or future
   maintenance. Establish their scope and owner; distinguish proposed defaults
   from user decisions.
5. For selected environments, resolve deployment/configuration/data boundaries and
   which acceptance requires actual remote effects versus local evidence. Do not
   silently add production access, an environment or a new review gate.
6. When development material stays private, settle its storage, local native entries,
   independent public build/run and any selected export checks before writing records.
   Local preparation and remote publication are separate effects; reuse existing answers.
7. Present the proposed tree, capability choices, deviations, write scope and runnable
   acceptance. Distinguish supported decisions from recommendations still awaiting an
   answer. Confirm the unresolved requirements before applying the design; reuse prior
   answers and delegated decisions without a duplicate approval step.

Normally batch two or three related questions. Use the available native question
mechanism; continue independent investigation while waiting. Silence does not
settle a choice. Reopen only decisions changed by new evidence.

## Decision record and entry condition

A compact record contains topic, value/scope, origin/evidence, status and affected
work. Distinguish observed facts, explicit answers, delegated choices and disclosed
defaults. Status can be settled, pending, deferred or not applicable.

A default settles only an implementation detail within the agreed direction. If a
choice changes what will be built, its architectural/data/operating boundaries or
acceptance, identify the supporting user decision, project contract or scoped
delegation. Being reversible, small or easy to implement does not supply that basis.
An agent-authored plan and a reference architecture remain proposals until supported.

Deferred items must not be prerequisites of the current implementation. A required
runtime dependency or unresolved compatibility change cannot be deferred while
claiming the resulting project will be runnable.

Implementation starts when the consequential choices, preserved behavior, write
scope and executable acceptance have that basis. Otherwise ask focused questions
and wait before changing the target, including setup files and development records,
or installing dependencies. Permission to implement does not answer an unresolved
requirement; announcing an assumption does not turn it into a user decision.

The request, existing contracts or explicit delegation may already settle the
approach. In that case proceed without a redundant approval. A read-only assessment
ends with its proposed delta and evidence.
