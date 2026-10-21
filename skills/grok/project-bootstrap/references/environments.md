# Multi-environment runtime and deployment

Select actual environments with the user and existing project evidence. Names such
as local, test, staging and production are examples, not a mandatory four-environment
scheme. Record each application's deployment unit, runtime and actual environment
boundaries before adding configuration or deployment files.

## Reference ownership

Use native framework/platform configuration where it already owns these roles:

```text
<app>/src/bootstrap/
  config.*                           # the app's effective configuration entry
<app>/config/                        # only when native tooling permits this location
  schema.*                           # names/types/constraints, without secrets
  base.<native-format>                # non-secret shared defaults
  environments/<environment>.*        # non-secret environment overrides
<app>/.env.example                    # synthetic values/key names when applicable
deploy/<app>/                        # selected native deployment definitions
  <environment>/                     # only when separate definitions are needed
tests/config/                        # effective config and isolation checks
```

Map these roles to existing equivalents. Do not build a custom configuration system
when native tooling already provides one. Keep environment differences in explicit
configuration and deployment ownership, not duplicated source trees or scattered
business-code checks for environment names.

## Configuration contract

Record environment selection, schema ownership, precedence and startup validation.
Use the native precedence when established. A suitable fallback is shared defaults,
then selected non-secret environment overrides, then runtime-injected settings, then
explicit command options for keys that intentionally support them.
Specify allowed sources per key; security policy is not automatically overridable.

Reject unknown environments and missing/invalid required values before serving work.
Do not silently fall back to production or substitute another environment's endpoint.
Display only safe environment/configuration provenance; redact credentials and private
connection details. Local private overrides stay outside Git and package/build inputs.

Separate:
- **Build-time public configuration:** values embedded in a frontend/static artifact.
  Treat all such values as public; use an allowlist and no secrets.
- **Runtime configuration:** values resolved by the running process or platform.
- **Secrets:** injected through the selected environment/secret system, with minimum
  exposure. Names/references can be documented; secret payloads must not be copied.

For each environment identify accounts/credentials, data stores, storage, queues,
indexes and external endpoints that must be isolated. Share infrastructure only
when its namespaces/access controls establish the agreed boundary.
Tests use synthetic isolated resources; never use production data or credentials
as a convenient development fixture.

## Environment and delivery matrix

For each actual environment record:

| Field | Concrete evidence |
|---|---|
| Purpose and users | Why it exists and who may act on it |
| App/runtime | Actual deployable unit, native runtime and prerequisites |
| Configuration | Real schema/default/override locations and precedence |
| Secret source | Logical provider/reference and injection boundary, never values |
| Data/resources | Isolation boundary, fixture source and allowed external access |
| Commands | Implemented build/run/check/deploy commands and their effects |
| Artifact | Build identity and promotion/rebuild policy |
| Acceptance/recovery | Readiness/smoke checks, rollback and migration constraints |

Keep the matrix in existing architecture/operations documentation; a small project
can use a README section. It is not a requirement for a custom project manifest.

## Build, release and deployment boundaries

Prefer promoting the same verified artifact when the runtime supports external
configuration. If native frontend/build constraints require environment-specific
builds, record the reason and verify each produced artifact separately.
Use native package/version metadata and relevant source identity; no personal build
paths or credentials in public diagnostics. A matching commit alone does not prove
byte-identical artifacts or verified runtime behavior.

Implement selected native deployment declarations and commands within scope. Actual
remote provisioning, deployment, secret changes, production migrations and replacement
of a running app require authorization for those exact effects. Creating deployment
files is not proof that deployment happened. A local run is not a production pass.

For data changes preserve immutable applied migrations, name rollback/compatibility
constraints and use disposable data for ordinary checks. Do not run a destructive
migration merely because a deployment command exists.

## Acceptance

Verify effective configuration with synthetic values for every selected profile:
precedence, required/unknown keys as defined by the schema, unknown environment
rejection, secret redaction and resource isolation. Test that one profile cannot
silently read another environment's data or credentials.

Run local startup/smoke checks for the supported profiles or clearly scoped test
substitutes. Validate selected deployment definitions with available native tools.
Inspect actual build/package contents, especially public frontend variables and
source-map/debug metadata, when artifacts exist.
Record unavailable real-environment checks separately from local or simulated ones.

Report code/configuration readiness, artifact verification and actual deployment
status independently. If required environment acceptance is blocked, keep that
delivery scope incomplete with a specific missing prerequisite.
