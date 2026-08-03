import path from "node:path";

import { ADAPTERS, PACKAGE_KINDS } from "./contracts.mjs";
import { readManagedPackages } from "./managed-state.mjs";
import { readNativePlugins } from "./native-inventory.mjs";
import { compareSemver, isSemver } from "./versions.mjs";

export function updateStateFor(installedVersion, catalogEntry, catalogLoaded) {
  if (!catalogLoaded) return "unknown";
  if (!catalogEntry) return "catalog_missing";
  if (!isSemver(installedVersion) || !isSemver(catalogEntry.version)) return "unknown";
  const comparison = compareSemver(installedVersion, catalogEntry.version);
  if (comparison === 0) return "current";
  return comparison < 0 ? "update_available" : "ahead";
}

function enrich(item, catalogSnapshot) {
  const catalogEntry = catalogSnapshot?.catalog.packages.find((entry) => entry.id === item.id) ?? null;
  return {
    ...item,
    catalogVersion: catalogEntry?.version ?? null,
    catalogStatus: catalogEntry?.status ?? null,
    updateState: updateStateFor(
      item.installedVersion,
      catalogEntry,
      Boolean(catalogSnapshot),
    ),
    freshness: catalogSnapshot?.freshness ?? null,
  };
}

export async function collectLocalInventory({
  adapters = ADAPTERS,
  kinds = PACKAGE_KINDS,
  statePath,
  catalogSnapshot = null,
  nativeReader = readNativePlugins,
  env = process.env,
  marketplaceName = "skill-market",
} = {}) {
  const warnings = [];
  const items = [];
  if (kinds.includes("plugin")) {
    const results = await Promise.all(
      adapters.map(async (adapter) => {
        try {
          const packageNames = catalogSnapshot
            ? catalogSnapshot.catalog.packages
                .filter((entry) => entry.adapter === adapter && entry.kind === "plugin")
                .map((entry) => entry.name)
            : adapter === "grok"
              ? ["skill-market-grok"]
              : [];
          return await nativeReader({ adapter, marketplaceName, packageNames, env });
        } catch (error) {
          warnings.push({
            code: error.code ?? "native-list-failed",
            adapter,
            message: error.message,
          });
          return [];
        }
      }),
    );
    items.push(...results.flat());
  }
  if (kinds.includes("standalone")) {
    try {
      const managed = await readManagedPackages(statePath, {
        home: env.HOME,
        marketHome: path.dirname(statePath),
      });
      items.push(...managed.filter((item) => adapters.includes(item.adapter)));
    } catch (error) {
      warnings.push({
        code: error.code ?? "managed-state-read-failed",
        adapter: null,
        message: error.message,
      });
    }
  }
  const normalized = items
    .map((item) => enrich(item, catalogSnapshot))
    .sort((left, right) => left.id.localeCompare(right.id));
  return {
    items: normalized,
    warnings: warnings.sort((left, right) =>
      String(left.adapter ?? "").localeCompare(String(right.adapter ?? "")),
    ),
    catalog: {
      loaded: Boolean(catalogSnapshot),
      freshness: catalogSnapshot?.freshness ?? null,
      source: catalogSnapshot?.source ?? null,
    },
  };
}
