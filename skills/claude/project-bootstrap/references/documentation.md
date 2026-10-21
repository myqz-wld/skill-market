# Find and maintain project knowledge

Give later AI sessions a repeatable way to find the authoritative material for a
task without preloading the documentation tree. Apply this to the target project's
documents and code-adjacent module cards. Preserve its existing documentation system,
language, native instruction mechanism and approved search boundaries.

## Retrieval surface

Use shared AGENTS.md to point to the project knowledge entry and its lookup procedure;
tool-specific entries load those shared rules through their supported mechanism.
A small project's README can own the public knowledge map and lookup procedure. When topics become
hard to locate, use the existing docs landing page or a task map such as docs/README.md.
Split that map by actual component/topic only when a single map becomes hard to scan.
Keep the root route short; topic indexes are read on demand, not automatically imported.

Publication visibility and read permission are separate. Approved internal development
documents can be read by the development AI while remaining excluded from public
outputs; secrets and unrelated private data remain outside the search corpus.
In a separated project, use an internal task map for plans/handoffs and private rules.
Public maps/indexes cover only public sources and cannot reference the internal root.
Internal maps may reference both approved internal records and public authorities.

Route by the question being answered, not just document filenames. Each useful row
identifies a task/topic, searchable domain terms or code symbols, the current owning
document/section and supporting code or records. For example:

| Task | Terms or symbols | Current authority | Supporting evidence |
|---|---|---|---|
| Change environment selection | environment, profile, APP_ENV; aliases in the project's language | The actual configuration guide's precedence section | Config loader/schema and focused tests |
| Extend a module | Module name and its public API | The real module card / architecture section | Export entry and contract tests |
| Resume a migration | Task identifier and affected module | The exact active task record | Its baseline, current diff and next check |

Replace example roles with existing paths and meaningful local terms. Route to
distributed module docs where they live; do not copy every fact into a central wiki.
Keep the purpose and component visible in titles/headings. Reuse native metadata or
a short opening statement for document kind, applicability and meaningful state:
current guidance, draft proposal, accepted decision, active plan, completed record,
or superseded material. Do not require a new frontmatter schema for every document.

Distinguish authority by the question: requirements/decisions state intended behavior;
current code/configuration and checks establish implementation. A completed plan is
task history, and a draft is not an approved requirement. An older accepted decision
may still govern the design. Compare applicability and actual implementation when
sources disagree; do not choose by newest timestamp or highest search rank alone.

## Lookup procedure

1. Identify the question, component, runtime/environment and known symbols or task
   identifiers. Read applicable native instructions and the relevant task-map row.
2. Follow an exact current-source route when available. Otherwise enumerate permitted
   documentation files and search likely component roots using names, aliases and
   code identifiers. Start with filenames or short matching lines, not whole files.
3. Open the relevant complete section and its qualifications. Follow the necessary
   contract/code/test or decision evidence. A search excerpt alone is not the rule.
4. Check document kind, scope and status. Follow an explicit replacement for superseded
   material; report missing, cyclic or conflicting replacement routes rather than
   inventing a current source. Read history when the question needs rationale or
   resumption, including still-applicable decisions linked from current guidance.
5. If evidence is insufficient, broaden to other approved roots or aliases, then
   relevant historical records. Inspect native ignore/discovery rules and explicitly
   approved hidden development roots when needed. Keep secret stores and unapproved
   data excluded at every step; do not publish internal search results or indexes.
6. Retain the source path/section or symbol, applicability and concise finding in the
   working task. Stop retrieving when the decision is supported and material conflicts
   are resolved; do not copy all matched documents into the plan or session.

Record search scope and distinguish no matches, partial/truncated output, excluded
files and tool errors. An index miss is not evidence that a document does not exist;
fall back to permitted source-file discovery. A partial search does not establish
repository-wide absence. Never silently turn a search error into an empty success.

## Native search commands

Use existing documentation search first when its corpus, freshness and permissions
are understood. Otherwise scoped filename/text search is a sufficient local starting
point. Supply actual runnable commands in the target's instruction/knowledge entry;
use the project's existing task system if a reusable wrapper is justified.

These examples assume docs/ is an approved public Markdown root, with private/ excluded
and archive/ deferred during current-guidance lookup. Adapt and run them against the
actual roots, file types and exclusions; module documentation may live outside docs/.

```sh
rg --files docs -t markdown -g '!**/private/**' -g '!**/archive/**'
rg -l -i -F -e 'environment' -e 'profile' -e 'APP_ENV' docs -t markdown -g '!**/private/**' -g '!**/archive/**'
rg -n -F -e 'APP_ENV' -e 'precedence' docs/runtime/environments.md
```

Add useful native-language aliases when the source vocabulary differs from the task.
For a selected internal development root, provide a separate verified local lookup
over its authorized docs/records. Hidden or ignored directories may need explicit
paths/flags; constrain them to those roots rather than disabling all exclusions.
Keep internal commands and results in the internal entry/records, never public docs.

Preserve the intended ignore behavior: positive rg glob filters can override ignore
files, while an explicitly named file bypasses discovery filters. Use type selection
and explicit exclusions; verify the exact source is within the authorized scope
before an explicit-file fallback.
For rg, exit 1 means no match within that invocation's scope; exit 2 indicates an
error. Preserve that distinction in any wrapper. Treat terms as literal arguments
unless regex is intended; pass values safely instead of constructing executable
shell fragments. If rg is unavailable, use available native equivalents.

Expose matching paths/sections and enough context to locate the source. For large
result sets, narrow by component, record kind or status; if a tool limits output,
state the limit and continuation path. Do not treat a printed first page as complete.
Avoid broad unrestricted searches, following unapproved symlink targets or using
private logs/configuration as a convenient searchable corpus.

## Scaling and lifecycle maintenance

Keep a small task map curated around real work. When file counts/change frequency
make manual discovery unreliable, reuse native docs navigation or add a deterministic
catalog generated from approved files' paths, titles, kinds, topics and status.
Keep executable values and full facts in their source owners. A derived catalog
must not invent summaries, approvals or freshness from file modification times.

Use one metadata owner. Generated catalogs have an in-file generated/source marker,
an actual regeneration command, stable output and a check for drift. Fit generation
and link/source checks into the existing task/CI system where selected; only claim
enforcement for checks actually run. A generated file must not index itself or
unapproved data. A public index excludes all internal material; an internal index
can include approved development records and stays private with them. Reuse source
metadata instead of introducing a parallel registry.

Maintain discovery in the same change as the source:

| Source change | Required maintenance |
|---|---|
| Add a topic or module | Give it a clear purpose/owner and useful searchable terms; add a route when it answers a new task, refresh the native catalog if present |
| Change a current contract | Update its authority and affected code/tests; retain meaningful rationale rather than conflicting copies |
| Move/rename a file or heading | Repair affected inbound/outbound links, source pointers and task routes; regenerate derived navigation |
| Supersede guidance | Mark old applicability and link the current replacement; update current task routes and check replacement chains |
| Complete/archive a task | Preserve outcomes and evidence, update active-task routes and moved links; keep history discoverable without presenting it as current policy |
| Remove material | Check remaining callers/references and preserve required rationale; remove stale navigation entries |

Use existing native link/metadata validation. Where automation is selected, check
required routes, paths/anchors, declared replacements and generated drift; avoid
adding a general document-management framework to enforce a handful of local facts.

If lexical search and topic routing still fail on demonstrated tasks, an existing
semantic search system may complement them. Settle corpus/data access and any new
service effects before adding one. Preserve source locations, refresh/deletion
behavior, stale-index reporting and a local source-search fallback. Search ranking
or generated summaries cannot replace reading the authoritative source.

## Retrieval acceptance

Exercise representative questions from the actual project, such as finding config
precedence, a module's contract or the active migration's next step. Start from the
native entry with only the question and known task facts; record queries, sources
read and the applicable answer. Include an alias/symbol query that differs from the
filename, and verify relevant module docs outside the central docs root when present.

Verify changed lifecycle paths: a renamed section remains reachable, superseded
guidance leads to its replacement, and an archived plan does not become current
policy. Exercise a no-match and a failed/partial search without claiming absence.
Use synthetic fixtures to check that approved internal development records remain
discoverable locally and absent from public routes/indexes. Check secret/unapproved
source exclusions without reading real private data. Distinguish search exclusion
from an enforced read-permission barrier.

If an index generator/check was added, verify an added/moved source makes the old
index stale, regeneration repairs it and a repeated unchanged run is stable. Native
link checks should detect a representative broken route and pass after repair.
Measure files/sections read and elapsed time only when observed; this is retrieval
evidence, not a general claim about model context capacity or reasoning quality.
