# Safety Boundary

## Trust Model

The agent is not a database principal, and the local scripts are not a policy engine. NineData platform policy is the final authority for whether SQL may execute.

## Mandatory Rules

- Do not connect directly to databases.
- Do not store database usernames or passwords in the skill.
- Do not expose AK/SK values in chat, logs, or command output.
- If SQL was generated or modified by the agent, or if SQL is not a query, get explicit user confirmation first.
- The script sends `ignoreTips=true`; treat this only as a transport of the agent-collected confirmation, not as permission to skip confirmation.
- Do not rewrite and retry SQL to bypass a rejection.
- Do not split high-risk SQL into smaller statements to bypass rule checks.

## Platform-Enforced Policy

The platform must enforce:

- SQL parsing and statement splitting
- SQL type detection
- permission checks
- rule preflight checks
- environment and datasource boundary checks
- query throttling
- timeout, row count, and byte-size limits
- sensitive data masking
- audit logging

## Agent Response

If `decision=EXECUTED`, summarize the execution result and evidence.

If `decision=REJECTED`, explain the platform rejection and stop.

If `decision=NEED_SQL_TASK`, tell the user that this operation must go through a NineData SQL task or approval workflow.

If `decision=NEED_CONFIRMATION`, ask the user to confirm the full SQL before execution.

If `success=false`, report the requestId and error message without exposing secrets.
