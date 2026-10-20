# Project manifest contract

Use this contract only when project.yaml is selected. It is a project-owned
structure manifest, not a format native tools execute. An existing equivalent
may remain authoritative; do not add this manifest solely to satisfy the skill.
For a selected project.yaml, generate a project-local validator using the
selected runtime, a real YAML parser and `assets/project.schema.json`. Reuse
existing validation dependencies where possible; disclose any new dependency.
Copy the schema into a suitable project-owned tooling path when validation needs
it, and register that location instead of linking to an installed skill path.

Read versions and dependencies from native package/runtime files. Read business
rules from their canonical contracts and docs. The manifest maps responsibilities
and commands rather than duplicating those facts.

## Fields

All keys below are defined by the bundled schema; remove unused optional keys.
Fields reject null unless explicitly allowed by the schema.

| Field | Contract |
|---|---|
| schemaVersion | Required integer, currently 1 |
| name | Required nonempty project name |
| type | Required: fullstack, backend, frontend, library or cli |
| layout | Required: single or monorepo |
| packs | Required unique list: ui, api, async, data, ops, security, library, multi-service; may be empty |
| apps | Optional mapping of stable ids to path, packs and deployable boolean; default deployable is true |
| slots | Required mapping of role names to one path/glob or a nonempty list of paths/globs |
| generated | Required list, possibly empty, of source, output, command, commit records |
| commands | Required check string; dev/test/build/gen/ai-sync and other actual tasks when implemented |
| ai | Required enabled boolean; when true, path and nonempty adapter ids are required |

`apps` includes applications, not every module or package. A single application
may be omitted from apps and use root-relative slots, or be declared at `.`.
Multiple declared applications in this one repository use the monorepo label;
independent deployment does not itself decide repository grouping. Package-only
monorepos can omit apps and map package roles through slots.
App packs must be a subset of repository packs. Repository-level ops/security
may apply to several apps without duplicating app declarations.

Every path is repository-relative, uses `/` and contains no `..`, absolute prefix,
home expansion or URL. `.` denotes the root. Slots and generated source may use
project-supported globs; generated output, app paths and ai.path are literal
paths. Check resolved symlinks too; write targets must remain within the project.
Reject blank paths, control characters and leading/trailing whitespace. The agent
source path must be distinct from the root and from human docs/code responsibilities;
validate that ownership before creating or removing managed integration files.
Name the glob dialect in the generated checker and test it. Do not assume simple
string matching or a homegrown YAML parser handles arbitrary paths.

An unknown slot is allowed for project extensions. A new capability pack or
schema version requires an explicit contract change, not silent acceptance.

## Required roles

Core roles: `readme`, `glossary`, `scope`, `architecture`, `module_map`,
`conventions`, `testing`, `modules`. Several roles may map to one real file;
use its sections for distinct topics, rather than duplicate facts. Slots map
file paths; navigation can describe the section without embedding an anchor
in a filesystem path.

`modules` maps actual module/package/app roots; a small initial CLI/library may
use its native code root without creating artificial submodules. Each matched
root needs a README or an explicit `module_docs` mapping.

| Condition | Additional slots |
|---|---|
| ui | tokens, ui_design, copy_policy; ui_flows only for real flows, e2e_tests only when selected |
| api | api_contract, errors, api_conventions, api_consumers; contract_tests only when selected |
| async | jobs; event_contracts for actual event interfaces, contract_tests when selected |
| data | migrations; optional seeds_local, seeds_test, backfills |
| ops | config_schema, config_base, config_environments, env_example, deployment, environments, release, observability |
| security | threat_model, data_policy |
| library | public_api, compatibility, changelog, examples, package_config |
| multi-service | apps declares services; repository layout is monorepo |
| user-facing CLI | copy_policy, even without ui |

An applicable role must resolve to existing meaningful content or tests, not just
an empty directory. A protocol/interface role that does not apply must be
explained in the blueprint, with the selected alternatives validated. Existing
equivalents map directly to the role; do not generate duplicate sources.

Only require `plans_active`, `plans_archive`, `reviews`, `review_policy`,
`packaging`, `diagrams`, `adr` and other optional slots when corresponding
content/features exist. Archive directories can be created at transition time.

## Generation and commands

Each generation record contains:

- `source`: one path/glob or a nonempty list.
- `output`: one literal file or directory path.
- `command`: the named key in `commands` that performs generation.
- `commit`: whether output belongs in version control.

Commands describe reviewed local tasks. A validator must not blindly execute
arbitrary manifest commands; select and inspect commands before running them.
Remote fetch, deployment and database mutation are not implicit check actions.

Require source resolution, known command keys, distinct nonoverlapping output
ownership and output that does not contain its own source. A newly declared
output need not exist before generation, but must exist after successful generation.
Do not require commit:false outputs to be tracked; verify actual package inputs
separately from Git ignore policy.

The schema checks shape and simple paths; semantic checks enforce role presence,
ownership, glob expansion, containment, command references and generator behavior.
Do not claim schema validation alone proves those conditions.

The optional task_map slot locates selected task navigation. Its role names must
resolve through this map (or the chosen equivalent); do not copy a second path
registry. Engineering policy values live in selected project-owned conventions
or native checker configuration, not hardcoded into this schema. A structure-only
manifest may expose only its real check command; do not invent dev/test stubs.

Pack selection does not silently enable a test framework. Require e2e_tests or
contract_tests only when the agreed test policy includes them; validate the actual
selected smoke/regression strategy otherwise. Do not create empty paths to satisfy
a test style the user declined. ui_flows describes real flows, not invented
product behavior for an empty scaffold.
