import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateCatalog } from "./catalog.mjs";

export class GeneratedFileDriftError extends Error {
  constructor(paths) {
    super(`generated files are missing or stale: ${paths.join(", ")}`);
    this.name = "GeneratedFileDriftError";
    this.paths = paths;
  }
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function activePlugins(catalog, adapter) {
  return catalog.packages.filter(
    (entry) => entry.adapter === adapter && entry.kind === "plugin" && entry.status === "active",
  );
}

function codexMarketplace(catalog) {
  return {
    name: catalog.marketplace.name,
    interface: { displayName: catalog.marketplace.displayName },
    plugins: activePlugins(catalog, "codex").map((entry) => ({
      name: entry.name,
      source: { source: "local", path: `./${entry.path}` },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: entry.category ?? "Productivity",
    })),
  };
}

function claudeMarketplace(catalog) {
  return {
    name: catalog.marketplace.name,
    owner: catalog.marketplace.owner,
    description: catalog.marketplace.description,
    plugins: activePlugins(catalog, "claude").map((entry) => ({
      name: entry.name,
      source: `./${entry.path}`,
      description: entry.description,
      version: entry.version,
      author: catalog.marketplace.owner,
    })),
  };
}

function grokMarketplace(catalog) {
  return {
    name: catalog.marketplace.name,
    description: catalog.marketplace.description,
    owner: catalog.marketplace.owner,
    plugins: activePlugins(catalog, "grok").map((entry) => ({
      name: entry.name,
      description: entry.description,
      category: entry.category ?? "Productivity",
      source: { type: "local", path: `./${entry.path}` },
      version: entry.version,
      author: catalog.marketplace.owner,
      keywords: entry.keywords ?? [],
    })),
  };
}

function escapeTableCell(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("|", "\\|").replace(/\r?\n/gu, " ");
}

function skillIndex(catalog) {
  const rows = catalog.packages
    .filter((entry) => entry.kind === "standalone")
    .map(
      (entry) =>
        `| ${entry.adapter} | ${entry.name} | ${entry.version} | ${entry.path} | ${entry.status} | ${escapeTableCell(entry.description)} |`,
    );
  return [
    "# Skill Catalog",
    "",
    "Standalone skills published by Skill Market live under this directory. Bootstrap management skills stay under `plugins/skill-market-*` and are installed through each adapter's native plugin marketplace.",
    "",
    "This file is generated from `catalog/entries.json`. It records catalog identity, versions, paths, status, and descriptions only. Local installation state is stored under `~/.skill-market/`.",
    "",
    "Skill versions use semver strings. Start new standalone skills at `0.0.1` and bump the version whenever the published package changes.",
    "",
    "Catalog status values:",
    "",
    "- `active`: available for normal install and update.",
    "- `deprecated`: hidden from normal new installs unless explicitly requested.",
    "- `disabled`: retained in the catalog but unavailable for install or update.",
    "- `removed`: a tombstone for a package intentionally removed from the market.",
    "",
    "| Adapter | Skill | Version | Path | Status | Description |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

export function renderCatalogViews(inputCatalog) {
  const catalog = validateCatalog(inputCatalog);
  return new Map([
    [".agents/plugins/marketplace.json", json(codexMarketplace(catalog))],
    [".claude-plugin/marketplace.json", json(claudeMarketplace(catalog))],
    [".grok-plugin/marketplace.json", json(grokMarketplace(catalog))],
    ["skills/INDEX.md", skillIndex(catalog)],
  ]);
}

export async function writeCatalogViews({ root, catalog, check = false }) {
  const views = renderCatalogViews(catalog);
  const drift = [];
  for (const [relativePath, content] of views) {
    const outputPath = path.join(root, relativePath);
    if (check) {
      let current = null;
      try {
        current = await readFile(outputPath, "utf8");
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
      if (current !== content) {
        drift.push(relativePath);
      }
      continue;
    }
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, "utf8");
  }
  if (drift.length > 0) {
    throw new GeneratedFileDriftError(drift);
  }
  return [...views.keys()];
}
