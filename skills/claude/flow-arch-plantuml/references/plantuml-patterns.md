# PlantUML Patterns

Open this reference only when `flow-arch-plantuml` needs syntax examples. Keep generated diagrams in project `ref/flows` or `ref/architecture`; this file is only a pattern library.

## Sequence

Use sequence diagrams for cross-process, cross-service, or adapter call chains.

```plantuml
@startuml request-flow
participant Client
participant "API service" as Api
participant Worker
database Database

Client -> Api: submit request
Api -> Database: create job
Api -> Worker: enqueue job
Worker -> Database: update result
Api --> Client: return job status
@enduml
```

## Activity

Use activity diagrams for one-actor workflows, decision trees, and state transitions.

```plantuml
@startuml lifecycle-state-machine
start
:session active;
if (past dormant threshold?) then (yes)
  :mark dormant;
  :abort live query;
else (no)
  stop
endif
if (past closed threshold?) then (yes)
  :mark closed;
endif
stop
@enduml
```

## Component

Use component diagrams for module dependencies, process boundaries, and data flow.

```plantuml
@startuml service-architecture
package "main process" {
  [entrypoint] -> [router]
  [router] -> [handler]
}
package "storage" {
  [database]
  [object-store]
}
[handler] --> [database]
[handler] --> [object-store]
@enduml
```

## Notes

Add a PlantUML `note` where a design choice, invariant, rejection condition, or non-obvious ordering matters.

```plantuml
Caller -> Tool: invoke
note right
  Caller must exit the worktree first;
  calls from inside the worktree are rejected.
end note
```
