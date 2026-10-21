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

## Discover, propose and revisit

Start with the outcome in use: the actors or consumers, a representative workflow,
what enters and leaves the system, what state must survive, and observable success.
For a refactor, trace the existing workflow and the change pressure. Inspect known
facts first; ask for concrete examples when the request leaves architectural choices
open. Keep exploration at the depth needed for ownership and acceptance, without
turning setup into an exhaustive feature specification.

Use those facts to select the reference and compare meaningful alternatives. Explain
how each unanswered choice affects a boundary, contract, operating condition or check.
Do not ask the user to approve a complete technical package before establishing its
premises. Keep independently changeable decisions independently answerable; a reply
to one choice does not settle the others. Use manageable batches through the available
native question mechanism, with no fixed number of questions or rounds.

After each answer, revisit applicable coverage and its dependencies. Separate settled
choices from remaining assumptions, unsupported proposals and conditional future work.
Ask the next questions that could still change the design. Reuse existing decisions
and delegated choices; do not reopen them merely to complete a checklist. Silence
settles nothing, and a completed question batch is not a completeness test.

Resolve consequential engineering and material choices alongside the design: their
scope and owner, the target's actual coding tools, selected environments, record
visibility and required native entries. An unknown condition is not evidence that a
conditional output is unnecessary. Reuse project evidence; ask only when the remaining
uncertainty changes the output or its acceptance. Keep local preparation separate from
remote deployment/publication authorization.

## Architecture proposal and discovery completion

Use a concise conversation or existing record to connect:

- Supported needs and constraints to selected capabilities and reference roles.
- Those roles to concrete owners, public boundaries, dependency direction and runtime
  composition; explain useful combinations and deliberate omissions.
- Representative use and relevant failure to observable acceptance; identify required
  prerequisites and the contracts that must remain stable.
- Actual extension pressures to current seams or conditional evolution triggers.
- Selected engineering materials to their project owners, native entries and checks.

A simple project can express this in a few paragraphs. A substantial one may need a
map or table. Neither a technology list nor a directory tree alone explains the design.
Trace the proposed owners against use and change scenarios; if the trace needs another
consequential assumption, return to that question before applying the design.

Exploration is sufficient when the selected scope can be implemented and accepted
without silently deciding another architecture-driving requirement. Needed-now
capabilities must have their dependencies covered; deferred items must not be current
prerequisites. Unknown future needs may stay conditional, with an extension trigger
rather than speculative modules. No roadmap, document count or interview length is
required. Continue only independent inspection while necessary answers are pending.

## Decision record and entry condition

A compact record contains topic, value/scope, origin/evidence, status and affected
work. Distinguish observed facts, explicit answers, delegated choices and disclosed
defaults. Status can be settled, pending, deferred or not applicable.

A default settles only an implementation detail within the agreed direction. If a
choice changes what will be built, its architectural/data/operating boundaries or
acceptance, identify the supporting user decision, project contract or scoped
delegation. Being reversible, small or easy to implement does not supply that basis.
An agent-authored plan and a reference architecture remain proposals until supported.

Implementation starts when the consequential choices, preserved behavior, write
scope and executable acceptance have that basis. Otherwise ask focused questions
and wait before changing the target, including setup files and development records,
or installing dependencies. Permission to implement does not answer an unresolved
requirement; announcing an assumption does not turn it into a user decision.

The request, existing contracts or explicit delegation may already settle the
approach. In that case proceed without a redundant approval. A read-only assessment
ends with its proposed delta and evidence.
