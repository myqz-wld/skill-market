@AGENTS.md

# Claude-specific instructions

{{Use only when the target project uses Claude. Populate its CLAUDE.md beside
AGENTS.md; preserve an existing supported location and adjust the relative import
if necessary. Keep the import as a plain line outside code spans or fences.}}

{{When native instructions are private local outputs, maintain this body at the
selected internal source and materialize it at its native destination. Resolve the
import relative to that destination. Shared record/visibility rules and sync commands
are owned by the shared project instructions, not duplicated here.}}

{{Preserve and fill only actual Claude-specific instructions: project workflow,
tool/skill usage or pointers to existing native settings/hooks where relevant.
Common architecture, commands, language, privacy and acceptance rules belong in
AGENTS.md. Do not copy them here or silently override them with a conflicting rule.
Executable settings/hooks stay in their native configuration; prose is not enforcement.}}

{{Remove these notes and unused sections before delivery. If no Claude-specific
instructions apply, keep only the import.}}
