import { SkillMarketError } from "./errors.mjs";

const OPTION_RULES = Object.freeze({
  allowDeprecated: ({ operation }) => ["download", "install"].includes(operation),
  allowStaleHead: ({ operation }) => ["download", "install", "update"].includes(operation),
  destination: ({ operation }) => operation === "download",
  force: ({ operation }) => ["download", "update"].includes(operation),
  adopt: ({ operation, identity }) =>
    identity.kind === "standalone" && ["install", "uninstall"].includes(operation),
  confirmDrift: ({ operation, identity }) =>
    identity.kind === "standalone" &&
    ["update", "enable", "disable", "uninstall"].includes(operation),
  confirmSourceChange: ({ operation, identity }) =>
    (identity.kind === "standalone" && operation === "update") ||
    (identity.kind === "plugin" &&
      identity.adapter === "grok" &&
      ["install", "update", "enable", "disable", "uninstall"].includes(operation)),
  confirmTrust: ({ operation, identity }) =>
    identity.kind === "plugin" && identity.adapter === "grok" && operation === "install",
  confirmReinstall: ({ operation, identity }) =>
    identity.kind === "plugin" && identity.adapter === "codex" && operation === "update",
  scope: ({ operation, identity }) =>
    identity.kind === "plugin" &&
    identity.adapter === "claude" &&
    ["install", "update", "enable", "disable", "uninstall"].includes(operation),
  removeData: ({ operation, identity }) =>
    identity.kind === "plugin" &&
    ["claude", "grok"].includes(identity.adapter) &&
    operation === "uninstall",
  sourceOverrides: ({ operation, identity }) =>
    ["download", "install", "update"].includes(operation) ||
    (identity.kind === "plugin" && ["enable", "disable", "uninstall"].includes(operation)),
});

function isSupplied(value) {
  return value !== undefined && value !== null && value !== false;
}

export function validateLifecycleOptions({ operation, identity, options }) {
  const unknown = Object.keys(options).filter((name) => !(name in OPTION_RULES));
  if (unknown.length > 0) {
    throw invalidOptions(operation, identity, unknown, "unknown lifecycle options");
  }
  if (
    options.sourceOverrides !== undefined &&
    (options.sourceOverrides === null ||
      typeof options.sourceOverrides !== "object" ||
      Array.isArray(options.sourceOverrides))
  ) {
    throw invalidOptions(
      operation,
      identity,
      ["sourceOverrides"],
      "sourceOverrides must be an object",
    );
  }
  const unknownSourceFields = Object.keys(options.sourceOverrides ?? {}).filter(
    (name) =>
      !["readRepoUrl", "baseRef", "cachePath", "cacheTtlSeconds", "repoPath"].includes(name),
  );
  if (unknownSourceFields.length > 0) {
    throw invalidOptions(
      operation,
      identity,
      unknownSourceFields,
      "unknown source override fields",
    );
  }
  const incompatible = Object.entries(options)
    .filter(([, value]) => isSupplied(value))
    .map(([name]) => name)
    .filter((name) => !OPTION_RULES[name]({ operation, identity }));
  if (incompatible.length > 0) {
    throw invalidOptions(
      operation,
      identity,
      incompatible,
      "options do not apply to this adapter, package kind, or operation",
    );
  }
  if (
    options.sourceOverrides &&
    !["download", "install", "update"].includes(operation)
  ) {
    const irrelevant = Object.keys(options.sourceOverrides).filter(
      (name) => !["readRepoUrl", "cachePath", "repoPath"].includes(name),
    );
    if (irrelevant.length > 0) {
      throw invalidOptions(
        operation,
        identity,
        irrelevant,
        "local native provenance does not use these source fields",
      );
    }
  }
  return options;
}

function invalidOptions(operation, identity, options, issue) {
  return new SkillMarketError({
    code: "invalid-option-combination",
    message: `Invalid lifecycle option combination: ${issue}: ${options.join(", ")}.`,
    details: { operation, id: identity.id, options },
    nextAction: "Remove the incompatible options and use the exact command contract from skill-market help.",
  });
}
