#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import os
import stat
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = SKILL_ROOT / "config.json"
DEFAULT_SOURCE = "NINEDATA_SKILL"
VERSION = "1.0.0"
SECRET_KEYS = {"accessKeyId", "accessKeySecret", "signature", "access-key-id"}


def eprint(*args):
    print(*args, file=sys.stderr)


def fail(exit_code, code, message, detail=None, stderr_message=None):
    payload = {"ok": False, "error": {"code": code, "message": message}}
    if detail is not None:
        payload["error"]["detail"] = sanitize(detail)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if stderr_message:
        eprint(stderr_message)
    sys.exit(exit_code)


def sanitize(value):
    if isinstance(value, dict):
        return {
            k: ("***" if str(k) in SECRET_KEYS else sanitize(v))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [sanitize(v) for v in value]
    return value


def resolve_config_path(path):
    if path:
        return Path(path).expanduser()
    if os.environ.get("NINEDATA_SKILL_CONFIG"):
        return Path(os.environ["NINEDATA_SKILL_CONFIG"]).expanduser()
    return DEFAULT_CONFIG


def load_config(path):
    config_path = resolve_config_path(path)
    if not config_path.exists():
        fail(10, "CONFIG_ERROR", f"Configuration file does not exist: {config_path}")
    try:
        mode = stat.S_IMODE(config_path.stat().st_mode)
        if mode & 0o077:
            eprint(f"Warning: configuration file should be chmod 600: {config_path}")
    except Exception:
        pass
    try:
        with config_path.open("r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception as exc:
        fail(10, "CONFIG_ERROR", "Configuration file is not valid JSON", str(exc))
    return cfg, str(config_path)


def get_runtime_config(cfg):
    if not isinstance(cfg, dict):
        fail(10, "CONFIG_ERROR", "Configuration root must be a JSON object")
    required = ["endpoint", "accessKeyId", "accessKeySecret"]
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        fail(10, "CONFIG_ERROR", f"Configuration is missing required fields: {', '.join(missing)}")
    return cfg


def timestamp_utc():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sign(path, access_key_secret, timestamp):
    message = f"{path}/{access_key_secret}&{timestamp}"
    return hashlib.sha256(message.encode("utf-8")).hexdigest()


def request(config, method, path, query=None, body=None, timeout=60):
    endpoint = config["endpoint"].rstrip("/")
    ts = timestamp_utc()
    signature = sign(path, config["accessKeySecret"], ts)

    url = endpoint + path
    if query:
        clean_query = {k: v for k, v in query.items() if v is not None and v != ""}
        if clean_query:
            url += "?" + urllib.parse.urlencode(clean_query)

    headers = {
        "access-key-id": config["accessKeyId"],
        "timestamp": ts,
        "signature": signature,
    }

    data = None
    if method.upper() == "POST":
        headers["Content-Type"] = "application/json"
        data = json.dumps(body or {}, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        fail(30, "HTTP_ERROR", f"HTTP request failed: {exc.code}", safe_response_text(text))
    except Exception as exc:
        fail(20, "NETWORK_ERROR", "Network request failed", str(exc))

    try:
        return json.loads(text)
    except Exception:
        fail(30, "HTTP_ERROR", "Response is not valid JSON", safe_response_text(text))


def print_json(obj):
    print(json.dumps(sanitize(obj), ensure_ascii=False, indent=2))


def safe_response_text(text):
    try:
        return sanitize(json.loads(text))
    except Exception:
        return text


def require_args(args, names):
    missing = [name for name in names if not getattr(args, name)]
    if missing:
        fail(40, "ARGUMENT_ERROR", "Missing required argument(s): " + ", ".join("--" + name.replace("_", "-") for name in missing))


class JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message):
        fail(40, "ARGUMENT_ERROR", message, stderr_message=self.format_usage().strip())


def validate_config(args):
    cfg, path = load_config(args.config)
    config = get_runtime_config(cfg)
    result = {
        "ok": True,
        "configPath": path,
        "endpoint": config["endpoint"].rstrip("/"),
        "hasAccessKeyId": bool(config.get("accessKeyId")),
        "hasAccessKeySecret": bool(config.get("accessKeySecret")),
        "hasDefaultDsId": bool(config.get("defaultDsId")),
        "defaultDsId": config.get("defaultDsId"),
        "hasDefaultDbName": bool(config.get("defaultDbName")),
        "defaultDbName": config.get("defaultDbName"),
        "hasDefaultSchemaName": bool(config.get("defaultSchemaName")),
        "defaultSchemaName": config.get("defaultSchemaName"),
        "source": config.get("source", DEFAULT_SOURCE),
        "defaultLanguage": config.get("defaultLanguage", "enus"),
        "defaultPageSize": config.get("defaultPageSize", 50),
    }
    if args.check_now:
        result["serverTimeCheck"] = request(config, "GET", "/openapi/now", timeout=args.timeout)
    print_json(result)


def list_datasource(args):
    cfg, _ = load_config(args.config)
    config = get_runtime_config(cfg)
    query = {
        "datasourceId": args.datasource_id,
        "datasourceType": args.datasource_type,
        "keyword": args.keyword,
        "current": args.current,
        "pageSize": args.page_size,
    }
    print_json(request(config, "GET", "/openapi/v1/datasource/list", query=query, timeout=args.timeout))


def read_sql(args):
    if args.sql and args.sql_file:
        fail(40, "ARGUMENT_ERROR", "Use only one of --sql and --sql-file")
    if args.sql:
        return args.sql
    if args.sql_file:
        try:
            with open(args.sql_file, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as exc:
            fail(40, "ARGUMENT_ERROR", f"Failed to read SQL file: {args.sql_file}", str(exc))
    fail(40, "ARGUMENT_ERROR", "Missing --sql or --sql-file")


def sql_execute(args):
    cfg, _ = load_config(args.config)
    config = get_runtime_config(cfg)
    require_args(args, ["reason", "source_client"])
    datasource_id = args.datasource_id or config.get("defaultDsId")
    database_name = args.database_name or config.get("defaultDbName")
    schema_name = args.schema_name or config.get("defaultSchemaName")
    sql = read_sql(args).strip()
    if not sql:
        fail(40, "ARGUMENT_ERROR", "SQL is empty")

    body = {
        "datasourceId": datasource_id,
        "dbType": args.db_type,
        "databaseName": database_name,
        "schemaName": schema_name,
        "clusterName": args.cluster_name,
        "sql": sql,
        "current": args.current,
        "pageSize": args.page_size or config.get("defaultPageSize", 50),
        "clientConfirmed": args.client_confirmed,
        "ignoreTips": True,
        "useSessionPersistence": args.use_session_persistence,
        "reason": args.reason,
        "source": config.get("source", DEFAULT_SOURCE),
        "toolId": "sql-execute",
        "sourceClient": args.source_client,
        "sourceSessionId": args.source_session_id,
        "skillVersion": VERSION,
        "language": args.language or config.get("defaultLanguage", "enus"),
    }
    body = {k: v for k, v in body.items() if v is not None and v != ""}
    if not body.get("datasourceId"):
        fail(40, "ARGUMENT_ERROR", "Missing --datasource-id and config.defaultDsId")
    for key in ("datasourceId", "sql", "reason", "sourceClient"):
        if not body.get(key):
            fail(40, "ARGUMENT_ERROR", f"Missing required request field: {key}")
    print_json(request(config, "POST", "/openapi/v1/sql/execute", body=body, timeout=args.timeout))


def add_common_arguments(parser):
    parser.add_argument("--config", default=None)
    return parser


def add_parser(subparsers, name):
    return subparsers.add_parser(name)


def main():
    parser = JsonArgumentParser(prog="ninedata")
    sub = parser.add_subparsers(dest="cmd", parser_class=JsonArgumentParser)

    p = add_common_arguments(add_parser(sub, "validate-config"))
    p.add_argument("--check-now", action="store_true")
    p.add_argument("--timeout", type=int, default=20)
    p.set_defaults(func=validate_config)

    p = add_common_arguments(add_parser(sub, "list-datasource"))
    p.add_argument("--datasource-id")
    p.add_argument("--datasource-type")
    p.add_argument("--keyword")
    p.add_argument("--current", type=int, default=1)
    p.add_argument("--page-size", type=int, default=20)
    p.add_argument("--timeout", type=int, default=60)
    p.set_defaults(func=list_datasource)

    p = add_common_arguments(add_parser(sub, "sql-execute"))
    p.add_argument("--datasource-id")
    p.add_argument("--db-type")
    p.add_argument("--database-name")
    p.add_argument("--schema-name")
    p.add_argument("--cluster-name")
    p.add_argument("--sql")
    p.add_argument("--sql-file")
    p.add_argument("--current", type=int, default=1)
    p.add_argument("--page-size", type=int)
    p.add_argument("--client-confirmed", action="store_true")
    p.add_argument("--use-session-persistence", action="store_true")
    p.add_argument("--reason")
    p.add_argument("--source-client")
    p.add_argument("--source-session-id")
    p.add_argument("--language")
    p.add_argument("--timeout", type=int, default=120)
    p.set_defaults(func=sql_execute)

    args = parser.parse_args()
    if not args.cmd:
        fail(40, "ARGUMENT_ERROR", "Missing command", stderr_message=parser.format_usage().strip())
    args.func(args)


if __name__ == "__main__":
    main()
