import { readFile } from "node:fs/promises";

import {
  ADAPTERS,
  CATALOG_STATUSES,
  PACKAGE_KINDS,
  isKebabCase,
  makePackageId,
} from "./contracts.mjs";
import { isSemver } from "./versions.mjs";

const SAFE_REF = /^(?!-)(?!.*(?:\.\.|@\{|\\|\s))[A-Za-z0-9][A-Za-z0-9._/-]*$/u;
const PLUGIN_MANIFESTS = Object.freeze({
  claude: ".claude-plugin/plugin.json",
  codex: ".codex-plugin/plugin.json",
  grok: ".grok-plugin/plugin.json",
});

export class CatalogValidationError extends Error {
  constructor(issues) {
    super(`catalog validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "CatalogValidationError";
    this.issues = issues;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(value, path, issues) {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(`${path} must be a non-empty string`);
    return false;
  }
  return true;
}

function validateRelativePath(value, path, issues) {
  if (!requireString(value, path, issues)) {
    return;
  }
  const parts = value.split(/[\\/]/u);
  if (value.startsWith("/") || /^[A-Za-z]:[\\/]/u.test(value) || parts.includes("..")) {
    issues.push(`${path} must stay inside the repository`);
  }
}

function validateReadRepoUrl(value, path, issues) {
  if (!requireString(value, path, issues)) {
    return;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      issues.push(`${path} must use https`);
    }
  } catch {
    issues.push(`${path} must be an absolute URL`);
  }
}

function validatePackage(entry, index, issues) {
  const path = `packages[${index}]`;
  if (!isPlainObject(entry)) {
    issues.push(`${path} must be an object`);
    return;
  }

  if (!ADAPTERS.includes(entry.adapter)) {
    issues.push(`${path}.adapter must be one of: ${ADAPTERS.join(", ")}`);
  }
  if (!PACKAGE_KINDS.includes(entry.kind)) {
    issues.push(`${path}.kind must be one of: ${PACKAGE_KINDS.join(", ")}`);
  }
  if (!isKebabCase(entry.name)) {
    issues.push(`${path}.name must be kebab-case`);
  }
  if (ADAPTERS.includes(entry.adapter) && PACKAGE_KINDS.includes(entry.kind) && isKebabCase(entry.name)) {
    const expectedId = makePackageId(entry.adapter, entry.kind, entry.name);
    if (entry.id !== expectedId) {
      issues.push(`${path}.id must equal ${expectedId}`);
    }
  }
  if (!isSemver(entry.version)) {
    issues.push(`${path}.version must be semver`);
  }
  if (!CATALOG_STATUSES.includes(entry.status)) {
    issues.push(`${path}.status must be one of: ${CATALOG_STATUSES.join(", ")}`);
  }
  validateRelativePath(entry.path, `${path}.path`, issues);
  requireString(entry.description, `${path}.description`, issues);

  if (isKebabCase(entry.name) && ADAPTERS.includes(entry.adapter)) {
    const expectedPath =
      entry.kind === "plugin"
        ? `plugins/${entry.name}`
        : `skills/${entry.adapter}/${entry.name}`;
    if (PACKAGE_KINDS.includes(entry.kind) && entry.path !== expectedPath) {
      issues.push(`${path}.path must equal ${expectedPath}`);
    }
  }

  if (entry.kind === "plugin") {
    validateRelativePath(entry.manifestPath, `${path}.manifestPath`, issues);
    if (ADAPTERS.includes(entry.adapter) && entry.manifestPath !== PLUGIN_MANIFESTS[entry.adapter]) {
      issues.push(`${path}.manifestPath must equal ${PLUGIN_MANIFESTS[entry.adapter]}`);
    }
    if (typeof entry.bootstrap !== "boolean") {
      issues.push(`${path}.bootstrap must be a boolean for plugins`);
    }
  } else if (entry.manifestPath !== undefined) {
    issues.push(`${path}.manifestPath is only valid for plugins`);
  } else if (entry.bootstrap !== undefined) {
    issues.push(`${path}.bootstrap is only valid for plugins`);
  }

  if (entry.category !== undefined) {
    requireString(entry.category, `${path}.category`, issues);
  }
  if (entry.keywords !== undefined) {
    if (
      !Array.isArray(entry.keywords) ||
      entry.keywords.some((item) => typeof item !== "string" || item.trim() === "")
    ) {
      issues.push(`${path}.keywords must be an array of non-empty strings`);
    }
  }
}

export function validateCatalog(catalog) {
  const issues = [];
  if (!isPlainObject(catalog)) {
    throw new CatalogValidationError(["catalog must be an object"]);
  }
  if (catalog.schemaVersion !== 1) {
    issues.push("schemaVersion must equal 1");
  }

  if (!isPlainObject(catalog.marketplace)) {
    issues.push("marketplace must be an object");
  } else {
    if (!isKebabCase(catalog.marketplace.name)) {
      issues.push("marketplace.name must be kebab-case");
    }
    requireString(catalog.marketplace.displayName, "marketplace.displayName", issues);
    requireString(catalog.marketplace.description, "marketplace.description", issues);
    if (!isPlainObject(catalog.marketplace.owner)) {
      issues.push("marketplace.owner must be an object");
    } else {
      requireString(catalog.marketplace.owner.name, "marketplace.owner.name", issues);
    }
  }

  if (!isPlainObject(catalog.defaults)) {
    issues.push("defaults must be an object");
  } else {
    validateReadRepoUrl(catalog.defaults.readRepoUrl, "defaults.readRepoUrl", issues);
    if (
      requireString(catalog.defaults.baseRef, "defaults.baseRef", issues) &&
      !SAFE_REF.test(catalog.defaults.baseRef)
    ) {
      issues.push("defaults.baseRef must be a safe Git ref");
    }
    if (!Number.isInteger(catalog.defaults.cacheTtlSeconds) || catalog.defaults.cacheTtlSeconds < 0) {
      issues.push("defaults.cacheTtlSeconds must be a non-negative integer");
    }
  }

  if (!Array.isArray(catalog.packages) || catalog.packages.length === 0) {
    issues.push("packages must be a non-empty array");
  } else {
    catalog.packages.forEach((entry, index) => validatePackage(entry, index, issues));
    const ids = new Set();
    for (const [index, entry] of catalog.packages.entries()) {
      if (!isPlainObject(entry) || typeof entry.id !== "string") {
        continue;
      }
      if (ids.has(entry.id)) {
        issues.push(`packages[${index}].id duplicates ${entry.id}`);
      }
      ids.add(entry.id);
    }
    const actualOrder = catalog.packages
      .filter((entry) => isPlainObject(entry) && typeof entry.id === "string")
      .map((entry) => entry.id);
    const expectedOrder = [...actualOrder].sort((left, right) => left.localeCompare(right));
    if (actualOrder.some((id, index) => id !== expectedOrder[index])) {
      issues.push("packages must be sorted by id");
    }
  }

  if (issues.length > 0) {
    throw new CatalogValidationError(issues);
  }
  return catalog;
}

export async function loadCatalog(filePath) {
  const raw = await readFile(filePath, "utf8");
  let catalog;
  try {
    catalog = JSON.parse(raw);
  } catch (error) {
    throw new CatalogValidationError([`catalog is not valid JSON: ${error.message}`]);
  }
  return validateCatalog(catalog);
}
