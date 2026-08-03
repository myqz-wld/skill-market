import { parseOptions, requirePositionals } from "./arguments.mjs";
import {
  configFileView,
  loadEffectiveConfig,
  parseConfigValue,
  updateConfig,
} from "./config.mjs";
import { failureResult, successResult } from "./contracts.mjs";
import { asSkillMarketError, SkillMarketError } from "./errors.mjs";
import {
  loadCatalogSnapshot,
  loadOptionalCatalogSnapshot,
} from "./cache.mjs";
import { collectLocalInventory } from "./inventory.mjs";
import { executeLifecycle } from "./lifecycle.mjs";
import { discoverCatalog, listInventory } from "./query.mjs";

export const CLI_VERSION = "0.1.0";

const GLOBAL_OPTIONS = {
  pretty: { key: "pretty", type: "boolean" },
  json: { key: "json", type: "boolean" },
  help: { key: "help", type: "boolean" },
};

const SOURCE_OPTIONS = {
  "read-repo-url": { key: "readRepoUrl", type: "value" },
  "base-ref": { key: "baseRef", type: "value" },
  "cache-path": { key: "cachePath", type: "value" },
  "cache-ttl-seconds": { key: "cacheTtlSeconds", type: "value" },
  "repo-path": { key: "repoPath", type: "value" },
};

const LIST_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...SOURCE_OPTIONS,
  adapter: { key: "adapters", type: "list" },
  kind: { key: "kinds", type: "list" },
  "local-state": { key: "localStates", type: "list" },
  ownership: { key: "ownership", type: "list" },
  "update-state": { key: "updateStates", type: "list" },
  history: { key: "history", type: "boolean" },
  offset: { key: "offset", type: "value" },
  limit: { key: "limit", type: "value" },
};

const DISCOVER_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...SOURCE_OPTIONS,
  adapter: { key: "adapters", type: "list" },
  kind: { key: "kinds", type: "list" },
  status: { key: "statuses", type: "list" },
  offset: { key: "offset", type: "value" },
  limit: { key: "limit", type: "value" },
  latest: { key: "latest", type: "boolean" },
  offline: { key: "offline", type: "boolean" },
};

const CONFIG_OPTIONS = { ...GLOBAL_OPTIONS };

const CATALOG_MUTATION_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...SOURCE_OPTIONS,
  "allow-stale-head": { key: "allowStaleHead", type: "value" },
};

const DOWNLOAD_OPTIONS = {
  ...CATALOG_MUTATION_OPTIONS,
  "allow-deprecated": { key: "allowDeprecated", type: "boolean" },
  destination: { key: "destination", type: "value" },
  force: { key: "force", type: "boolean" },
};

const INSTALL_OPTIONS = {
  ...CATALOG_MUTATION_OPTIONS,
  "allow-deprecated": { key: "allowDeprecated", type: "boolean" },
  adopt: { key: "adopt", type: "boolean" },
  "confirm-source-change": { key: "confirmSourceChange", type: "boolean" },
  "confirm-trust": { key: "confirmTrust", type: "boolean" },
  scope: { key: "scope", type: "value" },
};

const UPDATE_OPTIONS = {
  ...CATALOG_MUTATION_OPTIONS,
  force: { key: "force", type: "boolean" },
  "confirm-drift": { key: "confirmDrift", type: "boolean" },
  "confirm-source-change": { key: "confirmSourceChange", type: "boolean" },
  "confirm-reinstall": { key: "confirmReinstall", type: "boolean" },
  scope: { key: "scope", type: "value" },
};

const LOCAL_PROVENANCE_OPTIONS = {
  "read-repo-url": SOURCE_OPTIONS["read-repo-url"],
  "cache-path": SOURCE_OPTIONS["cache-path"],
  "repo-path": SOURCE_OPTIONS["repo-path"],
};

const ACTIVATION_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...LOCAL_PROVENANCE_OPTIONS,
  "confirm-drift": { key: "confirmDrift", type: "boolean" },
  "confirm-source-change": { key: "confirmSourceChange", type: "boolean" },
  scope: { key: "scope", type: "value" },
};

const UNINSTALL_OPTIONS = {
  ...ACTIVATION_OPTIONS,
  adopt: { key: "adopt", type: "boolean" },
  "remove-data": { key: "removeData", type: "boolean" },
};

const LIFECYCLE_DEFINITIONS = Object.freeze({
  download: DOWNLOAD_OPTIONS,
  install: INSTALL_OPTIONS,
  update: UPDATE_OPTIONS,
  enable: ACTIVATION_OPTIONS,
  disable: ACTIVATION_OPTIONS,
  uninstall: UNINSTALL_OPTIONS,
});

const LIFECYCLE_OPTION_KEYS = Object.freeze([
  "allowStaleHead",
  "allowDeprecated",
  "destination",
  "force",
  "adopt",
  "confirmDrift",
  "confirmSourceChange",
  "confirmTrust",
  "confirmReinstall",
  "scope",
  "removeData",
]);

function lifecycleHelpContract() {
  const stableId = {
    name: "id",
    type: "canonical package id",
    format: "<adapter>:<kind>:<kebab-case-name>",
    adapters: ["claude", "codex", "grok"],
    kinds: ["plugin", "standalone"],
    required: true,
  };
  const catalogMutation = [
    "--read-repo-url",
    "--base-ref",
    "--cache-path",
    "--cache-ttl-seconds",
    "--repo-path",
    "--allow-stale-head",
  ];
  const localSource = [
    "--read-repo-url",
    "--cache-path",
    "--repo-path",
  ];
  return {
    contract: {
      identity: stableId,
      localProvenanceOptions: "--read-repo-url, --cache-path, and --repo-path apply only to native plugin enable/disable/uninstall source verification; standalone local operations reject source overrides",
      catalogPolicy: {
        default: "download/install/update request the latest catalog and reject refresh failure; no automatic stale fallback",
        explicitStale: "--allow-stale-head pins the exact already-cached commit and forces offline mode; marker head, actual Git HEAD, and a clean cache worktree must agree",
        active: "eligible for download, install, and update",
        deprecated: "update is allowed; new download/install requires --allow-deprecated",
        disabled: "download/install/update are blocked",
        removed: "download/install/update are blocked; local disable/enable/uninstall remains available",
      },
      options: {
        "--allow-stale-head": {
          type: "lowercase commit id",
          format: "exactly 40 or 64 hexadecimal characters",
          default: null,
          appliesTo: ["download", "install", "update"],
          effect: "read the matching configured cache offline; reject any head mismatch",
        },
        "--allow-deprecated": {
          type: "boolean",
          default: false,
          appliesTo: ["download", "install"],
          effect: "accept a deprecated catalog entry for a new copy or installation",
        },
        "--destination": {
          type: "absolute path or ~/ path",
          default: "~/.skill-market/downloads/<adapter>/<kind>/<name>/<version>",
          appliesTo: ["download"],
          constraint: "must remain below ~/.skill-market/downloads (or the configured SKILL_MARKET_HOME downloads root)",
        },
        "--force": {
          type: "boolean",
          default: false,
          appliesTo: ["download", "update"],
          effect: "replace differing download content or reinstall an already-current package",
        },
        "--adopt": {
          type: "boolean",
          default: false,
          appliesTo: ["standalone install", "standalone uninstall"],
          effect: "authorize replacing or removing an exact unmanaged canonical package path after inspection",
        },
        "--confirm-drift": {
          type: "boolean",
          default: false,
          appliesTo: ["standalone update", "standalone enable", "standalone disable", "standalone uninstall"],
          effect: "authorize overwrite, move, or deletion after the local digest differs from managed state",
        },
        "--confirm-source-change": {
          type: "boolean",
          default: false,
          appliesTo: ["standalone update", "Grok plugin install/update/enable/disable/uninstall"],
          effect: "accept a verified source-identity change or missing/mismatched Grok provenance",
        },
        "--confirm-trust": {
          type: "boolean",
          default: false,
          appliesTo: ["Grok plugin install"],
          effect: "pass Grok --trust only after the caller inspected the exact catalog package",
        },
        "--confirm-reinstall": {
          type: "boolean",
          default: false,
          appliesTo: ["Codex plugin update"],
          effect: "authorize marketplace upgrade followed by remove/add and at most one add retry",
        },
        "--scope": {
          type: "enum",
          values: ["user", "project", "local", "managed"],
          default: "detected installed scope, otherwise user for a new install; missing installed scope blocks until --scope is explicit",
          appliesTo: ["Claude plugin install/update/enable/disable/uninstall"],
          constraints: [
            "install accepts user, project, or local",
            "managed is update-only; managed enable/disable/uninstall is controlled by policy",
            "an explicit scope cannot differ from a detected installed scope",
          ],
        },
        "--remove-data": {
          type: "boolean",
          default: false,
          appliesTo: ["Claude plugin uninstall", "Grok plugin uninstall"],
          effect: "omit the native --keep-data flag and allow native persistent plugin data removal",
        },
      },
      adapters: {
        codex: {
          pluginUpdate: "composed marketplace upgrade plus confirmed remove/add with one bounded add retry",
          pluginEnableDisable: "unsupported; uninstall is never substituted",
        },
        claude: {
          scope: "detect and preserve user/project/local/managed scope within native capability limits",
          persistentData: "kept by default on uninstall",
          updateWarning: "restart Claude Code to apply an updated plugin",
        },
        grok: {
          trust: "plugin install requires --confirm-trust",
          provenance: "installed source must match the effective repository or require --confirm-source-change",
          persistentData: "kept by default on uninstall",
        },
      },
      recovery: {
        "needs_confirmation": "inspect the exact details and retry only with the nextAction flag named by the error",
        blocked: "do not retry unchanged; repair source, catalog status, path topology, state, or rollback condition named by nextAction",
        unsupported: "choose the documented native alternative; do not emulate disable with uninstall",
        error: "retry only when error.retryable is true after completing error.nextAction",
        transaction: "successful rollback returns transaction-rolled-back; incomplete rollback returns rollback-failed and blocks further mutation",
      },
    },
    commands: {
      download: {
        purpose: "Copy one exact catalog package into the managed downloads area without installing it.",
        positionals: stableId,
        options: [...catalogMutation, "--allow-deprecated", "--destination", "--force"],
        sideEffects: "May refresh the catalog cache and atomically create or replace only the resolved download destination; never changes installed package state.",
        idempotent: "matching content is noop; different content requires --force",
      },
      install: {
        purpose: "Install one exact catalog plugin or standalone skill with adapter-specific safety gates.",
        positionals: stableId,
        options: [...catalogMutation, "--allow-deprecated", "--adopt", "--confirm-source-change", "--confirm-trust", "--scope"],
        sideEffects: "May refresh the catalog cache; invokes the selected native plugin CLI or atomically writes one canonical standalone path plus managed state.",
        idempotent: "matching existing installation is noop; version/content mismatch routes to update",
      },
      update: {
        purpose: "Update one installed package from an eligible catalog entry while preserving activation and native scope.",
        positionals: stableId,
        options: [...catalogMutation, "--force", "--confirm-drift", "--confirm-source-change", "--confirm-reinstall", "--scope"],
        sideEffects: "Refreshes or pins the catalog, then invokes the selected native updater or atomically swaps standalone content and managed state.",
        idempotent: "current matching content is noop unless --force",
      },
      enable: {
        purpose: "Enable one installed package without fetching catalog content.",
        positionals: stableId,
        options: [...localSource, "--confirm-drift", "--confirm-source-change", "--scope"],
        sideEffects: "Moves one managed standalone directory or invokes the native adapter; Codex plugins return unsupported.",
        idempotent: "already active is noop",
      },
      disable: {
        purpose: "Disable one installed package while preserving its files and persistent data.",
        positionals: stableId,
        options: [...localSource, "--confirm-drift", "--confirm-source-change", "--scope"],
        sideEffects: "Moves one managed standalone directory or invokes the native adapter; Codex plugins return unsupported.",
        idempotent: "already disabled is noop",
      },
      uninstall: {
        purpose: "Remove one installed package while retaining standalone history and native persistent data by default.",
        positionals: stableId,
        options: [...localSource, "--adopt", "--confirm-drift", "--confirm-source-change", "--scope", "--remove-data"],
        sideEffects: "Atomically removes an exact standalone path and records absent history, or invokes native uninstall; --remove-data expands native deletion for Claude/Grok.",
        idempotent: "already absent is noop",
      },
    },
  };
}

export function helpContract() {
  const lifecycle = lifecycleHelpContract();
  return {
    contractVersion: 1,
    version: CLI_VERSION,
    output: {
      format: "one JSON object on stdout; --pretty adds indentation only",
      success: {
        schemaVersion: "1",
        ok: "true",
        status: "ok | noop",
        command: "string",
        summary: "string",
        data: "command-specific object | null",
      },
      failure: {
        schemaVersion: "1",
        ok: "false",
        status: "needs_confirmation | blocked | unsupported | error",
        command: "string",
        error: {
          code: "stable kebab-case string",
          message: "self-contained failure message",
          retryable: "boolean",
          nextAction: "string | null",
          details: "object | null",
        },
      },
    },
    globalOptions: {
      "--json": { type: "boolean", default: true, effect: "accepted for explicitness; output is always JSON" },
      "--pretty": { type: "boolean", default: false, effect: "indent JSON by two spaces" },
      "--help": { type: "boolean", default: false, effect: "return this contract" },
    },
    commands: {
      list: {
        purpose: "List local Skill Market native plugins and managed standalone skills without network refresh.",
        positionals: { type: "none", required: false },
        options: {
          "--adapter": { type: "comma-separated enum", values: ["claude", "codex", "grok", "all"], default: "all" },
          "--kind": { type: "comma-separated enum", values: ["plugin", "standalone", "all"], default: "all" },
          "--local-state": { type: "comma-separated enum", values: ["active", "disabled", "absent", "broken", "all"], default: "active,disabled,broken" },
          "--ownership": { type: "comma-separated enum", values: ["native", "skill-market", "adopted", "all"], default: "all" },
          "--update-state": { type: "comma-separated enum", values: ["current", "update_available", "ahead", "unknown", "catalog_missing", "all"], default: "all" },
          "--offset": { type: "integer", range: ">= 0", default: 0 },
          "--limit": { type: "integer", range: "1..100", default: 20 },
          "--history": { type: "boolean", default: false, effect: "include expected absent standalone uninstall records; required when --local-state explicitly selects absent" },
        },
        sideEffects: "Runs adapter-native plugin list commands and reads managed state. It never clones, fetches, or writes config/cache/package state.",
        idempotent: true,
      },
      discover: {
        purpose: "Browse or search the canonical catalog; exact, prefix, token, then description ranking.",
        positionals: { name: "query", type: "string", required: false, default: "" },
        options: {
          "--adapter": { type: "comma-separated enum", values: ["claude", "codex", "grok", "all"], default: "all" },
          "--kind": { type: "comma-separated enum", values: ["plugin", "standalone", "all"], default: "all" },
          "--status": { type: "comma-separated enum", values: ["active", "deprecated", "disabled", "removed", "all"], default: "active" },
          "--latest": { type: "boolean", default: false },
          "--offline": { type: "boolean", default: false },
          "--offset": { type: "integer", range: ">= 0", default: 0 },
          "--limit": { type: "integer", range: "1..100", default: 20 },
        },
        constraints: ["--latest and --offline are mutually exclusive"],
        sideEffects: "May clone or refresh only the configured catalog cache and its marker. It reads local inventory annotations but never changes installed packages.",
        stalePolicy: "Refresh failure may return the existing cache with freshness=stale and a warning; source/ref mismatches always block.",
        idempotent: true,
      },
      ...lifecycle.commands,
      config: {
        purpose: "Inspect or explicitly change Skill Market configuration.",
        actions: {
          show: { positionals: [], writes: false },
          set: { positionals: ["key", "value"], writes: "atomically replaces that explicit config field" },
          unset: { positionals: ["key"], writes: "atomically removes that explicit config field" },
        },
        keys: ["readRepoUrl", "baseRef", "cachePath", "cacheTtlSeconds", "repoPath"],
        precedence: "command override > environment > config file > in-memory default",
        idempotent: true,
      },
    },
    lifecycle: lifecycle.contract,
    sourceOptions: {
      "--read-repo-url": { type: "HTTPS URL without embedded credentials", default: "https://github.com/myqz-wld/skill-market.git" },
      "--base-ref": { type: "safe Git ref", default: "main" },
      "--cache-path": { type: "absolute path or ~/ path", default: "~/.skill-market/cache/skill-market" },
      "--cache-ttl-seconds": { type: "non-negative integer", default: 86400, zero: "disable automatic refresh and report cached data as stale" },
      "--repo-path": { type: "absolute path or ~/ path | null", default: null, effect: "read this checkout directly and skip cache/network behavior" },
    },
    environment: {
      SKILL_MARKET_HOME: "absolute or ~/ state root",
      SKILL_MARKET_CONFIG: "absolute or ~/ config JSON path",
      SKILL_MARKET_READ_REPO_URL: "readRepoUrl override",
      SKILL_MARKET_BASE_REF: "baseRef override",
      SKILL_MARKET_CACHE_PATH: "cachePath override",
      SKILL_MARKET_CACHE_TTL_SECONDS: "cacheTtlSeconds override",
      SKILL_MARKET_REPO_PATH: "repoPath override",
    },
    exitCodes: { ok: 0, error: 1, needsConfirmation: 2, blocked: 3, unsupported: 4 },
  };
}

function sourceOverrides(options) {
  return Object.fromEntries(
    ["readRepoUrl", "baseRef", "cachePath", "cacheTtlSeconds", "repoPath"]
      .filter((key) => options[key] !== undefined)
      .map((key) => [key, options[key]]),
  );
}

function lifecycleOptions(options) {
  const selected = Object.fromEntries(
    LIFECYCLE_OPTION_KEYS
      .filter((key) => options[key] !== undefined)
      .map((key) => [key, options[key]]),
  );
  const overrides = sourceOverrides(options);
  if (Object.keys(overrides).length > 0) {
    selected.sourceOverrides = overrides;
  }
  return selected;
}

async function runList(options, services, env) {
  const validated = listInventory({
    inventory: {
      items: [],
      warnings: [],
      catalog: { loaded: false, freshness: null, source: null },
    },
    ...options,
  });
  const effective = await services.loadEffectiveConfig({
    env,
    overrides: sourceOverrides(options),
  });
  const optional = await services.loadOptionalCatalogSnapshot({
    config: effective.values,
    now: services.now,
  });
  const inventory = await services.collectLocalInventory({
    adapters: validated.filters.adapters,
    kinds: validated.filters.kinds,
    statePath: effective.paths.managedStatePath,
    catalogSnapshot: optional.snapshot,
    nativeReader: services.nativeReader,
    env,
  });
  inventory.warnings.push(...optional.warnings);
  const data = listInventory({ inventory, ...options });
  return successResult({
    command: "list",
    status: data.page.total === 0 ? "noop" : "ok",
    summary: `${data.page.count} of ${data.page.total} local Skill Market packages returned.`,
    data,
  });
}

async function runDiscover(options, positionals, services, env) {
  const query = positionals.join(" ");
  const validated = discoverCatalog({
    catalog: { packages: [] },
    inventoryItems: [],
    freshness: null,
    query,
    ...options,
  });
  const effective = await services.loadEffectiveConfig({
    env,
    overrides: sourceOverrides(options),
  });
  const snapshot = await services.loadCatalogSnapshot({
    config: effective.values,
    latest: Boolean(options.latest),
    offline: Boolean(options.offline),
    git: services.git,
    now: services.now,
  });
  const inventory = await services.collectLocalInventory({
    adapters: validated.filters.adapters,
    kinds: validated.filters.kinds,
    statePath: effective.paths.managedStatePath,
    catalogSnapshot: snapshot,
    nativeReader: services.nativeReader,
    env,
  });
  const result = discoverCatalog({
    catalog: snapshot.catalog,
    inventoryItems: inventory.items,
    freshness: snapshot.freshness,
    query,
    ...options,
  });
  const data = {
    ...result,
    source: snapshot.source,
    warnings: [...snapshot.warnings, ...inventory.warnings],
  };
  return successResult({
    command: "discover",
    status: data.page.total === 0 ? "noop" : "ok",
    summary: `${data.page.count} of ${data.page.total} catalog packages returned.`,
    data,
  });
}

async function runLifecycle(operation, options, positionals, services, env) {
  const [id] = requirePositionals(positionals, {
    min: 1,
    usage: `${operation} <adapter>:<kind>:<name> [options]`,
  });
  const result = await services.executeLifecycle({
    operation,
    id,
    options: lifecycleOptions(options),
    env,
  });
  return successResult({
    command: operation,
    status: result.status,
    summary: result.summary,
    data: {
      ...(result.data ?? {}),
      warnings: result.warnings ?? [],
    },
  });
}

async function runConfig(positionals, services, env) {
  const [action = "show", ...values] = positionals;
  if (action === "show") {
    requirePositionals(values, { min: 0, usage: "config show" });
    const effective = await services.loadEffectiveConfig({ env });
    return successResult({
      command: "config show",
      summary: effective.configExists
        ? "Effective Skill Market configuration loaded."
        : "Using in-memory Skill Market defaults; no config file exists.",
      data: configFileView(effective),
    });
  }
  if (action === "set") {
    const [key, rawValue] = requirePositionals(values, {
      min: 2,
      usage: "config set <key> <value>",
    });
    const result = await services.updateConfig({
      env,
      patch: { [key]: parseConfigValue(key, rawValue) },
    });
    return successResult({
      command: "config set",
      summary: `Saved ${key} in explicit Skill Market config.`,
      data: result,
    });
  }
  if (action === "unset") {
    const [key] = requirePositionals(values, {
      min: 1,
      usage: "config unset <key>",
    });
    parseConfigValue(key, "0");
    const result = await services.updateConfig({ env, unset: [key] });
    return successResult({
      command: "config unset",
      summary: `Removed ${key} from explicit Skill Market config.`,
      data: result,
    });
  }
  throw new SkillMarketError({
    code: "unknown-config-action",
    message: `Unknown config action: ${action}.`,
    details: { action, allowed: ["show", "set", "unset"] },
    nextAction: "Use config show, config set <key> <value>, or config unset <key>.",
  });
}

function servicesWithDefaults(dependencies) {
  return {
    loadEffectiveConfig,
    loadOptionalCatalogSnapshot,
    loadCatalogSnapshot,
    collectLocalInventory,
    executeLifecycle,
    updateConfig,
    nativeReader: undefined,
    git: undefined,
    now: () => Date.now(),
    ...dependencies,
  };
}

export async function runCli(argv, { env = process.env, ...dependencies } = {}) {
  const command = argv[0] ?? "help";
  const services = servicesWithDefaults(dependencies);
  try {
    if (command === "help" || command === "--help" || command === "-h") {
      return successResult({
        command: "help",
        summary: "Skill Market CLI command contract.",
        data: helpContract(),
      });
    }
    if (command === "--version") {
      return successResult({ command: "version", summary: CLI_VERSION, data: { version: CLI_VERSION } });
    }
    if (command === "list") {
      const parsed = parseOptions(argv.slice(1), LIST_OPTIONS);
      requirePositionals(parsed.positionals, { min: 0, usage: "list [options]" });
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runList(parsed.options, services, env);
    }
    if (command === "discover") {
      const parsed = parseOptions(argv.slice(1), DISCOVER_OPTIONS);
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runDiscover(parsed.options, parsed.positionals, services, env);
    }
    if (Object.hasOwn(LIFECYCLE_DEFINITIONS, command)) {
      const parsed = parseOptions(argv.slice(1), LIFECYCLE_DEFINITIONS[command]);
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runLifecycle(command, parsed.options, parsed.positionals, services, env);
    }
    if (command === "config") {
      const parsed = parseOptions(argv.slice(1), CONFIG_OPTIONS);
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runConfig(parsed.positionals, services, env);
    }
    throw new SkillMarketError({
      code: "unknown-command",
      message: `Unknown Skill Market command: ${command}.`,
      details: {
        command,
        allowed: [
          "list",
          "discover",
          "download",
          "install",
          "update",
          "enable",
          "disable",
          "uninstall",
          "config",
          "help",
        ],
      },
      nextAction: "Run skill-market help and choose a canonical command.",
    });
  } catch (error) {
    const failure = asSkillMarketError(error);
    return failureResult({
      command,
      code: failure.code,
      message: failure.message,
      status: failure.status,
      retryable: failure.retryable,
      nextAction: failure.nextAction,
      details: failure.details,
    });
  }
}
