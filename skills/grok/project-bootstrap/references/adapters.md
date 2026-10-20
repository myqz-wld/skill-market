# Optional development-agent integration

Enable only when selected. Choose its source path and ownership after inspecting
native tool directories; .agents/ is a recommendation, not ownership of everything
already there. Preserve existing entries/settings and user-selected alternatives.

## Sources and navigation

Shared facts and procedures stay in docs or native sources. Agent resources
contain execution rules, task navigation and explicitly selected integrations.
An access summary records confirmed authority; it cannot grant permissions.
Product LLM prompts and evaluations stay in product modules.

Use an existing entry or a short source README linking conventions and the role
map. Put retrieval instructions in the existing core rule file; use
`assets/templates/agent-rules.md`. Add `assets/templates/task-map.md` only when
an independent map is useful; otherwise keep a few task rows in the existing entry.
Rows reference manifest/equivalent role ids, not a second list of absolute paths.
Read `references/retrieval.md` for task scope, exclusions and historical authority.

Reuse the entry/context policy or choose a suitable advisory guideline. A
100-line target may suit a small entry; do not ask about the number unless it
creates a real conflict or a new blocking gate.
Include eager imports in the startup total. Refer to detailed files on demand,
rather than eagerly concatenating the entire knowledge base.

## Native adapters

Verify selected tools' supported entries, imports, discovery and configuration from
local/current official documentation. Preserve each adapter's native contracts.

- **agents-md:** readable shared instructions and explicit reading links.
  Authored AGENTS.md may remain canonical; generate only owned content if selected.
- **claude:** use a regular CLAUDE.md starting with `@AGENTS.md` when sharing
  AGENTS.md. Keep tool-specific configuration separate, without conditional
  provider chapters in shared instructions. Preserve authorized native additions.
- **grok:** verify its native entry/configuration; produce an explicit adapter,
  not a renamed Claude configuration or assumptions about its tools.

If verification is unavailable, complete independent structural work and report
the missing adapter verification. Do not invent loading or permission behavior.

## Synchronization and removal

Provide ai-sync only for derived outputs; register source/output ownership.
Deterministic generation preserves authored additions, uses compatible provenance
markers and detects unexpected changes. Authored entries need an agreed merge,
not automatic replacement. Repeat generation to check ownership and consistency.

MCP connections, hooks and trust/permissions are separate opt-in choices. Inspect
live contracts, keep secrets external and preserve unrelated settings.

Agent validation is separable from human core checks. Verify enabled adapters;
test intentional removal in an isolated fixture by disabling integration and
removing only owned entries/sources. Shared docs must not require agent-only files
as knowledge or evidence. Never use this workflow to activate product features.
