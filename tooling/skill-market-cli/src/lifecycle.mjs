import path from "node:path";

import { loadCatalogSnapshot } from "./cache.mjs";
import { loadEffectiveConfig } from "./config.mjs";
import { parsePackageId } from "./contracts.mjs";
import { downloadPackage } from "./download.mjs";
import { SkillMarketError } from "./errors.mjs";
import { expandHomePath } from "./paths.mjs";
import {
  loadMutationSnapshot,
  resolveCatalogEntry,
} from "./lifecycle-source.mjs";
import { assertPathInside } from "./lifecycle-paths.mjs";
import { validateLifecycleOptions } from "./lifecycle-options.mjs";
import { runNativePluginLifecycle } from "./native-adapters.mjs";
import { validatePackageContent } from "./package-content.mjs";
import {
  installStandalone,
  setStandaloneActivation,
  uninstallStandalone,
  updateStandalone,
} from "./standalone-lifecycle.mjs";

const CATALOG_OPERATIONS = new Set(["download", "install", "update"]);
const LOCAL_OPERATIONS = new Set(["enable", "disable", "uninstall"]);

function localPluginEntry(identity) {
  const manifestDirectory = `.${identity.adapter}-plugin`;
  return {
    id: identity.id,
    adapter: identity.adapter,
    kind: "plugin",
    name: identity.name,
    version: null,
    path: `plugins/${identity.name}`,
    manifestPath: `${manifestDirectory}/plugin.json`,
  };
}

function lifecycleIdentity(id) {
  try {
    return parsePackageId(id);
  } catch (error) {
    throw new SkillMarketError({
      code: "invalid-package-id",
      message: `Invalid package id: ${id}.`,
      details: { id, expected: "<adapter>:<kind>:<kebab-case-name>" },
      nextAction: "Run discover or list and copy an exact canonical package id.",
      cause: error,
    });
  }
}

export async function executeLifecycle({
  operation,
  id,
  options = {},
  env = process.env,
  dependencies = {},
}) {
  if (!CATALOG_OPERATIONS.has(operation) && !LOCAL_OPERATIONS.has(operation)) {
    throw new SkillMarketError({
      code: "unknown-lifecycle-operation",
      message: `Unsupported lifecycle operation: ${operation}.`,
      details: { operation },
      nextAction: "Use download, install, update, enable, disable, or uninstall.",
    });
  }
  const identity = lifecycleIdentity(id);
  validateLifecycleOptions({ operation, identity, options });
  const loadConfig = dependencies.loadEffectiveConfig ?? loadEffectiveConfig;
  const effective = await loadConfig({ env, overrides: options.sourceOverrides ?? {} });
  const context = {
    statePath: effective.paths.managedStatePath,
    home: effective.paths.home,
    marketHome: effective.paths.marketHome,
    now: dependencies.now ?? (() => Date.now()),
    hooks: dependencies.hooks ?? {},
  };

  let snapshot = null;
  let entry = null;
  if (CATALOG_OPERATIONS.has(operation)) {
    snapshot = await loadMutationSnapshot({
      config: effective.values,
      allowStaleHead: options.allowStaleHead ?? null,
      loadSnapshot: dependencies.loadCatalogSnapshot ?? loadCatalogSnapshot,
      git: dependencies.git,
      now: context.now,
    });
    entry = resolveCatalogEntry(snapshot, id, {
      operation,
      allowDeprecated: Boolean(options.allowDeprecated),
    });
  }

  if (operation === "download") {
    let destination = null;
    if (options.destination) {
      destination = expandHomePath(
        options.destination,
        effective.paths.home,
        "destination",
      );
      assertPathInside(effective.paths.downloadsRoot, destination, "destination");
    }
    return (dependencies.downloadPackage ?? downloadPackage)({
      entry,
      snapshot,
      downloadsRoot: effective.paths.downloadsRoot,
      marketHome: effective.paths.marketHome,
      destination,
      force: Boolean(options.force),
      hooks: context.hooks,
    });
  }

  if (identity.kind === "standalone") {
    if (operation === "install") {
      return (dependencies.installStandalone ?? installStandalone)({
        entry,
        snapshot,
        ...context,
        adopt: Boolean(options.adopt),
      });
    }
    if (operation === "update") {
      return (dependencies.updateStandalone ?? updateStandalone)({
        entry,
        snapshot,
        ...context,
        force: Boolean(options.force),
        confirmDrift: Boolean(options.confirmDrift),
        confirmSourceChange: Boolean(options.confirmSourceChange),
      });
    }
    if (operation === "enable" || operation === "disable") {
      return (dependencies.setStandaloneActivation ?? setStandaloneActivation)({
        id,
        identity,
        desired: operation === "enable" ? "active" : "disabled",
        ...context,
        confirmDrift: Boolean(options.confirmDrift),
      });
    }
    return (dependencies.uninstallStandalone ?? uninstallStandalone)({
      id,
      identity,
      ...context,
      adopt: Boolean(options.adopt),
      confirmDrift: Boolean(options.confirmDrift),
    });
  }

  const nativeEntry = entry ?? localPluginEntry(identity);
  if (["install", "update"].includes(operation)) {
    await validatePackageContent(nativeEntry, path.join(snapshot.root, nativeEntry.path));
  }
  return (dependencies.runNativePluginLifecycle ?? runNativePluginLifecycle)({
    operation,
    entry: nativeEntry,
    snapshot,
    options,
    env,
    execute: dependencies.executeNative,
    readPlugins: dependencies.readNativePlugins,
    git: dependencies.git,
    repository: effective.values,
  });
}
