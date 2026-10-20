# {{Project}} architecture blueprint

## Outcome and scope

- Product context, only as needed for architecture: {{purpose}}
- Target/mode: {{scaffold or existing architecture adjustment; discussion/write}}
- Structural outcome: {{runnable generic skeleton, structure only or restructuring}}
- Behavior/contracts to preserve: {{existing invariants}}
- Excluded work: {{new business features and unrelated changes}}

## Decisions

| Topic | Evidence/answer | Selected value | Origin/status | Effect |
|---|---|---|---|---|
| Stack/tools | {{constraints}} | {{native tools and compatible runtime}} | {{established/agent-chosen/confirmed/delegated/unresolved}} | {{files}} |
| Boundaries/layout | {{units and ownership}} | {{repo boundaries and native layout}} | {{status}} | {{paths/moves}} |
| Capabilities | {{structural needs}} | {{selected packs; future needs deferred}} | {{status}} | {{setup only}} |
| Documents/navigation | {{existing equivalents}} | {{role map, metadata and history scheme}} | {{status}} | {{sources/routes}} |
| AI integration | {{tools or none}} | {{sources and owned native entries}} | {{status}} | {{opt-in integrations}} |

## Engineering defaults and exceptions

{{Briefly group only noteworthy defaults: reused conventions, routine settings
chosen by the agent, omitted advanced controls and any genuine policy exception.
No row-by-row questionnaire or separate approval for reversible defaults.
Use a detailed value/scope/severity/exclusion/origin table only if the user asks
or this change actually introduces complex governance. Label agent-chosen values
honestly; surface unresolved consequential choices and new blocking gates.}}

## Tree and commands

{{Selected tree with create/move/merge/generated labels, shared authorities and
existing equivalents. No feature implementation and no unused directories.}}

| Purpose | Implemented command | Observable structural result |
|---|---|---|
| Boot/import, if selected | {{command}} | {{generic entry works}} |
| Regression/smoke, if selected | {{command}} | {{existing behavior/structural wiring}} |
| Check | {{command}} | {{selected validations and severity}} |

## Acceptance and unresolved items

{{Navigation trials including current/history distinction, baseline/regressions,
repeated generation, dependencies, blockers and deferred policies. Resolve only
remaining consequential choices/write scope; reuse existing authorization.}}
