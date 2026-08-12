const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ADAPTERS = Object.freeze(["claude", "codex", "grok"]);
export const PACKAGE_KINDS = Object.freeze(["plugin", "standalone"]);
export const CATALOG_STATUSES = Object.freeze([
  "active",
  "deprecated",
  "disabled",
  "removed",
]);
export const LOCAL_STATES = Object.freeze([
  "active",
  "disabled",
  "absent",
  "broken",
]);
export const OWNERSHIP_STATES = Object.freeze([
  "native",
  "skill-market",
  "adopted",
]);
export const UPDATE_STATES = Object.freeze([
  "current",
  "update_available",
  "ahead",
  "unknown",
  "catalog_missing",
]);
export const FRESHNESS_STATES = Object.freeze([
  "fresh",
  "stale",
  "local_override",
]);
export const RESULT_STATUSES = Object.freeze([
  "ok",
  "noop",
  "needs_confirmation",
  "blocked",
  "unsupported",
  "error",
]);

export function isKebabCase(value) {
  return typeof value === "string" && KEBAB_CASE.test(value);
}

export function assertEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new TypeError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value;
}

export function makePackageId(adapter, kind, name) {
  assertEnum(adapter, ADAPTERS, "adapter");
  assertEnum(kind, PACKAGE_KINDS, "kind");
  if (!isKebabCase(name)) {
    throw new TypeError("name must be kebab-case");
  }
  return `${adapter}:${kind}:${name}`;
}

export function parsePackageId(id) {
  if (typeof id !== "string") {
    throw new TypeError("package id must be a string");
  }
  const parts = id.split(":");
  if (parts.length !== 3) {
    throw new TypeError("package id must be <adapter>:<kind>:<name>");
  }
  const [adapter, kind, name] = parts;
  const canonical = makePackageId(adapter, kind, name);
  if (canonical !== id) {
    throw new TypeError(`package id is not canonical: ${id}`);
  }
  return Object.freeze({ adapter, kind, name, id });
}

export function successResult({ command, data = null, status = "ok", summary }) {
  if (!command || typeof command !== "string") {
    throw new TypeError("command is required");
  }
  assertEnum(status, ["ok", "noop"], "status");
  return {
    schemaVersion: 1,
    ok: true,
    status,
    command,
    summary: String(summary ?? ""),
    data,
  };
}

export function failureResult({
  command,
  code,
  message,
  status = "error",
  retryable = false,
  nextAction = null,
  details = null,
}) {
  if (!command || typeof command !== "string") {
    throw new TypeError("command is required");
  }
  if (!isKebabCase(code)) {
    throw new TypeError("error code must be kebab-case");
  }
  assertEnum(
    status,
    ["needs_confirmation", "blocked", "unsupported", "error"],
    "status",
  );
  return {
    schemaVersion: 1,
    ok: false,
    status,
    command,
    error: {
      code,
      message: String(message ?? ""),
      retryable: Boolean(retryable),
      nextAction,
      details,
    },
  };
}
