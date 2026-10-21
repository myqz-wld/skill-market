# Inspect the actual project

Begin with the supplied target and requested architectural problem. Inspection
precedes questions and writes; a repository tree alone is not an architecture model.

## Existing project

Read applicable instructions and working changes first. Preserve authored additions,
uncommitted code and local configuration. Separate this skill's resources from the
target, and distinguish generated files from their canonical sources.

Trace the smallest set of code paths that explains the requested change:

| Concern | Concrete evidence |
|---|---|
| Runtime | Actual application/CLI/library entry, native runtime and package files |
| Composition | Configuration loading, dependency construction, startup/shutdown |
| Ownership | Module roots, responsibilities, public exports and data owners |
| Dependencies | Actual imports/calls, shared consumers, cycles and framework constraints |
| Behavior | Relevant public contracts, callers and observable behavior to preserve |
| Tooling | Real build/start/import/test commands and any generation owners |
| AI workflow | Actual coding tools, shared AGENTS.md and tool-specific entries/imports, module scopes, duplicate/conflicting rules, native loading and effective review/permission rules |
| Knowledge retrieval | Task routes, permitted public/internal search roots, code-adjacent docs, current/draft/history markers, working search and index freshness checks |
| Publication | Public/private repository roles, tracked versus local native entries, internal record destinations, export inputs/ownership and references crossing the boundary |
| Language and size | Source/file formats, document and UI/CLI language, context/file budgets and actual enforcement |
| Environments | Deployment units, non-secret config schemas/precedence, isolated data/resources and secret-source boundaries |
| Working state | User edits, existing failures, missing prerequisites and protected paths |

Start from known paths/symbols. Read relevant complete sections around search
matches, expand only when evidence is insufficient, and include hidden native
configuration where relevant. Do not equate an empty scoped search with absence
from the whole repository.
Trace a real project question from the knowledge entry to its applicable source.
Check native search exclusions and source authority instead of preloading all docs
or treating an index result as a complete inventory.

Prefer schemas, synthetic examples and key names when inspecting configuration.
Do not dump credentials, private datasets or unrelated diagnostics into model context.
Identify where access is actually restricted and where protection is only documented.
Trace one typical module change to assess context needed, verification available and
shared files/resources that could impede independent work; report observed evidence.

Run safe relevant baseline checks after inspecting their effects. Use temporary
data/processes when needed; never restart or replace a live application to obtain
a baseline. Record actual commands/results and distinguish unavailable checks
from executed failures.

Classify findings as observed facts, documented contracts, user decisions or
uncertainties. Current source may contradict old architecture prose; trace that
difference rather than treating document age as automatic authority.

## Empty or new target

Check available instructions, supplied starters, native constraints and the intended
location. Record that no code or baseline exists. Do not create a temporary project
or install a framework merely to avoid asking a consequential stack question.

Investigate a supplied starter read-only where possible. An exploratory install
or executable probe needs scope and runtime permissions covering its effects.

## Inspection result

Keep a compact map with:

- Entry/composition paths and the runtime they actually use.
- Real modules, public boundaries, dependency direction and preserved behavior.
- Baseline commands/results and user work that must remain intact.
- The architectural problem, candidate reference mapping and unresolved choices.

Reuse existing project records; a short conversational summary may be sufficient.
Do not generate a documentation inventory or new registry merely to record that
files were inspected. An assessment remains read-only.
