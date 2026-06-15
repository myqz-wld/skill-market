---
name: ninedata-skill
description: Use this skill when the user needs to work with the NineData platform from an agent, including listing NineData datasources, executing explicit SQL through NineData controlled OpenAPI, checking database state, or validating development data. This skill relies on NineData authentication, permission checks, SQL rule checks, masking, throttling, and audit logs. Do not use it for direct database connections, database credential handling, or unconfirmed SQL execution.
---

# NineData Skill

## Capabilities

This skill provides a system-level NineData toolset. Current tools:

- `list-datasource`: list NineData datasources visible to the configured OpenAPI credential.
- `sql-execute`: execute explicit SQL through the NineData controlled SQL execution OpenAPI and return the platform decision, execution evidence, and result preview.

Future NineData tools should be added under `ninedata-skill` instead of creating separate skills.

## Boundaries

- Do not connect directly to databases.
- Do not ask the user to paste database usernames, database passwords, AccessKey secrets, cookies, or tokens into chat.
- Do not treat this skill as an automatic natural-language-to-SQL execution tool.
- If SQL is generated or modified by the agent, show the full SQL to the user and get confirmation before execution.
- For non-query SQL, clearly warn the user and get confirmation before submitting it.
- If NineData rejects, blocks, requires approval, or requires a SQL task, do not bypass the platform decision.

## Required Context

Before using `sql-execute`, make sure these values are known:

- `datasourceId`, or `defaultDsId` configured in `config.json`
- optional `dbType`, when the datasource type is known and the user wants to pass it explicitly
- `databaseName`, or `defaultDbName` configured in `config.json`, when required by the database type
- `schemaName`, or `defaultSchemaName` configured in `config.json`, when required by the database type
- optional `clusterName`, for datasource types that require a cluster selection
- explicit SQL text
- execution reason `reason`
- source client `sourceClient`; any non-empty string is accepted, such as `codex`, `claude-code`, `cursor`, `open-claw`, `hermes-agent`, `qoder`, `trae`, or `open-code`

If `datasourceId` is unknown and `config.defaultDsId` is not configured, use `scripts/list-datasource.sh` first. Use `--keyword <keyword>` for keyword search.

## Standard Workflow

1. Validate configuration: `scripts/validate-config.sh`
2. List datasources when datasource context is missing: `scripts/list-datasource.sh --keyword <keyword> --page-size 20`
3. Prepare or confirm the SQL.
4. If the SQL was generated or modified by the agent, or if it is not a query, ask the user to confirm the full SQL.
5. Execute SQL: `scripts/sql-execute.sh --database-name <db> --schema-name <schema> --sql-file <file> --reason <reason> --source-client <client> --client-confirmed`
6. Read the JSON output and judge the result from `success`, `requestId`, and `data.decision`.
7. Summarize in natural language and include structured execution evidence.

Pass `--datasource-id <id>`, `--database-name <db>`, or `--schema-name <schema>` when the user explicitly chooses context for this run. Omit them only when `config.defaultDsId`, `config.defaultDbName`, and `config.defaultSchemaName` should be used.

Prefer `--sql-file` for multiline SQL. Use `--sql` only for short one-line SQL. Do not pass both.

The script sends `useSessionPersistence=false` by default. Use `--use-session-persistence` only when the user explicitly asks to keep SQL window session state for this run.

The script sends `ignoreTips=true` to NineData after the agent has collected the required prompt-level confirmation. Do not run unconfirmed DML/DDL just because the script can bypass SQL-window tips.

## Response Requirements

Always include these fields when reporting the result:

- `requestId`
- `executionId`, when returned by NineData
- `decision`: `EXECUTED`, `REJECTED`, `NEED_CONFIRMATION`, `NEED_SQL_TASK`, or `FAILED`
- datasource, database, and schema context
- SQL type and risk level, when returned
- preflight summary
- affected rows or result preview
- masking and truncation status
- next action when SQL was not executed

## References

- Tool list: `references/tools.md`
- SQL execution: `references/sql-execute.md`
- OpenAPI authentication: `references/openapi-auth.md`
- Safety boundary: `references/safety-boundary.md`
- Client installation: `references/client-install.md`
