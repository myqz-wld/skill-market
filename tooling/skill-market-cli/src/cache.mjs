import { access, mkdir, realpath, rename, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { loadCatalog } from "./catalog.mjs";
import { SkillMarketError } from "./errors.mjs";
import { atomicWriteJson, readJsonIfExists } from "./fs-utils.mjs";
import { createGitClient } from "./git-client.mjs";
import { withFileLock } from "./lock.mjs";
import {
  canonicalRepositoryIdentity,
  localRepositoryIdentity,
} from "./source-identity.mjs";

const MARKER_NAME = ".skill-market-cache.json";
const COMMIT_ID = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/u;

function nowMilliseconds(now) {
  return typeof now === "function" ? now() : now;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function validateMarker(marker, markerPath) {
  const issues = [];
  if (marker === null || typeof marker !== "object" || Array.isArray(marker)) {
    issues.push("marker must be an object");
  } else {
    if (marker.schemaVersion !== 1) issues.push("schemaVersion must equal 1");
    for (const field of ["repoIdentity", "repoUrl", "baseRef", "fetchedAt", "head"]) {
      if (typeof marker[field] !== "string" || marker[field].trim() === "") {
        issues.push(`${field} must be a non-empty string`);
      }
    }
    if (typeof marker.fetchedAt === "string" && !Number.isFinite(Date.parse(marker.fetchedAt))) {
      issues.push("fetchedAt must be an ISO timestamp");
    }
    if (typeof marker.head === "string" && !COMMIT_ID.test(marker.head)) {
      issues.push("head must be a 40- or 64-character lowercase commit id");
    }
  }
  if (issues.length > 0) {
    throw new SkillMarketError({
      code: "invalid-cache-marker",
      message: `Skill Market cache marker is invalid: ${issues.join("; ")}.`,
      status: "blocked",
      details: { markerPath, issues },
      nextAction: "Run an explicit cache repair or remove only the configured Skill Market cache and refresh it.",
    });
  }
  return marker;
}

async function readMarker(markerPath) {
  try {
    return await readJsonIfExists(markerPath);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SkillMarketError({
        code: "invalid-cache-marker",
        message: "Skill Market cache marker is not valid JSON.",
        status: "blocked",
        details: { markerPath },
        nextAction: "Run an explicit cache repair or remove only the configured Skill Market cache and refresh it.",
        cause: error,
      });
    }
    throw error;
  }
}

function markerAge(marker, now) {
  return nowMilliseconds(now) - Date.parse(marker.fetchedAt);
}

function isMarkerStale(marker, ttlSeconds, now) {
  if (!marker || ttlSeconds === 0) {
    return true;
  }
  return markerAge(marker, now) >= ttlSeconds * 1000;
}

function markerFor({ config, head, now }) {
  return {
    schemaVersion: 1,
    repoIdentity: canonicalRepositoryIdentity(config.readRepoUrl),
    repoUrl: config.readRepoUrl,
    baseRef: config.baseRef,
    fetchedAt: new Date(nowMilliseconds(now)).toISOString(),
    head,
  };
}

function assertSourceMatches({ expectedIdentity, actualUrl, marker, cachePath }) {
  const actualIdentity = canonicalRepositoryIdentity(actualUrl);
  if (marker.repoIdentity !== expectedIdentity || actualIdentity !== expectedIdentity) {
    throw new SkillMarketError({
      code: "cache-source-mismatch",
      message: "Configured repository, cache marker, and Git origin do not identify the same repository.",
      status: "blocked",
      details: {
        cachePath,
        expectedIdentity,
        markerIdentity: marker.repoIdentity,
        actualIdentity,
        actualUrl,
      },
      nextAction: "Choose the intended repository, then use a separate empty cache path or explicitly repair this cache.",
    });
  }
}

async function snapshotFromRoot({ root, freshness, source, warnings = [] }) {
  const catalogPath = path.join(root, "catalog", "entries.json");
  const catalog = await loadCatalog(catalogPath);
  return Object.freeze({ root, catalogPath, catalog, freshness, source, warnings });
}

async function cloneCache({ config, git, now }) {
  const parent = path.dirname(config.cachePath);
  await mkdir(parent, { recursive: true });
  const stagingPath = path.join(
    parent,
    `.${path.basename(config.cachePath)}.clone-${process.pid}-${randomUUID()}`,
  );
  try {
    await git.clone({
      repoUrl: config.readRepoUrl,
      baseRef: config.baseRef,
      destination: stagingPath,
    });
    const head = await git.head(stagingPath);
    await atomicWriteJson(
      path.join(stagingPath, MARKER_NAME),
      markerFor({ config, head, now }),
    );
    await rename(stagingPath, config.cachePath);
    return head;
  } catch (error) {
    await rm(stagingPath, { recursive: true, force: true });
    throw error;
  }
}

export async function loadCatalogSnapshot({
  config,
  latest = false,
  offline = false,
  allowStaleOnRefreshFailure = true,
  git = createGitClient(),
  now = () => Date.now(),
} = {}) {
  if (latest && offline) {
    throw new SkillMarketError({
      code: "conflicting-options",
      message: "latest and offline cannot be used together.",
      details: { latest, offline },
      nextAction: "Remove either latest or offline, then retry.",
    });
  }

  if (config.repoPath) {
    let root;
    try {
      root = await realpath(config.repoPath);
    } catch (error) {
      throw new SkillMarketError({
        code: "local-repository-missing",
        message: `Configured local repository does not exist: ${config.repoPath}.`,
        status: "blocked",
        details: { repoPath: config.repoPath },
        nextAction: "Create the checkout or unset repoPath to use the configured read repository cache.",
        cause: error,
      });
    }
    return snapshotFromRoot({
      root,
      freshness: "local_override",
      source: {
        mode: "local",
        identity: localRepositoryIdentity(root),
        repoPath: root,
      },
    });
  }

  const cachePath = config.cachePath;
  const lockPath = `${cachePath}.lock`;
  return withFileLock(lockPath, async () => {
    if (!(await exists(cachePath))) {
      if (offline) {
        throw new SkillMarketError({
          code: "cache-missing-offline",
          message: "The Skill Market cache is missing and offline mode forbids cloning it.",
          status: "blocked",
          retryable: true,
          details: { cachePath },
          nextAction: "Retry without offline while repository access is available.",
        });
      }
      const head = await cloneCache({ config, git, now });
      const marker = markerFor({ config, head, now });
      return snapshotFromRoot({
        root: cachePath,
        freshness: "fresh",
        source: { mode: "cache", ...marker },
      });
    }

    const markerPath = path.join(cachePath, MARKER_NAME);
    const rawMarker = await readMarker(markerPath);
    if (!rawMarker) {
      throw new SkillMarketError({
        code: "cache-marker-missing",
        message: "The configured cache exists without a Skill Market source marker.",
        status: "blocked",
        details: { cachePath, markerPath },
        nextAction: "Use a separate empty cache path or explicitly repair this cache before reading it.",
      });
    }
    const marker = validateMarker(rawMarker, markerPath);
    const expectedIdentity = canonicalRepositoryIdentity(config.readRepoUrl);
    const actualUrl = await git.remoteUrl(cachePath);
    assertSourceMatches({ expectedIdentity, actualUrl, marker, cachePath });
    if (marker.baseRef !== config.baseRef) {
      throw new SkillMarketError({
        code: "cache-ref-mismatch",
        message: "The cache marker base ref differs from the effective configuration.",
        status: "blocked",
        details: { cachePath, markerRef: marker.baseRef, configuredRef: config.baseRef },
        nextAction: "Use a separate cache path for the configured ref or explicitly repair this cache.",
      });
    }

    const stale = isMarkerStale(marker, config.cacheTtlSeconds, now);
    const shouldRefresh = !offline && (latest || (config.cacheTtlSeconds > 0 && stale));
    const warnings = [];
    let effectiveMarker = marker;
    if (shouldRefresh) {
      try {
        await git.refresh({ root: cachePath, baseRef: config.baseRef });
        const head = await git.head(cachePath);
        effectiveMarker = markerFor({ config, head, now });
        await atomicWriteJson(markerPath, effectiveMarker);
      } catch (error) {
        if (!allowStaleOnRefreshFailure) {
          throw error;
        }
        warnings.push({
          code: "cache-refresh-failed",
          message: "Catalog refresh failed; the existing cache was used as stale read-only data.",
        });
      }
    }

    const freshness =
      effectiveMarker !== marker || !isMarkerStale(effectiveMarker, config.cacheTtlSeconds, now)
        ? "fresh"
        : "stale";
    return snapshotFromRoot({
      root: cachePath,
      freshness,
      source: { mode: "cache", ...effectiveMarker },
      warnings,
    });
  });
}

export async function loadOptionalCatalogSnapshot({ config, now = () => Date.now() } = {}) {
  if (config.repoPath) {
    try {
      return {
        snapshot: await loadCatalogSnapshot({ config, offline: true, now }),
        warnings: [],
      };
    } catch (error) {
      return {
        snapshot: null,
        warnings: [{ code: error.code ?? "catalog-unavailable", message: error.message }],
      };
    }
  }

  const markerPath = path.join(config.cachePath, MARKER_NAME);
  let rawMarker;
  try {
    rawMarker = await readMarker(markerPath);
  } catch (error) {
    return {
      snapshot: null,
      warnings: [{ code: error.code ?? "catalog-unavailable", message: error.message }],
    };
  }
  if (!rawMarker) {
    return { snapshot: null, warnings: [] };
  }
  try {
    const marker = validateMarker(rawMarker, markerPath);
    const expectedIdentity = canonicalRepositoryIdentity(config.readRepoUrl);
    if (marker.repoIdentity !== expectedIdentity || marker.baseRef !== config.baseRef) {
      throw new SkillMarketError({
        code: "cache-source-mismatch",
        message: "The local cache marker does not match the effective catalog source.",
      });
    }
    const freshness = isMarkerStale(marker, config.cacheTtlSeconds, now) ? "stale" : "fresh";
    return {
      snapshot: await snapshotFromRoot({
        root: config.cachePath,
        freshness,
        source: { mode: "cache", ...marker },
      }),
      warnings: [],
    };
  } catch (error) {
    return {
      snapshot: null,
      warnings: [{ code: error.code ?? "catalog-unavailable", message: error.message }],
    };
  }
}

export const CACHE_MARKER_NAME = MARKER_NAME;
