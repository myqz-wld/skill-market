# Core, layouts and packs

Propose the core responsibilities plus capabilities needed for this structural
scope. Exact filenames and document splitting are choices. A selected
project.yaml maps roles to paths; it does not override native conventions.
Several roles may share one concise file with distinct sections. Omit or reuse
optional tooling rather than creating a second configuration authority.

## Core

```text
README.md
project.yaml                  # when this role map is selected
.gitignore
<editor/formatter configuration, when selected>
<native dependency/runtime files and task entry>
<native code and colocated unit tests>
docs/
  glossary.md
  product/scope.md
  architecture/
    overview.md
    modules.md
    diagrams/                 # only with a useful diagram
    adr/                      # only with an actual decision
  development/
    conventions.md
    testing.md
  plans/
    active/                   # only when a tracked plan exists
    archive/                  # when a plan completes
scripts/check/                # useful custom checks; native tools may own others
<selected CI configuration>
```

README contains purpose, quickstart, verification and navigation. Scope contains
users, intended product context and non-goals; this context is not feature scope. Overview describes context and
runtime units; modules describes module ownership and allowed dependencies.
Glossary records real domain terms; a short section may satisfy it.

Conventions owns document metadata, generated markers, naming, path privacy,
file-size exceptions and ADR lifecycle. Testing owns test placement, commands and
data policy. Add setup documentation only when README cannot explain it concisely.
Use the selected existing/primary diagram convention; no diagram is mandatory.

Core responsibilities may be satisfied by existing equivalents. In an existing
project, record mappings instead of creating duplicate documents or replacing CI.
For a new offline/local-only project, record the CI decision; do not invent a
hosting provider or claim CI runs before it has been configured.

## Layout

**single:** one application or package, directly at the repository root. Example:

```text
src/
  app/                        # assembly, routing, startup
  modules/<module>/           # backend; frontend uses features/<feature>/
    README.md
    <code and unit tests>
  shared/                     # backend infrastructure may use platform/
```

**monorepo:** multiple apps/packages in one chosen repository, conventionally under
`apps/<app>/`, each with its native layout and a mapped summary. Use
`packages/<package>/` only for actual reuse or independent library release. Record consumers and rationale in the module map.

Independent deployment does not force a shared repository. Confirm repository
boundaries first; existing multi-repo projects can keep their layout, with work
limited to explicitly selected repositories. The examples do not require Go to
abandon cmd/internal, Python to abandon its package layout, or a framework to abandon its routing convention. Unit tests
follow native discovery requirements when colocation is unsuitable.

Do not create `packages/domain/` by default. Backend business rules stay with their
owning module; frontend protocol types are generated from the contract. Shared
implementation requires concrete consumers and an explicit boundary decision.

Module README: responsibilities, non-responsibilities, public interfaces, allowed
dependencies, owned tables/data and invariants. Do not pre-create imaginary modules.

## Capability packs

`<web>`, `<api>` and `<owner>` below mean an owning app root: `.` for single or
the declared app path for monorepo. The owning module remains explicit within it.

| Pack | Default paths/responsibilities | Acceptance |
|---|---|---|
| ui | `<web>/src/design/tokens/`; stories beside components; `docs/ui/design.md`, `docs/ui/flows/`, `docs/product/copy.md`; e2e tests | Chosen UI/token tooling and generic empty page load; no product journey |
| api | `contracts/api/` with the selected protocol, `contracts/errors.yaml`; `docs/api/conventions.md`, `consumers.md`; contract tests | Selected contract tooling parses; existing interfaces preserve their baseline |
| async | `contracts/events/` when events exist; `docs/async/jobs.md`; app task entrypoint or independently deployed worker | Selected entry/wiring and failure policy recorded; no new business job |
| data | `<owner>/db/migrations/`, local/test seeds when needed, backfills when needed | Owner and migration configuration known; no invented domain schema |
| ops | Configuration schema, defaults, selected environment differences, `.env.example`, deploy configuration; operations docs | Local configuration validates; release steps and observed environment differences are explicit |
| security | `docs/security/threat-model.md`, `data-policy.md` | Architectural trust/data boundaries are concrete; no claim of implemented product controls |
| library | Package changelog, examples and release configuration; `docs/library/compatibility.md` | Package/import scaffold and compatibility policy; no new functional API |
| multi-service | monorepo, shared glossary/architecture/cross-service contracts, service-owned databases | Service boundaries and independent runtime requirements are justified |

The slot names and requirements in `references/manifest.md` turn this table into
checkable paths. A selected pack requires its applicable responsibilities, not
every optional directory mentioned here.

### UI and interfaces

Tokens begin inside the app. If several apps truly share a UI package, move their
shared token authority to `packages/ui/tokens/`; keep one source. Design-tool
links provide context, while versioned tokens/specifications remain authoritative.
Copy policy declares language, tone, terminology and i18n resource locations;
actual copy belongs to those resources. CLI copy also needs this policy.

Choose the API protocol from consumers and native tooling, not a fixed preference.
Generate client protocol types from its contract. Conventions explain contracts;
they do not maintain a second copy of error codes or schema definitions.
For scheduler-only async work, omit event contracts and record that no event
interface exists. A worker may share an app's code through another entrypoint or
be a separate app/repository; choose from ownership and release needs. The manifest's monorepo
label describes multiple declared apps in one repo, not every deployment process.

### Data and operations

Each existing or explicitly planned dataset has an owning module. Migrations
follow the owning application.
Shared-database access must respect ownership rather than allow every service to
write every table. Seeds are local/test fixtures, not production deployment input.
Backfills include execution guidance and sanitized outcome records.

Applied migrations are immutable; introduce subsequent migrations for changes.
Use expand-then-contract for compatibility across rolling application versions:
add the compatible structure, transition/backfill users, then remove obsolete
structure in a later verified release. Follow stronger database-native policies.

Use only real environments. local/test/prod are available labels, not mandatory
deployments for a library or offline CLI. Environment configuration holds
non-secret differences; private endpoints/credentials remain external or private.
Document data sources, release method, access policy and known differences.
If feature-flag governance is in scope, reuse or confirm its owner/lifecycle policy;
scaffolding does not add product flags or assume a fixed expiry.

### Generated output and tests

There is no compulsory generated/ root. Declare source/output/command/commit policy
for each output. Mark source provenance using a format-compatible comment or a
sidecar/manifest for formats such as strict JSON.

Cross-module integration, contract and e2e tests may live under tests/. Prefer
synthetic fixtures. Native test placement can satisfy these roles without adding
a second test hierarchy.

### Optional development-agent block

Read `references/adapters.md` only when selected. Recommend `.agents/` only when
suitable and selected, recorded by `ai.path`. Product LLM prompts and evaluations
stay in their owning product modules. Shared architecture and development
procedures stay in docs; formal reviews needed by plans stay in docs/reviews.

Select capability setup only for this structural scope. Future feature needs
inform boundaries but do not authorize feature implementation or empty pretend
contracts. Use references/validation.md for scaffold-specific acceptance.
