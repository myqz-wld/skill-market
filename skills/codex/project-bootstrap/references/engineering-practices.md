# Selected engineering practices

Use the question filter in references/interview.md: reuse existing choices,
select reversible routine defaults, ask about consequential unknowns and omit
unnecessary advanced policies. Preserve stronger target instructions and existing conventions. Place each
selected policy in one project-owned source; guides and agent entries refer to it.
Native lint/configuration files may own machine-enforced settings. A blueprint
records the decision, not a second runtime source of truth.

## Documents and historical evidence

Use the chosen metadata representation: existing format, YAML front matter, short
header or a role registry. Select fields by document class. Status/meaningful
update information supports retrieval; owner may be unassigned where responsibility
does not need to block setup. Never invent identities, dates or review evidence.
Do not apply metadata rules to native configuration or generated formats blindly.

Plans use the chosen date-based expiry, milestone checkpoint or manual review
policy. Do not synthesize an expires date when none was selected. A stale checkpoint
calls for disposition, not automatic deletion or extension. Ongoing intent is not
implemented behavior; old reviews cover only their real baseline.

Create ADRs and formal review records only when selected and useful. Preserve the
meaning of existing accepted decisions; supersede with a new decision and link the
replacement rather than rewriting history. Automated immutability checks require
an agreed policy and a known accepted baseline; otherwise report unverified.
Use references/retrieval.md for current, draft, superseded and archived handling.

On completion, retain actual outcomes/residual work and archive in the existing
location when the lifecycle calls for it. Raw logs and scratch use an existing
ignored workspace, or an opted-in agent-local workspace. Keep shared evidence
accessible to people; no empty reviews or gratuitous archive buckets.

## File and startup-context budgets

Read existing policy first. If absent, decide whether a numeric guideline helps
this project; small scaffolds can omit it. A useful 500-line advisory rule may be
chosen and briefly disclosed without a separate question. Ask only about a
material conflict or proposed new blocking policy. Source and prose can differ;
explicit user choices such as no limit always take precedence.

When selected, distinguish generated/lockfile/snapshot/fixture/applied-migration
exclusions from exceptions for authored files. Record an exception's exact path,
reason and revisit condition. Respect approved exceptions. Warn/fail/skip according
to the selected mode; do not turn an advisory setting into a CI failure.

If a file needs restructuring, extract cohesive responsibilities behind stable
interfaces. Avoid fragmentation or risky state changes merely to satisfy a count.
Size rules govern this structural change; they do not authorize unrelated cleanup.

For selected agent integration, choose a suitable startup-context guideline
without a separate policy interview. A roughly 100-line advisory entry is one
possible starting point, not an automatic blocking cap. Count eager
imports when evaluating the actual loaded context; moving text into an imported
file does not reduce it. On-demand references are outside the startup total.

## Native tools, language and verification

Use project-compatible runtimes and existing package/task/formatter conventions.
Choose a Makefile, editor config, diagrams, CI and coverage gates only where they
serve a selected role. No single language, repository layout or CI provider is
assumed. Repository separation and independently deployed units are distinct choices.

Documentation language and future product locale are separate. Record only the
copy policy and tooling decisions needed by the scaffold; do not implement product
translations or user journeys. Reuse existing copy authorities and native paths.

Wire the selected structural checks and existing regressions. Local-only checks,
CI enforcement and check severity are separate choices. Missing tooling or an
unimplemented gate is a reported limitation, never placeholder success.

## Invariants independent of project preferences

Keep secrets and private machine identifiers out of shared artifacts; use portable
paths and inspect actual distribution inputs. Preserve user files and write only
within authorized scope. A documentation rule does not grant trust, production
access, global configuration changes, publication or live-app restart permission.

Generated content has a known owner/source and a compatible marker, sidecar or
manifest. Change the source, preserve authored additions and report real check
results. Optional hooks/connections require their actual selected integration.
Scaffolding and architecture adjustment remain separate from new product features.
