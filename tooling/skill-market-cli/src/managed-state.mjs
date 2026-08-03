import { access } from "node:fs/promises";
import path from "node:path";

import {
  ADAPTERS,
  OWNERSHIP_STATES,
  isKebabCase,
  makePackageId,
} from "./contracts.mjs";
import { SkillMarketError } from "./errors.mjs";
import { readJsonIfExists } from "./fs-utils.mjs";
import { isSemver } from "./versions.mjs";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function validateRecord(id, record, issues) {
  const field = `packages.${id}`;
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    issues.push(`${field} must be an object`);
    return;
  }
  if (!ADAPTERS.includes(record.adapter)) issues.push(`${field}.adapter is invalid`);
  if (record.kind !== "standalone") issues.push(`${field}.kind must equal standalone`);
  if (!isKebabCase(record.name)) issues.push(`${field}.name must be kebab-case`);
  if (
    ADAPTERS.includes(record.adapter) &&
    record.kind === "standalone" &&
    isKebabCase(record.name) &&
    id !== makePackageId(record.adapter, record.kind, record.name)
  ) {
    issues.push(`${field} identity does not match its key`);
  }
  if (!isSemver(record.installedVersion)) {
    issues.push(`${field}.installedVersion must be semver`);
  }
  if (!OWNERSHIP_STATES.filter((value) => value !== "native").includes(record.ownership)) {
    issues.push(`${field}.ownership must be skill-market or adopted`);
  }
  for (const pathField of ["activePath", "disabledPath"]) {
    if (typeof record[pathField] !== "string" || !path.isAbsolute(record[pathField])) {
      issues.push(`${field}.${pathField} must be an absolute path`);
    }
  }
  const expectedCatalogPath = `skills/${record.adapter}/${record.name}`;
  if (record.catalogPath !== expectedCatalogPath) {
    issues.push(`${field}.catalogPath must equal ${expectedCatalogPath}`);
  }
}

export function validateManagedState(value, statePath = "managed-state.json") {
  const issues = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    issues.push("state must be an object");
  } else {
    if (value.schemaVersion !== 2) issues.push("schemaVersion must equal 2");
    if (value.packages === null || typeof value.packages !== "object" || Array.isArray(value.packages)) {
      issues.push("packages must be an object");
    } else {
      for (const [id, record] of Object.entries(value.packages)) {
        validateRecord(id, record, issues);
      }
    }
  }
  if (issues.length > 0) {
    throw new SkillMarketError({
      code: "invalid-managed-state",
      message: `Managed state is invalid: ${issues.join("; ")}.`,
      status: "blocked",
      details: { statePath, issues },
      nextAction: "Repair the v2 managed-state file from a verified backup before mutating packages.",
    });
  }
  return value;
}

export async function readManagedPackages(statePath) {
  let value;
  try {
    value = await readJsonIfExists(statePath);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SkillMarketError({
        code: "invalid-managed-state",
        message: "Managed state is not valid JSON.",
        status: "blocked",
        details: { statePath },
        nextAction: "Restore a valid v2 managed-state file from backup before retrying.",
        cause: error,
      });
    }
    throw error;
  }
  if (value === null) return [];
  const state = validateManagedState(value, statePath);
  return Promise.all(
    Object.entries(state.packages).map(async ([id, record]) => {
      const [activeExists, disabledExists] = await Promise.all([
        exists(record.activePath),
        exists(record.disabledPath),
      ]);
      let localState;
      let diagnostic = null;
      if (activeExists && disabledExists) {
        localState = "broken";
        diagnostic = "active and disabled paths both exist";
      } else if (activeExists) {
        localState = "active";
      } else if (disabledExists) {
        localState = "disabled";
      } else {
        localState = "broken";
        diagnostic = "neither active nor disabled path exists";
      }
      return {
        id,
        adapter: record.adapter,
        kind: "standalone",
        name: record.name,
        installedVersion: record.installedVersion,
        localState,
        ownership: record.ownership,
        location: localState === "disabled" ? record.disabledPath : record.activePath,
        diagnostic,
        managed: structuredClone(record),
      };
    }),
  );
}
