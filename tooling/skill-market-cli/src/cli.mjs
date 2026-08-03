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

export function helpContract() {
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
          "--local-state": { type: "comma-separated enum", values: ["active", "disabled", "absent", "broken", "all"], default: "all" },
          "--ownership": { type: "comma-separated enum", values: ["native", "skill-market", "adopted", "all"], default: "all" },
          "--update-state": { type: "comma-separated enum", values: ["current", "update_available", "ahead", "unknown", "catalog_missing", "all"], default: "all" },
          "--offset": { type: "integer", range: ">= 0", default: 0 },
          "--limit": { type: "integer", range: "1..100", default: 20 },
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
    if (command === "config") {
      const parsed = parseOptions(argv.slice(1), CONFIG_OPTIONS);
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runConfig(parsed.positionals, services, env);
    }
    throw new SkillMarketError({
      code: "unknown-command",
      message: `Unknown Skill Market command: ${command}.`,
      details: { command, allowed: ["list", "discover", "config", "help"] },
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
