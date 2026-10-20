# Task-directed retrieval and historical evidence

Use during inspection and when designing project navigation. This is a retrieval
workflow, not a requirement to add a search service, full file inventory or index.
Task examples may support later development; they do not authorize this skill to
implement the features they describe.

## Locate before reading broadly

1. Start from an explicitly supplied path, symbol or error location. Do not restart
   from the top-level index when a useful location is already known.
2. Otherwise identify the task and whether it asks for current behavior, an ongoing
   change or historical rationale. Read the role/path map and applicable task row.
3. Resolve role ids through project.yaml or the chosen equivalent. Locate the
   owning module from its map; read only its relevant summary/contracts.
4. Find candidate filenames first (`rg --files` or the native equivalent), then
   search symbols/terms within those paths (`rg -n`), then read sufficient context.
5. Expand from the target module to related modules and finally the repository
   when evidence is insufficient, or immediately when the task requires global
   impact analysis. Do not treat local results as exhaustive proof.
6. Reuse located paths and symbols within the task. Re-read after relevant changes,
   context loss or conflicting evidence; a session note is not a second authority.

Routine searches focus on maintained source, current contracts and relevant docs.
Dependency caches, build outputs, generated clients, archived plans/reviews and
scratch logs are normally outside the first search. Select exact exclusions from
real project paths. Explicitly include hidden agent directories when needed.
Open excluded paths when the task concerns generation, dependencies or history;
never silently make exclusions a completeness claim.

## One map, limited navigation

The project manifest or equivalent owns role-to-path mappings. A task map maps
tasks to those role ids plus a search cue; it does not repeat their paths or copy
their facts. Add only real recurring tasks and available roles. Tiny projects may
keep these rows in an existing entry instead of a separate file.

Use `assets/templates/task-map.md` when a standalone task map is selected. Locate
it through the entry or an optional task_map slot. Structural bootstrap checks
can verify later-development navigation without implementing any feature.

## Validity before age

Interpret the project's selected metadata/header/registry scheme. Do not impose
YAML front matter on an existing native format. If status is absent, use known
authority and context or classify the document as unknown; mtime is not proof.

| Evidence | How to use it |
|---|---|
| Current authoritative spec/contract/guide | Primary source for the relevant question, even when old |
| Accepted, unsuperseded ADR | Rationale/boundaries when related; age alone does not expire it |
| Draft proposal or active plan | Intent for that change, not evidence that implementation exists |
| Plan past its selected date/milestone checkpoint | Needs disposition before relying on its instructions; don't extend its date silently |
| Completed plan, old review or handoff | Historical evidence, normally outside routine searches |
| Superseded document | Follow the replacement link first; use the old body for history |
| Unknown/conflicting status | Report uncertainty and cross-check the contract/code/baseline relevant to the question |

For "why was this chosen", include relevant ADRs and historical records. For
"what works now", verify current implementation/contracts; an old review proves
only what its recorded baseline covered. Newer does not automatically mean more
authoritative. Date is a secondary ordering/review signal, not a universal TTL.

Historical records identify actual completion/review time and baseline commit,
version or content snapshot when making claims about inspected code. Missing
baseline means unknown current coverage. Link a replacement via superseded_by
or the repository's equivalent; check missing targets and replacement cycles.
Never refresh timestamps merely to hide stale content.

## Maintain navigation on change

When moving or replacing a source, update its role mapping and affected links.
Keep one active authority per fact; split intent from implementation explicitly.
Archive completed records in the existing location and retain useful conclusions
in the owning current document. Do not move files between rolling age buckets,
delete history or generate archival copies without a real project need.

Validate navigation with a few project-specific lookup tasks and a current/history
contrast. Record actual sources found, irrelevant reads and scope expansions.
Report observations, not a claimed search-speed gain without a baseline.
