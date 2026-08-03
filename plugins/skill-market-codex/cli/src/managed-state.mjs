import { access } from "node:fs/promises";
import path from "node:path";

import {
  ADAPTERS,
  FRESHNESS_STATES,
  OWNERSHIP_STATES,
  isKebabCase,
  makePackageId,
} from "./contracts.mjs";
import { SkillMarketError } from "./errors.mjs";
import { readJsonIfExists } from "./fs-utils.mjs";
import { contentDigest } from "./package-content.mjs";
import {
  assertManagedRecordPaths,
  assertManagedStatePathTopology,
  assertStandalonePathTopology,
  resolveStandalonePaths,
} from "./lifecycle-paths.mjs";
import { isSemver } from "./versions.mjs";

const SHA256 = /^[0-9a-f]{64}$/u;
const COMMIT_ID = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/u;

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
  if (!SHA256.test(record.contentDigest)) {
    issues.push(`${field}.contentDigest must be a lowercase SHA-256 digest`);
  }
  if (!["active", "disabled"].includes(record.activation)) {
    issues.push(`${field}.activation must be active or disabled`);
  }
  for (const timestampField of ["installedAt", "updatedAt"]) {
    if (
      typeof record[timestampField] !== "string" ||
      !Number.isFinite(Date.parse(record[timestampField]))
    ) {
      issues.push(`${field}.${timestampField} must be an ISO timestamp`);
    }
  }
  if (
    record.uninstalledAt !== null &&
    (typeof record.uninstalledAt !== "string" ||
      !Number.isFinite(Date.parse(record.uninstalledAt)))
  ) {
    issues.push(`${field}.uninstalledAt must be null or an ISO timestamp`);
  }
  if (record.source === null || typeof record.source !== "object" || Array.isArray(record.source)) {
    issues.push(`${field}.source must be an object`);
  } else {
    if (typeof record.source.repoIdentity !== "string" || record.source.repoIdentity.trim() === "") {
      issues.push(`${field}.source.repoIdentity must be a non-empty string`);
    }
    if (record.source.head !== null && !COMMIT_ID.test(record.source.head)) {
      issues.push(`${field}.source.head must be null or a lowercase commit id`);
    }
    if (!FRESHNESS_STATES.includes(record.source.freshness)) {
      issues.push(`${field}.source.freshness is invalid`);
    }
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

export async function readManagedPackages(
  statePath,
  {
    home = process.env.HOME,
    marketHome = path.dirname(statePath),
  } = {},
) {
  await assertManagedStatePathTopology({ marketHome, statePath });
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
      let canonicalPaths;
      try {
        canonicalPaths = resolveStandalonePaths({
          adapter: record.adapter,
          name: record.name,
          home,
          marketHome,
        });
        assertManagedRecordPaths(record, canonicalPaths);
        await assertStandalonePathTopology(canonicalPaths, statePath);
      } catch (error) {
        return {
          id,
          adapter: record.adapter,
          kind: "standalone",
          name: record.name,
          installedVersion: record.installedVersion,
          localState: "broken",
          drifted: false,
          ownership: record.ownership,
          location: null,
          diagnostic: `managed path safety check failed: ${error.message}`,
          managed: structuredClone(record),
        };
      }
      const [activeExists, disabledExists] = await Promise.all([
        exists(canonicalPaths.activePath),
        exists(canonicalPaths.disabledPath),
      ]);
      let localState;
      let diagnostic = null;
      let drifted = false;
      if (activeExists && disabledExists) {
        localState = "broken";
        diagnostic = "active and disabled paths both exist";
      } else if (activeExists) {
        localState = "active";
      } else if (disabledExists) {
        localState = "disabled";
      } else if (record.uninstalledAt !== null) {
        localState = "absent";
      } else {
        localState = "broken";
        diagnostic = "neither active nor disabled path exists";
      }
      if (["active", "disabled"].includes(localState) && record.uninstalledAt !== null) {
        diagnostic = `state records uninstall at ${record.uninstalledAt} but a package path exists`;
        localState = "broken";
      }
      if (
        ["active", "disabled"].includes(localState) &&
        record.activation !== localState
      ) {
        diagnostic = `state records ${record.activation} but ${localState} path exists`;
        localState = "broken";
      }
      if (["active", "disabled"].includes(localState)) {
        const location =
          localState === "active" ? canonicalPaths.activePath : canonicalPaths.disabledPath;
        try {
          const actualDigest = await contentDigest(location);
          drifted = actualDigest !== record.contentDigest;
          if (drifted) {
            diagnostic = "local content differs from the recorded installed digest";
          }
        } catch (error) {
          localState = "broken";
          diagnostic = `package content cannot be inspected: ${error.message}`;
        }
      }
      return {
        id,
        adapter: record.adapter,
        kind: "standalone",
        name: record.name,
        installedVersion: record.installedVersion,
        localState,
        drifted,
        ownership: record.ownership,
        location:
          activeExists && !disabledExists
            ? canonicalPaths.activePath
            : disabledExists && !activeExists
              ? canonicalPaths.disabledPath
              : null,
        diagnostic,
        managed: structuredClone(record),
      };
    }),
  );
}
