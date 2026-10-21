# Private development and public delivery

Select this capability when development records or AI tooling details must stay
private while source or artifacts are shared. Implement the selected mechanism in
the target project; a recommendation in this skill is not a lasting project control.

## Settle the visibility contract

Reuse existing decisions. Ask only unresolved choices that change exposure:

- Which source, contracts and user/developer documentation may be public? Are AI
  instructions themselves public, or must tool names and workflow details stay private?
- Is this a private repository, one public repository with local private material,
  or a private development repository exporting to a separate public repository?
- Which existing location owns internal material, and which records must be shared
  with private collaborators? Choose one configurable private root when absent.
- What public output is needed now: source tree, package, site, image or binary?
  Identify existing published history/artifacts separately from future exports.

Default to the established normal layout when no separation is requested. Do not
move instructions or add an exporter just because a repository could be public.
Record the selected destinations and commands in the project's own instruction or
internal development authority. No other skill or custom planning format is required.

## One internal source boundary

Example for private source plus a public export; names are configurable roles:

```text
src/, tests/, native build/config files   # public; work without internal files
README.md, docs/                         # only material selected for publication
.private/                               # private development sources
  README.md                             # internal entry: rules, routes, commands
  instructions/
    AGENTS.md                           # canonical common instruction body
    CLAUDE.md                           # conditional Claude-specific source
  plans/                                # plans, tasks, handoffs, reviews and archives
  tools/                                # real local setup/sync/check/export commands
AGENTS.md                               # local generated native entry; untracked
CLAUDE.md                               # local generated entry when used; untracked
```

Create only useful files. Internal specifications, decision rationale, knowledge
indexes and diagnostic evidence belong under the same private root when not public.
Keep public contracts and runnable checks outside it. A module's public contract
can stay beside its code; private AI notes belong inside the internal boundary.
The private root is not a secret vault: credentials and unrestricted raw logs do
not become safe to commit or send to a model just because the repository is private.

In a private source repository, internal sources may be tracked there. In a public
repository, they must stay untracked/local or in separately private storage.
Do not convert a private repository to public and assume a current-tree filter
removes its history. Confirm the intended storage/backup for shared private work.

## Native entries stay at native locations

When instruction contents must remain private, keep AGENTS.md at the project root
and CLAUDE.md beside it when used. Generate regular local files from the internal
source owner; do not move the only readable entry into a hidden directory or assume
every tool follows symlinks or Claude import syntax.

The generated CLAUDE.md uses a plain `@AGENTS.md` line followed only by Claude-specific
additions. Resolve links/imports from the generated destination, not the source's
directory. Preserve existing supported locations and module scope. If module-level
native instructions or native tool configuration must also stay private, map their
exact source/destination pairs under the same mechanism instead of leaving tracked
copies scattered through the public tree. Preserve unrelated local settings.

Implement project-owned commands with these effects:

| Operation | Required behavior |
|---|---|
| Initialize/synchronize | Validate exact source/destination mappings; create missing native entries; update only recognized generated files without losing authored changes |
| Check | Read-only comparison of sources/materialized entries, links/imports, native scope and Git/public-input membership; fail clearly on drift or unexpected tracked entries |
| Recover an authored edit | Preserve the local change privately, reconcile it into its canonical owner, then regenerate; never silently overwrite a divergent entry |

Mark materialized files as generated with their actual source and update command.
Store mapping/generation state inside the private root when needed. Refuse path
traversal, symlink redirection and overlapping destinations; do not overwrite an
existing authored file merely because its name matches. Verify each selected tool's
loading separately; existence/import resolution alone does not prove it loads.

Exclude local native outputs with `.git/info/exclude` or the repository's existing
local exclusion mechanism. Keep these rules out of a public .gitignore when the
user wants tool usage hidden. Ignore rules neither untrack existing files nor
exclude them from arbitrary archives. Preserve current authored content before
changing its owner/tracking; do not delete working files to stop tracking them.

A fresh private clone needs its documented internal setup command before development.
Keep instructions for that command in the private repository's internal entry or
private onboarding channel, not a public README link. Changes to instruction sources
must regenerate/check outputs through the actual workflow. If native hosted tooling
requires tracked configuration, keep it public-safe, configure the private service
separately, or explicitly resolve the export exception; do not claim a one-directory
filter while relying on additional tracked private files elsewhere.

## Public content cannot depend on internal content

Allow internal records to reference public source. Forbid the reverse direction:
public documents, source, imports, scripts, package metadata, CI, build/config files,
symlinks and generated indexes must not reference files under the private root.
Do not leave a broken link, internal filename, private command or source-map pointer
in public material after excluding its target. Public knowledge indexes contain
only public sources; internal indexes stay inside the private root and may include
approved public and internal development material.

Keep product build/test/run commands public and self-contained. Private workflow
checks can call public checks; public checks cannot require the private tooling.
Use existing tools plus targeted checks for the selected formats. Detect the actual
private-root paths, native output mappings and relevant encoded/relative forms;
inspect dynamic configuration and generated outputs where static search is limited.
Moving everything to a hidden directory or scanning one spelling is not proof of isolation.

## Prepare an isolated public snapshot

Implement or reuse a project-owned local export command with explicit input revision
and output directory. Prefer a selected committed Git tree, filtering the single
private source root; untracked native entries are absent from this input by design.
Reject unexpected tracked private/native outputs outside the root. If uncommitted
source is needed, use an explicitly selected, identified snapshot rather than
silently including the entire working directory or silently omitting user changes.

Never copy `.git`, local credentials, caches, private generated entries or unrelated
worktree files. Resolve the snapshot and validate all output paths before writing;
refuse overlapping source/private/target paths, escaping symlinks and a nonempty
unowned destination. Prepare a fresh output outside the source repository and
existing public checkout. Preserve source permissions and required native files;
handle submodules/LFS deliberately if present instead of claiming missing content
was exported. Keep the selected baseline and inventory evidence private.

Run public setup/build/test and representative execution from that isolated tree,
without private files or private environment hooks. Build distributable artifacts
there where practical. Inspect actual archive members and relevant contents,
source maps, debug paths and metadata; package exclusion is separate from Git
exclusion. Do not copy a previous private build into public output without checking it.

## Separate public repository and existing history

Make source ownership and update direction explicit. Public changes/contributions
must be deliberately reconciled into the development source; they are not permission
to replace private work or silently overwrite public-only files.

For a new public repository, use a clean exported snapshot, not the private Git
object database, branches or tags. For an existing public repository, prepare an
ordinary content diff on its own history. Maintain exact export-owned paths so
later updates can remove stale exported files without deleting public-only files
or unrelated edits. Do not mirror refs, force-push or share private commit messages.

Preparing a directory/diff is local work. Creating/updating a remote repository,
pushing, changing visibility or rewriting history requires authorization for those
effects. A known historical exposure must be reported with masked evidence; current
file removal does not clean commits, tags, releases, caches or distributed copies.
Do not promise historical cleanup from a forward export or rewrite history implicitly.

## Acceptance and ongoing development

Verify the actual project mechanisms with synthetic data in disposable fixtures:

- Fresh private setup produces the native entries with correct scoped rules;
  drift is detected and edited/foreign files are preserved during sync.
- A later session can find architecture, lookup, current tasks, record destinations
  and real commands using only the target project's files.
- Boundary checks reject a public document link and a build/script dependency on
  internal content, an accidentally tracked native entry and relevant leaked output.
  Valid public-only content passes. Restore fixtures after testing.
- The real export excludes internal sources, local native bindings and Git metadata;
  its links resolve and its actual build/check/run paths work without private content.
- Repeatable export/sync does not overwrite unrelated source, public-repo or local
  edits; public-only files and owned deletions follow the settled ownership contract.

Write lasting rules into the project: new plans/tasks/reviews/handoffs and archives
use its selected internal roots; new native bindings/artifacts update the actual
mapping and checks; moving a record repairs only visibility-compatible links;
exports run the real boundary and runtime checks. Provide exact working commands,
not proposed command names. Keep all of this usable without reopening this skill.
Report native loading, source filtering, reference checks, artifact inspection,
isolated execution and any historical/publication work as distinct evidence.
