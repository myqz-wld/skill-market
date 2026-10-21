# Verify runnable architecture

Use native tools after inspecting command effects. Verification is part of delivery,
not an optional report after generating directories and documentation.

## Required execution evidence

| Delivery | Check | Evidence |
|---|---|---|
| Both | Declared runtime/dependencies/configuration and native tasks agree | Actual versions/setup used, required local configuration and working commands |
| Both | Native build/type checks where applicable | Executed command and result; an inapplicable build has a concrete reason |
| New app | Actual startup and a representative readiness/request path | Observed response/behavior, relevant process result and cleanup |
| New CLI | Actual executable invocation | Exit status and meaningful output |
| New library | Consumer import/API call | Public entry resolves and performs the minimal intended operation |
| Refactor | Affected runtime path still works | Same observable behavior or explicitly agreed compatibility change |
| Refactor | Relevant regressions and changed boundaries | Baseline comparison, caller/import/configuration checks and test results |

Use the rows appropriate to the actual delivery type. A content repository validates
its real generation/tooling workflow; do not create an artificial server. A scaffold
needs a focused smoke check that can detect broken wiring, not a business feature suite.
Add meaningful regression coverage for an important refactored boundary when missing.

Use isolated test data and task-owned temporary processes. Preserve existing user
services and live applications; clean up only the resources created for verification.
Do not deploy, publish or mutate production data as part of ordinary local acceptance.

## Architecture checks

- Selected capabilities and reference roles map to actual owners, public APIs and
  dependency directions. Combined roles retain their constraints; omissions have
  scope reasons. Check the requirements behind the design as well as the file tree.
- Cross-module consumers use public boundaries; imports/composition do not create
  forbidden core-to-infrastructure dependencies or cycles.
- Configuration, native discovery, callers, build/start tasks and generated-source
  ownership remain correct after moves.
- Conditional evolution guidance names real owners, extension points, observable
  triggers, compatibility constraints and verification.
- Representative use, plausible change and relevant failure can be traced through
  concrete owners and checks without unresolved architectural decisions or
  unjustified change propagation.

A diagram or directory tree alone proves none of these properties. Inspect actual
code and use existing dependency checks when applicable; do not introduce a custom
architecture checker merely to produce a passing command.

## AI engineering and environments

- Check selected source formats, document language, UI/CLI locale and comment/identifier
  conventions against their actual project owner. Exercise visible text where relevant.
- Check authored-file/context budgets with the configured exclusions and severity.
  Native rule enforcement, manual inspection and advisory exceptions remain distinct.
- Preserve requirement-derived acceptance, golden data, released migrations and other
  owned paths. Review any expectation changes against the authorized requirement;
  do not accept weakened checks as a fix for a regression.
- Run actual focused/fast/full tasks as selected. For a native architecture/privacy/
  protected-path rule, demonstrate a relevant violation is detected and a valid case
  passes, where safely testable. Configuration alone is not enforcement evidence.
- Verify fresh-session/resume inputs are discoverable: native instructions, module
  facts, current task state, decisions, preserved contracts and the next check.
- Compare delivered native entries with the target's selected coding tools; an
  unsupported or unknown selection is not a reason to claim integration complete.
  Check AGENTS.md exposes common project rules from the selected canonical owner.
  For targets using Claude, verify CLAUDE.md has a real, correctly resolved import outside code spans/fences and only
  Claude-specific additions. Preserve authored rules/module scope, check for conflicting
  duplicates or circular imports, and inspect effective loading per selected tool.
- Verify project-only continuity: without the installed skill/resources, locate the
  architecture, record roots, lookup and real check commands from native instructions.
  For private generated entries, exercise initialization, drift detection and
  preservation of authored edits; verify Git/public inputs exclude those local outputs.
- For each selected environment, verify selection/precedence, required configuration,
  isolated data/resources and safe diagnostics with synthetic values. Unknown profiles
  must not silently select production or another environment.
- Inspect actual artifact inputs/members and applicable generated metadata for private
  data when packaging/build output is in scope. Check public build variables separately
  from runtime settings and secrets; a Git ignore pattern is not sufficient evidence.
- Distinguish native instruction loading, local/hook/CI checks, configuration readiness
  and actual deployed-environment verification. Required unverified controls leave
  their delivery claim incomplete; do not label an unavailable check as passed.

For a selected public/private boundary, reject public-to-internal document links and
code/script/configuration dependencies, including derived navigation and relevant
artifacts. Run the actual isolated export and its build/check/representative entry
without internal files. Inspect actual distribution contents and distinguish clean
snapshot evidence from existing-history or remote-publication claims.

## Documentation retrieval

- From the native entry, find applicable sources for representative project questions
  using task routes and working scoped search. Include aliases or code symbols and
  code-adjacent docs where present; record actual queries, sections read and limits.
- Distinguish current guidance, proposals, active/completed tasks and applicable
  decisions. Verify superseded sources lead to the correct replacement; unresolved
  conflicts or broken/cyclic replacement chains must remain visible.
- After affected moves, heading changes or archival, verify task routes, local links
  and source pointers still resolve. For selected automation, show a stale index or
  broken route is detected and passes after regeneration/repair.
- Check no-match, search failure and partial/truncated results are distinguished.
  An incomplete index or excluded root cannot justify a whole-repository absence claim.
- Verify selected search/index boundaries with synthetic inputs: authorized internal
  records are locally retrievable, public indexes contain only public sources and
  secrets/unapproved data stay excluded. Filtering does not enforce secret-read isolation.

## Materials and preservation

Every delivered document must answer an actual project question with code/configuration
or observed results. Compare the applicable content of selected templates with actual
project owners: combined sections/files are valid, missing responsibilities are not.
Check runnable commands, module paths, links and source authority. A title or filename
does not prove template completion. Explain material omissions from the selected scope.
Remove unfilled placeholders, duplicate facts and generic filler. Keep proposed paths
and conditional future guidance distinct from usable current instructions.

Starting only from the project's native instructions, locate the owner and checks for
a representative maintenance or extension task using the delivered guidance. Verify
architecture/evolution authority and working source lookup without installed skill
resources. Inspect native loading separately from link resolution.
Honor document/product language and existing formatting/privacy rules; retain user
edits and avoid private machine paths, credentials or raw diagnostic dumps.

If task/history records exist, verify their state, next action and links after moves.
Do not invent records or claim a model-quality measurement from a manual walkthrough.

## Completion and blocked work

Repair in-scope failures and rerun affected checks. Separate pre-existing failures
from regressions and executed failures from unavailable checks.
Required runtime and agreed regression checks must pass before claiming completion.

If dependencies, permissions or required external systems block a check, report the
exact missing prerequisite and incomplete outcome. Do not substitute static validation
or a documentation-only result for runnable delivery.

Handoff identifies the implemented architectural delta, runnable commands, actual
results, preserved behavior, justified deviations and remaining work. Archive only
truthfully completed scope and distinguish it from the full requested outcome.
