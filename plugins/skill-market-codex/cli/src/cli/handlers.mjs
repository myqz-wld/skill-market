import { requirePositionals } from "./arguments.mjs";
import { configFileView, parseConfigValue } from "../shared/config.mjs";
import { successResult } from "../shared/contracts.mjs";
import { SkillMarketError } from "../shared/errors.mjs";
import { discoverCatalog, listInventory } from "../catalog/query.mjs";
import { SOURCE_OPTION_KEYS, LIFECYCLE_OPTION_KEYS } from "./registry.mjs";

function sourceOverrides(options) {
  return Object.fromEntries(
    SOURCE_OPTION_KEYS
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

export async function runList(options, services, env) {
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

export async function runDiscover(options, positionals, services, env) {
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

export async function runLifecycle(operation, options, positionals, services, env) {
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

function invalidProposalOptions(issue, details) {
  throw new SkillMarketError({
    code: "invalid-arguments",
    message: `Invalid proposal arguments: ${issue}.`,
    details,
    nextAction: "Run skill-market help, inspect commands.proposal, and retry with the documented action shape.",
  });
}

function validateSubmitOptions(options) {
  const mode = options.pushMode ?? "auto";
  if (!["auto", "direct", "fork"].includes(mode)) {
    invalidProposalOptions("--push-mode must be auto, direct, or fork", {
      option: "push-mode",
      value: options.pushMode,
    });
  }
  if (mode === "direct" && (options.forkPushUrl || options.headOwner)) {
    invalidProposalOptions("--fork-push-url and --head-owner do not apply to direct mode", {
      pushMode: mode,
      forkPushUrl: options.forkPushUrl ?? null,
      headOwner: options.headOwner ?? null,
    });
  }
  if (mode === "fork" && options.pushUrl) {
    invalidProposalOptions("--push-url does not apply to fork mode", {
      pushMode: mode,
      pushUrl: options.pushUrl,
    });
  }
  if (options.headOwner && !options.forkPushUrl) {
    invalidProposalOptions("--head-owner requires --fork-push-url", {
      headOwner: options.headOwner,
    });
  }
}

export async function runProposal(action, options, positionals, services, env) {
  let result;
  if (action === "plan") {
    requirePositionals(positionals, { min: 0, usage: "proposal plan --spec <json-file>" });
    if (!options.specPath) {
      invalidProposalOptions("proposal plan requires --spec <json-file>", {
        action,
        required: ["--spec"],
      });
    }
    result = await services.planProposal({
      specPath: options.specPath,
      options,
      env,
    });
  } else {
    const [id] = requirePositionals(positionals, {
      min: 1,
      usage: `proposal ${action} <proposal-id> [options]`,
    });
    if (action === "prepare") {
      result = await services.prepareProposal({ id, env });
    } else if (action === "submit") {
      validateSubmitOptions(options);
      result = await services.submitProposal({ id, options, env });
    } else if (action === "status") {
      result = await services.statusProposal({ id, env });
    } else {
      result = await services.abortProposal({ id, options, env });
    }
  }
  return successResult({
    command: `proposal ${action}`,
    status: result.status,
    summary: result.summary,
    data: result.data,
  });
}

export async function runConfig(positionals, services, env) {
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
