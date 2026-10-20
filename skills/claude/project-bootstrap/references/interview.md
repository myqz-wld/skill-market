# Adaptive interview

Interview to resolve architectural choices, not to collect a full requirements
specification. Begin with what is already known and the next small question batch.
Reuse answers, repository evidence and user-authorized decisions before asking.
Conduct the conversation in the user's language.

## Decide whether a question earns a turn

Ask only when the missing answer materially changes architecture, compatibility,
data ownership, cost, scope or the user's working process, and cannot be inferred
from reliable context. Ask the highest-impact remaining question first.

- **Reuse:** existing conventions and explicit answers need no confirmation.
- **Choose:** routine, reversible details can be selected within the authorized
  scope without asking permission to recommend. Examples: native task naming,
  compact document placement, metadata syntax, a generic smoke check, or an
  advisory size/context guideline. Briefly disclose useful defaults in the blueprint.
- **Ask:** unresolved repository/service boundaries, incompatible toolchain changes,
  new dependencies/services with material cost, breaking contracts, or new policy
  gates that block work. Reuse authorization already given for these effects.
- **Omit:** unnecessary advanced controls, automatic expiry, review thresholds,
  extra CI infrastructure or integrations. Do not ask merely because they appear
  in a checklist.

Basic build/type/import correctness checks are part of scaffold verification, not
an invitation to ask about every nonzero exit. Arbitrary size/coverage/expiry gates
are different: do not silently turn a recommendation into a new blocking policy.
If no consequential question remains, present the blueprint or continue authorized
work immediately. There is no minimum question count or mandatory defaults round.

## Order and branching

Stages express dependencies, not a required number of chat turns. Skip settled
stages, combine closely related questions and revisit only decisions invalidated
by a new answer. Read-only inspection can continue while an answer is pending.

| Stage | Ask only what is unresolved | Why now / stop condition |
|---|---|---|
| 1. Scope | New scaffold or existing architecture adjustment? What structural outcome is wanted? Is this discussion, a blueprint or file changes? | Prevent feature implementation and accidental writes; do not demand a path for discussion only |
| 2. Evidence and constraints | Target directory before writing; required language/framework/platform; existing conventions; what behavior/contracts must remain stable? | Inspect an existing repository before asking what its files already answer |
| 3. Structural drivers | Broad product purpose, delivery form, independently deployed/released units, ownership and concrete reuse | Just enough domain context to choose boundaries; no feature backlog or business acceptance implementation |
| 4. Relevant capabilities | UI, external interfaces, persistence, async, actual environments, sensitive flows or package distribution? | Ask details only for capabilities that affect this scaffold; future needs may be recorded without building them now |
| 5. Engineering defaults | Select routine details from existing policy, native conventions and project scale; ask only about material exceptions | Usually internal reasoning followed by a brief blueprint summary, not another questionnaire |
| 6. Blueprint | Concrete tree, chosen values, behavior preservation, checks and deferred work | Resolve remaining consequential decisions and authorize the structural write scope once |

First-turn examples:

- Vague new project: ask its broad purpose/delivery form, existing technical
  constraints, and whether to discuss structure or generate a scaffold.
- Existing architecture: inspect supplied repo evidence, summarize what is known,
  then ask the architectural pain point and limits on moves or compatibility.
- Feature-only request: explain this skill's scope and stop its workflow. If the
  user also wants structural work, clarify that portion without accepting features.

A location, repo type or stack already supplied is not another question. Technical
experience is useful only when it changes the options or explanation needed.

## Choice ownership

For each choice distinguish:

1. **Established:** explicit user answer or applicable repository policy. Reuse it.
2. **Agent-chosen:** a routine, reversible implementation detail within scope.
   Select a suitable default and label its origin honestly; no separate delegation
   is required and it is not recorded as a user-confirmed preference.
3. **Delegated:** the user explicitly permits recommendations for this scope.
   Choose, explain and record the concrete values; do not silently expand scope.
4. **Unresolved consequential choice:** recommend an option and ask before
   dependent changes. Optional advanced policies can be omitted or deferred.

For a consequential choice, "not sure" calls for an accessible recommendation, not
invented approval. For routine details, use judgment instead of another question.
Do not ask the user to know framework terminology.
Use repository-relative labels in shared records and never request secret values.

## Internal engineering checklist

Use this as an internal checklist, not a questionnaire to dump into chat.
Do not show this whole table to the user or ask each row. Apply the filter above;
summarize only noteworthy chosen defaults, exceptions and actual blockers.

| Choice | Decision to resolve | Recommendation logic |
|---|---|---|
| Layout and repository boundary | One repo or existing multiple repos; one app or several; native module conventions | One deployable unit often fits single; several units do not by themselves require one monorepo; preserve native layout unless the requested adjustment changes it |
| Toolchain and task entry | Existing runtime/package manager/formatter; Make, package scripts, just or native tools | Reuse compatibility constraints and working tools; no global-default pinning or mandatory Makefile/.editorconfig |
| Role/path map and documentation split | project.yaml or an existing equivalent; separate documents or a compact shared guide | Prefer a small map of roles; one file may satisfy several roles without copying facts or inventing extra indexes |
| File size | Whether a guideline adds value; scopes, threshold, severity | Reuse existing policy. A tiny scaffold may need no numeric rule. If useful, choose an advisory guideline such as 500 lines and mention it; ask only about a material conflict or new blocking gate |
| Document metadata | Existing syntax, YAML front matter, brief header or registry; required fields by document class | Prefer a way to identify current/draft/superseded/archived and meaningful update/review dates; owner is useful when responsibility needs tracking |
| Plans and history | Whether records/checkpoints serve this change | Small scaffolds need no plan files. Reuse current lifecycle; otherwise prefer change/milestone review where needed, without automatically adding expiry dates or a policy interview |
| Tests and CI | Native structural checks and existing automation | Choose minimal local smoke checks and reuse CI. New CI infrastructure or policy gates need a concrete reason and any missing authorization; do not ask about every test tool or invent coverage targets |
| Docs/product language | Existing documentation and any locale needed now | Reuse documentation language, or choose the conversation language for new docs. Product locale remains separate; defer it when no scaffold decision depends on it |
| Diagram convention | Existing format, suitable native text format, or none | Choose directly if a diagram helps; no separate question about syntax is needed |
| Agent integration | Requested tools/integrations, source ownership and startup context | Keep integration within selected scope. Source placement and a useful advisory entry budget (for example 100 lines including eager imports) are routine details; permissions/hooks/connections are not |
| Generated outputs | Commit vs build-only output; generator and consistency check | Choose per artifact and toolchain, with one source and known ownership |
| Review coverage / distribution metadata | Existing controls or an explicitly relevant need | Leave advanced coverage tracking off unless needed/requested. Reuse native package identity; do not ask about age/commit/LOC thresholds during ordinary scaffolding |

A compact default summary after the project context is known:

> Reuse the existing tools and document format, starting with local startup checks.
> Keep automatic expiry and new CI policy gates out of this scaffold; use advisory
> size guidance where useful.

If the situation actually warrants a new blocking size policy, explain its impact
and ask about that policy then. Do not ask users to approve all of the summary's
routine details, and do not require a reply before authorized routine work.

Do not attach unrelated policy questions to early product questions. An offline
CLI does not need production database, cloud deployment or AI-hook questions.
Explain an unfamiliar term when asked, then return to the pending choice.

## Blueprint ledger

Record each selected policy with value, scope, enforcement mode, exclusions and
origin (established/agent-chosen/delegated/confirmed). Keep actual blockers visible.
A user's correction replaces the previous choice; update the tree and checks.

Keep the blueprint concise: group routine defaults in a short note. Use detailed
policy tables only for a complex governance change or when the user requests them.
New blocking rules require the applicable authorization; routine advisories do not.
Never hide enforcement changes in templates or claim inferred preferences were confirmed.
Permission/privacy, preserving user work, truthful results and this skill's
no-feature boundary are workflow invariants, not options offered for weakening.
