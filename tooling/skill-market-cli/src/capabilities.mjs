import { ADAPTERS, assertEnum } from "./contracts.mjs";

export const CAPABILITY_LEVELS = Object.freeze([
  "native",
  "composed",
  "unsupported",
]);

export const NATIVE_PLUGIN_OPERATIONS = Object.freeze([
  "list",
  "install",
  "update",
  "enable",
  "disable",
  "uninstall",
  "validate",
]);

export class CapabilityValidationError extends Error {
  constructor(issues) {
    super(`adapter capability validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "CapabilityValidationError";
    this.issues = issues;
  }
}

function operation(level, detail) {
  return Object.freeze({ level, detail });
}

const BASELINES = {
  claude: {
    adapter: "claude",
    nativeCommand: "claude",
    plugin: {
      operations: Object.fromEntries(
        NATIVE_PLUGIN_OPERATIONS.map((name) => [name, operation("native", null)]),
      ),
      preserveInstallScope: true,
      requiresExplicitTrust: false,
    },
  },
  codex: {
    adapter: "codex",
    nativeCommand: "codex",
    plugin: {
      operations: {
        list: operation("native", null),
        install: operation("native", null),
        update: operation(
          "composed",
          "Use a guarded remove/install transaction that preserves source identity and restores the prior installation on failure.",
        ),
        enable: operation(
          "unsupported",
          "The Codex plugin CLI has no native enable operation.",
        ),
        disable: operation(
          "unsupported",
          "The Codex plugin CLI has no native disable operation.",
        ),
        uninstall: operation("native", null),
        validate: operation(
          "unsupported",
          "The Codex plugin CLI has no native plugin validation operation.",
        ),
      },
      preserveInstallScope: false,
      requiresExplicitTrust: false,
    },
  },
  grok: {
    adapter: "grok",
    nativeCommand: "grok",
    plugin: {
      operations: Object.fromEntries(
        NATIVE_PLUGIN_OPERATIONS.map((name) => [name, operation("native", null)]),
      ),
      preserveInstallScope: false,
      requiresExplicitTrust: true,
    },
  },
};

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const BASELINE_ADAPTER_CAPABILITIES = deepFreeze(BASELINES);

export function validateAdapterCapabilities(value) {
  const issues = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CapabilityValidationError(["capabilities must be an object"]);
  }

  if (!ADAPTERS.includes(value.adapter)) {
    issues.push(`adapter must be one of: ${ADAPTERS.join(", ")}`);
  }
  if (typeof value.nativeCommand !== "string" || value.nativeCommand.trim() === "") {
    issues.push("nativeCommand must be a non-empty string");
  }
  if (value.plugin === null || typeof value.plugin !== "object" || Array.isArray(value.plugin)) {
    issues.push("plugin must be an object");
  } else {
    const operations = value.plugin.operations;
    if (operations === null || typeof operations !== "object" || Array.isArray(operations)) {
      issues.push("plugin.operations must be an object");
    } else {
      for (const name of NATIVE_PLUGIN_OPERATIONS) {
        const capability = operations[name];
        if (capability === null || typeof capability !== "object" || Array.isArray(capability)) {
          issues.push(`plugin.operations.${name} must be an object`);
          continue;
        }
        if (!CAPABILITY_LEVELS.includes(capability.level)) {
          issues.push(
            `plugin.operations.${name}.level must be one of: ${CAPABILITY_LEVELS.join(", ")}`,
          );
        }
        if (
          capability.detail !== null &&
          (typeof capability.detail !== "string" || capability.detail.trim() === "")
        ) {
          issues.push(`plugin.operations.${name}.detail must be null or a non-empty string`);
        }
        if (capability.level !== "native" && !capability.detail) {
          issues.push(`plugin.operations.${name}.detail is required when level is not native`);
        }
      }
      const unknownOperations = Object.keys(operations).filter(
        (name) => !NATIVE_PLUGIN_OPERATIONS.includes(name),
      );
      if (unknownOperations.length > 0) {
        issues.push(`plugin.operations contains unknown operations: ${unknownOperations.join(", ")}`);
      }
    }
    for (const field of ["preserveInstallScope", "requiresExplicitTrust"]) {
      if (typeof value.plugin[field] !== "boolean") {
        issues.push(`plugin.${field} must be a boolean`);
      }
    }
  }

  if (issues.length > 0) {
    throw new CapabilityValidationError(issues);
  }
  return value;
}

export function getAdapterCapabilities(adapter) {
  assertEnum(adapter, ADAPTERS, "adapter");
  return structuredClone(validateAdapterCapabilities(BASELINE_ADAPTER_CAPABILITIES[adapter]));
}

for (const capabilities of Object.values(BASELINE_ADAPTER_CAPABILITIES)) {
  validateAdapterCapabilities(capabilities);
}
