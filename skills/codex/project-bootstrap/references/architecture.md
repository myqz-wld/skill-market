# Reference architectures and evolution

Start from a reference below and make bounded adjustments after inspecting code and
confirming requirements. Names represent roles; use native file extensions, discovery
locations and package boundaries. Materialize only responsibilities with real code.
A small module can begin with a few files and split internally when needed.

## Complete reference and capability selection

Design five cooperating layers: constraints, knowledge, implementation, verification
and tools. A project optimized for AI-led development keeps relevant context close
to its owner, makes contracts searchable and gives changes fast, trustworthy feedback.
Humans retain consequential scope/acceptance decisions; agents implement within them.

The complete reference is a selection surface, not a universal scaffold. For each
applicable capability mark needed now, conditional future, omitted or unresolved,
with evidence. Select dependencies and acceptance with the capability itself;
deferred prerequisites cannot support a claim of runnable delivery.

| Capability | Select when | Owners, boundaries and acceptance |
|---|---|---|
| AI development contract | AI will implement or maintain the project | Native instructions, protected expectations, language/privacy/size policy, task memory and real checks |
| Searchable project knowledge | Agents need to locate rules, module facts or active work | Short task routes, scoped source search, explicit current/history ownership and maintained navigation |
| App/CLI/library entry | An actual deliverable needs execution or consumption | Native entry, composition, configuration and representative runtime/import check |
| UI/presentation | The product has user-facing UI or text | Native routes/components, locale/copy owner, typed inputs and observable output |
| API/module contracts | Another module, process or client consumes behavior | Deliberate public boundary, schema/types where useful, caller compatibility and contract checks |
| Persistence | Data must survive execution | Named data owner, storage adapter, schema/migration ownership and isolated test data |
| Jobs/events | Work really needs background/asynchronous execution | Explicit handler/contract, retry/idempotency/cancellation boundaries and failure checks |
| Identity/authorization | Actual actors or protected resources require access rules | Deterministic policy boundary, scoped credentials and relevant positive/negative checks |
| External integrations | A real external dependency is required | Owned port/adapter, configuration, bounded failure behavior and local fake/contract checks |
| Multiple environments | Runtime/deployment profiles differ | Schema/precedence, secret/data/resource isolation, native deployment definitions and profile-specific evidence |
| Operational diagnostics | A runtime or recurring failure needs inspection | Safe logs, readiness/error evidence and actual diagnostic commands |
| Artifact distribution | The selected deliverable must be packaged | Native package inputs, reproducible setup where required and actual member/privacy inspection |
| Private development/public output | Internal records or AI details must stay private | One internal source root, selected native entry ownership, public independence and actual isolated export/reference checks |
| Generators/tooling | Repetition or derived content has a demonstrated owner | Canonical source, native generation/scaffolding task and regeneration/output checks |

Adding a capability does not authorize new business workflows, remote effects,
global agent configuration or a new service. Confirm those effects when they exceed
existing scope. A small project may satisfy several roles in one file/module.

Adapt responsibilities before choosing directories. For each selected capability,
identify its owner, public boundary, allowed dependencies and acceptance. Roles may
share a file or module when their responsibilities and change patterns remain clear;
explain how the dependency contract survives that combination. Omitting a role needs
a scope reason, not just a preference for fewer folders. A smaller feature scope still
needs working runtime, knowledge, verification and tooling for the selected behavior.
The resulting map should explain a representative flow and where a likely change lands.

## 1. Modular application baseline

Use this for a new application with project-owned organization. A single application
can use this layout without introducing additional services or shared packages.

```text
README.md
<native workspace/runtime configuration>
AGENTS.md                          # shared native entry; tracked or locally materialized
CLAUDE.md                          # when Claude is used: @AGENTS.md + Claude-only rules
<native task/check configuration>   # same implemented commands for humans and agents
api/                               # selected external contracts, at native locations
apps/<app>/
  <native package/build configuration>
  src/
    main.*                         # native process/application entry
    bootstrap/
      config.*                     # load and validate runtime configuration
      compose.*                    # construct adapters and inject dependencies
      lifecycle.*                  # startup/shutdown for long-lived processes
    modules/<module>/
      public.*                     # stable cross-module API
      <module card>                # actual contract/invariants/checks, when useful
      interfaces/                  # HTTP, CLI, UI or event input adapters
      application/                 # use-case orchestration and dependency ports
      domain/                      # models/rules independent of IO/frameworks
      infrastructure/              # database, filesystem and external clients
    shared/                        # proven app-local technical reuse
  tests/                           # app integration/runtime checks
  config/                          # selected non-secret schema/default/profile roles
  .env.example                     # synthetic values/key names when applicable
packages/<package>/                # actual multi-consumer or independent library
  src/
  tests/
tooling/                           # real repository development tools
tests/acceptance/                  # project-owned acceptance, when a distinct gate is needed
deploy/<app>/                     # selected native environment/deployment definitions
docs/
  README.md                        # task-oriented knowledge entry when useful
  architecture.md                  # current boundaries and evolution guidance
  decisions/                       # meaningful architectural rationale
  specs/                           # actual user outcomes and acceptance
  plans/                           # only if these records may be public
```

Do not create every illustrated directory. A new HTTP scaffold may need only its
entrypoint, composition, configuration and a working health route; a domain layer
appears when real domain responsibilities exist. A minimal CLI can start as one
module. Empty repositories, interfaces, services and tests do not count as structure.
Reuse existing record/configuration locations; the knowledge and tooling branches
are not a quota. Generated output stays in its native location with explicit source
ownership and a real regeneration check when generation is selected.
Keep module facts next to their owners and expose them through task routes and
permitted source search. Grow navigation by real topic/component; a large document
collection may use a source-derived catalog with an actual freshness check.

Apply the selected visibility profile to this tree. When development records are
private, keep their sources, instruction sources and internal tools under one
configurable private root; leave native local entries where tools discover them.
Public architecture/docs, source, CI and runtime tooling cannot reference internal
files. Public output must build/check/run independently; private tooling may consume
public tooling. Internal record locations are project rules, not a skill dependency.

### Layer responsibilities

| Role | Owns | Does not own |
|---|---|---|
| Entry/bootstrap | Process/framework startup, configuration, construction and lifecycle | Business rules |
| interfaces | Input parsing, protocol adaptation and presentation | Persistence decisions or domain policy |
| application | Orchestrating a use case, transaction boundary and required dependency contracts | Framework/server setup or concrete external clients |
| domain | Existing core models, rules and domain errors | HTTP, storage, environment access or framework imports |
| infrastructure | Concrete IO and external-system implementations | Deciding business policy |
| public boundary | Deliberately exported operations/types for other modules | Exporting all internal files |
| shared | Small proven technical capabilities used by actual consumers | Unowned business logic or arbitrary utilities |

Use functions or native constructs when sufficient; a dependency port need not be
a class or a new directory. Keep related implementation and unit tests together
when native tooling supports it. App-level tests exercise composition and boundaries.

Keep a typical module change local: public contract, implementation, focused tests,
fixtures and a compact module card should be easy to find together. Prefer one
discoverable public boundary per module; native package/export rules may require
several files. Do not expose internals just to make imports convenient.
Use explicit searchable composition and responsibility names. Avoid unowned catch-all
utilities, unnecessary reflection or implicit registration; preserve required native
framework mechanisms with a clear entry/ownership map and relevant checks.

### Dependency contract

```text
interfaces ──> application ──> domain
                    ^
                    | dependency contracts
infrastructure implements contracts owned by application/domain
bootstrap selects concrete implementations and wires them together
module A ──> module B public API, never B's internal files
```

Production domain code has no framework/IO dependency. Application code uses the
contracts it needs; infrastructure depends on those contracts rather than being
imported as a concrete implementation by the core. Bootstrap may reference all
layers to assemble the runtime.

Apps may consume shared packages; packages do not import app internals. Module and
package dependencies must be acyclic. Keep configuration and generated-content
ownership explicit. Do not add an event bus, container framework or abstraction
layer solely to illustrate dependency inversion.

## 2. Frontend mapping

Preserve the framework's required app/route/entry discovery locations. Map the same
responsibilities instead of duplicating them in a second wrapper hierarchy.

```text
<frontend-root>/
  src/
    app/                           # framework entry/routes/composition, when native
    modules/<feature>/
      public.*
      ui/                          # components and event adapters
      application/                 # state/use-case orchestration when needed
      domain/                      # framework-free rules when real ones exist
      infrastructure/              # HTTP/storage adapters
    shared/
      ui/                          # actually reused presentation primitives
      platform/                    # actually reused technical integrations
  tests/
```

Routes compose feature APIs; a feature does not reach into another feature's private
state/components. Keep reusable presentation primitives independent of feature policy.
Use the framework's native server/client boundaries and conventions. Do not manufacture
domain classes for a static page or move routing files away from their required paths.

## 3. Small CLI or library mapping

A single native package need not simulate a multi-app workspace:

```text
<native-package-root>/
  <native package/runtime configuration>
  src/
    cli.* or public.*              # executable entry or exported library API
    application/                   # orchestration when more than entry parsing
    domain/                        # real core rules, if present
    adapters/                      # actual file/network integrations
  tests/
  README.md
```

Keep a small pure library's core close to its public entry when extra layers provide
no independent responsibility. Split into modules when distinct contracts/ownership
emerge, and into packages only with actual consumers or release needs.
Verify a CLI through its real invocation and a library through a consumer import/API
call; neither needs an invented web server to demonstrate runnability.

## 4. Existing, native-constrained and content repositories

Preserve native discovery and established useful organization. For example, a Go
cmd/internal layout or a Python package root can implement the same ownership and
dependency rules without acquiring an apps/ wrapper. Map observed paths to roles
and explain each requested migration; rename-only cosmetic cleanup is not a goal.

For content repositories, retain canonical roots such as catalog/, skills/ or
plugins/ and identify their real generation/validation tools. Runnability concerns
those tools and the selected deliverable, not an artificial application.
Runtime/build configuration remains where the chosen native tooling discovers it.

## 5. Controlled evolution

Resolve likely next iterations with the user. For each selected scenario record:
current owner/path, extension point, observable trigger, bounded change sequence,
contracts/dependencies to preserve and verification. If no roadmap is known,
document existing extension mechanisms and conditional triggers without claiming
that a product feature is planned.

| Trigger | Default architectural move | Evidence/checks |
|---|---|---|
| New work fits the current module's responsibility | Extend its existing application/public boundary | Relevant behavior tests; no unrelated module edits |
| A concern acquires a distinct owner or change pattern | Extract a module behind an explicit public contract | Callers migrated in steps; no cycles or internal imports |
| A stable capability gains another actual consumer or release need | Extract a package with a deliberate API | Every consumer verified; no app-internal dependency |
| A component needs an independently justified runtime/deployment lifecycle | Evaluate a separate app/service | Confirm operational need, data ownership, failure behavior and compatibility |
| A layer contains several coherent responsibilities | Split inside the owning module first | Stable public API and meaningful local checks |
| A new external provider is required | Add an adapter behind the existing required contract | Provider contract and composition tests |
| Another runtime/deployment environment is needed | Add its configuration/resource boundary using the existing native contract | Effective config, isolation, packaging and authorized environment checks; no source-tree fork |
| Independent tasks repeatedly collide in shared files/resources | Assign composition/integration ownership and isolate workspace resources | Stable interfaces, configurable ports/data/temp roots and a join check |

These triggers do not authorize speculative code or automatically create services.
A line count alone is not a module boundary. Preserve extension seams that today's
design actually needs; describe future extraction steps without building empty
directories for them.

For affected boundaries, use representative change scenarios and relevant failures
to trace owners, dependencies, propagation and check points. Choose scenarios from
actual requirements or existing extension mechanisms, without a scenario quota.
Use the result to simplify or adjust the reference; do not implement future business
features merely to illustrate the architecture.

## 6. Guidance later AI sessions must be able to use

The target architecture material should answer:

- Where does a new use case or integration enter, and which public API owns it?
- Which dependencies and behaviors must stay stable?
- What evidence would justify a new module, layer, package or application?
- Which callers/configuration must migrate together, in what bounded order?
- Which checks establish that the new boundary works and the project still runs?
- Which acceptance expectations and paths are protected, and what policy governs changes?
- Which language, file/context and privacy rules apply, and where are they actually enforced?
- Which environment and resource boundary does this change affect?
- How do I find the applicable document, distinguish current rules from history and
  update discovery when an authority moves or changes?
- Where do new plans, tasks, handoffs and archives belong, and which project-owned
  sync/check/export commands maintain the selected visibility boundary?

For each actual architectural change: inspect its owner and trigger, settle newly
consequential decisions, implement the smallest sufficient delta, verify runtime
and affected contracts, then update the current map and evolution guidance.
Keep planned migration progress separate from the architecture already implemented.
