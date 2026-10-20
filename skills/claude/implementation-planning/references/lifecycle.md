# Handoff, archive and later audit

## Find records and preserve authority

Use project-owned plan, task, review and archive conventions. No particular manifest
or another skill is required. If a new location is needed, choose a small suitable
plan root within the authorized scope; do not apply a new repository architecture.
Shared records use relative paths and portable ids. Absolute runtime paths belong
only in private tool arguments when required, not durable plan content.

Keep the current truth in one place: shared decisions/graph in the plan, task
state/evidence in each task or the selected task system, and final outcome in
closure. Live task systems need stable links and a terminal export/snapshot where
later access is not durable. Do not maintain competing handwritten status stores.

## Readiness, execution and resume

Use project-native states; their meanings must distinguish a draft, a ready plan,
execution in progress and terminal closure. A reviewed/approved plan is ready,
not implemented. Record the baseline commit or an identified content snapshot,
working-change limitations, remaining blockers and the first ready action.

A handoff identifies the plan/task, applicable shared decision references, required
input versions, permitted writes, relevant isolation/workspace identity, first file
or command to inspect, next action and acceptance evidence expected. Pass runtime
bootstrap fields required by the actual mechanism. Do not duplicate the full brief.

Create or enter isolation only when required by the user/project and authorized
under the environment's actual lifecycle tools. No isolation tool means report the
limitation or use an allowed existing workspace, not emulate unsupported controls.

On resume, inspect the requested task, current baseline and required input states.
Check drift before trusting old readiness/acceptance. Revalidate only affected
boundaries; keep unrelated accepted evidence tied to its historical baseline.
Never resume production operations or other external effects from a plan alone.

## Close honestly

Use `assets/templates/closure.md` when terminal closure is appropriate. Record the
actual outcome: implemented, partial, cancelled, superseded or planning-only.
The terms can map to existing project states.

- Implemented: required tasks accepted, overall acceptance supported by actual
  evidence, and residual issues accounted for.
- Partial: completed and unfinished scope distinguished, with a named follow-up
  or explicit disposition. Do not imply the rest is finished.
- Cancelled/superseded: reason, remaining work and replacement link when applicable.
- Planning-only: the planning artifact is closed without implementation; task
  implementation status remains unexecuted. Usually a ready plan stays active for
  handoff unless the user/project intentionally closes the planning record.

Include goal versus actual delivery, final commit/version or content identity,
task outcomes, real verification results, unverified checks, accepted residual
risks, linked follow-up work and the actual closure date. No mandatory expiry period
or cleanup schedule is invented.

## Archive the complete bundle

Once a terminal outcome is established, archive the plan, task contracts, execution
reports, shared decisions/design and durable evidence together. Do not archive only
the summary or discard unresolved-task details.

Follow existing policy. A suitable fallback is moving
`<plan-root>/active/<plan-id>/` to `<plan-root>/archive/<plan-id>/` once at closure.
Stable paths plus an archived status are also valid where the project uses them.
Do not create rolling age buckets or reorganize historical records on every edit.

Before archiving, check for active workers and unfinished writes to the bundle.
Wait for permitted work to finish or reconcile it through the host lifecycle;
never move live worker inputs underneath them. Use the existing index, or a small
plan-root index when needed, to keep an active/archive locator for each stable id.

Check archive-destination collisions, preserve bundle identity, and repair external
links/index entries affected by a move. Internal relative links should continue
to resolve; inspect both directions. If a link cannot be updated within scope,
use an allowed stable locator or report it rather than claim a clean archive.
Never overwrite another archive or delete user records automatically.

Keep useful evidence self-contained or durably linked: command/result summaries,
baseline ids, relevant diffs/hashes and artifacts needed to assess acceptance.
Do not copy raw credentials, transient logs, dependency trees or machine-specific
paths into the bundle. Hashes identify evidence but do not replace missing outcomes.

## Later review, verification or inspection

For an audit request, first identify the intended scope: what was planned, whether
it was delivered at closure, or whether it still holds on today's code. Infer it
from the request when clear; ask only if the distinction changes the result.

Read the archive locator, plan, relevant task criteria/reports and closure baseline.
Trace each claim to a decision, affected source, task and verification result.
Use `assets/templates/audit.md` if a durable report is requested/useful. Read-only
inspection can report findings without modifying the archive.

For historical verification, use the recorded version/commit/snapshot in an
isolated environment if execution is needed. A branch name or today's HEAD is not
the old baseline. Missing evidence is unknown, not retroactive success or failure.
For current verification, identify code/contract/dependency changes since closure
and run appropriate authorized checks against the current baseline. Historical
acceptance is not a current pass merely because the record exists.

Preserve original closure and task reports. Put new findings in a dated linked
audit/follow-up record with its own baseline and result. Reopening or replacing a
plan preserves the prior outcome and links the new work; do not rewrite old results
to make them look current. Repairs or new implementation require their own scope.
