# NineData OpenAPI Authentication

## Headers

Every OpenAPI request must include:

- `access-key-id`: AccessKeyId issued by NineData.
- `timestamp`: UTC timestamp in `yyyy-MM-dd'T'HH:mm:ssZ` format.
- `signature`: SHA256 signature.
- `Content-Type: application/json`: required for POST requests.

## Signature

Signature payload:

```text
path + "/" + AccessKeySecret + "&" + timestamp
```

Example:

```bash
signature=$(echo -n "/openapi/v1/sql/execute/$accessKeySecret&$timestamp" | sha256sum | awk '{print $1}')
```

## Configuration Location

The default configuration file is in the skill root:

```text
ninedata-skill/config.json
```

Minimal configuration:

```json
{
  "endpoint": "https://your-ninedata-domain.example.com",
  "accessKeyId": "replace-with-access-key-id",
  "accessKeySecret": "replace-with-access-key-secret",
  "defaultDsId": "replace-with-default-datasource-id",
  "defaultDbName": "replace-with-default-database-name",
  "defaultSchemaName": "replace-with-default-schema-name",
  "source": "NINEDATA_SKILL",
  "defaultPageSize": 50,
  "defaultLanguage": "enus"
}
```

`defaultDsId`, `defaultDbName`, and `defaultSchemaName` are optional for datasource listing, but recommended. `sql-execute` uses them when `--datasource-id`, `--database-name`, or `--schema-name` are not provided.

You can temporarily override it with `--config` or `NINEDATA_SKILL_CONFIG`.

## Security Requirements

- Do not print `accessKeySecret`.
- Do not pass AK/SK values in chat.
- Do not upload or commit a real `config.json`.
- Set the configuration file to `chmod 600` when possible.
