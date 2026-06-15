# NineData Skill Tools

## list-datasource

Lists NineData datasources visible to the configured OpenAPI credential.

Common command:

```bash
scripts/list-datasource.sh --datasource-type MySQL --keyword test --page-size 20
```

Use when:

- the user did not provide `datasourceId`
- `config.defaultDsId` is not configured or needs to be changed
- a datasource needs to be found by name or type
- the target environment must be confirmed before SQL execution

## sql-execute

Executes explicit SQL through the NineData controlled OpenAPI.

Common command:

```bash
scripts/sql-execute.sh \
  --database-name app_db \
  --sql-file /tmp/query.sql \
  --reason "Verify order count" \
  --source-client codex \
  --client-confirmed
```

When context arguments are omitted, the script uses `defaultDsId`, `defaultDbName`, and `defaultSchemaName` from `config.json`. Pass `--datasource-id ds_xxx`, `--db-type mysql`, `--database-name app_db`, `--schema-name public`, or `--cluster-name cluster_a` when the user explicitly chooses context for this run.

`sql-execute` sends `useSessionPersistence=false` by default. Add `--use-session-persistence` only for workflows that intentionally rely on SQL session state.

For short one-line SQL, `--sql "select 1"` is also supported. `--sql` and `--sql-file` are mutually exclusive.

Use when:

- running read-only queries
- running explain or metadata checks
- submitting DML/DDL to NineData for platform governance after user confirmation

Do not use for:

- direct database connections
- unconfirmed agent-generated SQL
- bypassing NineData permissions, rules, approvals, or audit logs
