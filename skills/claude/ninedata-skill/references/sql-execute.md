# SQL Execution Tool

## List Datasources

Request:

```text
GET /openapi/v1/datasource/list
```

Common query parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| datasourceId | String | No | Datasource ID |
| datasourceType | String | No | Database type, such as MySQL, PostgreSQL, SQLServer, Oracle, Dameng, or KingBase |
| keyword | String | No | Datasource keyword |
| current | Integer | No | Page number, default 1 |
| pageSize | Integer | No | Page size, default 10 |

## Execute SQL

Request:

```text
POST /openapi/v1/sql/execute
```

Core request body:

```json
{
  "datasourceId": "ds_xxx",
  "dbType": "mysql",
  "databaseName": "app_db",
  "schemaName": "public",
  "clusterName": "optional-cluster-name",
  "sql": "select count(*) as c from orders",
  "current": 1,
  "pageSize": 50,
  "clientConfirmed": true,
  "ignoreTips": true,
  "useSessionPersistence": false,
  "reason": "Verify order count after migration",
  "source": "NINEDATA_SKILL",
  "toolId": "sql-execute",
  "sourceClient": "codex",
  "sourceSessionId": "optional-session-id",
  "skillVersion": "1.0.0",
  "language": "enus"
}
```

Required fields:

- `datasourceId`, unless `config.defaultDsId` is configured and the script is allowed to use it
- `databaseName`, unless `config.defaultDbName` is configured or the database type does not require it
- `schemaName`, unless `config.defaultSchemaName` is configured or the database type does not require it
- `sql`
- `reason`
- `sourceClient`

`ignoreTips=true` tells NineData that the agent has already completed the prompt-level confirmation required by this skill. The script sends it by default so DML does not require a second SQL-window confirmation round.

`useSessionPersistence=false` is the default for agent calls. Keep it disabled unless the user explicitly needs session state such as temporary tables or session variables.

`dbType` and `clusterName` are optional pass-through fields for special datasource execution paths. Omit them for ordinary datasource execution unless the user or datasource metadata requires them.

`success=true` only means the OpenAPI request succeeded. It does not mean the SQL was executed. Use `data.decision` as the SQL execution decision.

`resultSets[].rows` is an Agent-facing preview. Large result sets may be truncated by page size or preview protection. Use the `truncated` field before treating the preview as complete.

Decision values:

- `EXECUTED`: SQL was executed.
- `REJECTED`: permission, rule, or safety policy rejected the SQL.
- `NEED_CONFIRMATION`: user confirmation is required before resubmission.
- `NEED_SQL_TASK`: a NineData SQL task or approval workflow is required.
- `FAILED`: execution failed or the database returned an error.
