import { parsePackageId } from "./contracts.mjs";
import { SkillMarketError } from "./errors.mjs";
import { createGitClient } from "./git-client.mjs";

const COMMIT_ID = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/u;

export async function loadMutationSnapshot({
  config,
  allowStaleHead = null,
  loadSnapshot,
  git = createGitClient(),
  now,
}) {
  if (allowStaleHead !== null && !COMMIT_ID.test(allowStaleHead)) {
    throw new SkillMarketError({
      code: "invalid-stale-provenance",
      message: "allowStaleHead must be an exact 40- or 64-character lowercase commit id.",
      details: { allowStaleHead },
      nextAction: "Copy the exact cache head reported by discover/list and retry explicitly.",
    });
  }
  const snapshot = await loadSnapshot({
    config,
    latest: allowStaleHead === null,
    offline: allowStaleHead !== null,
    allowStaleOnRefreshFailure: false,
    git,
    now,
  });
  if (allowStaleHead !== null) {
    if (snapshot.source.mode !== "cache" || snapshot.source.head !== allowStaleHead) {
      throw new SkillMarketError({
        code: "stale-provenance-mismatch",
        message: "The exact stale cache head does not match the loaded catalog snapshot.",
        status: "blocked",
        details: {
          requestedHead: allowStaleHead,
          loadedHead: snapshot.source.head ?? null,
          sourceMode: snapshot.source.mode,
        },
        nextAction: "Run discover offline, copy its exact source.head, and retry without changing the cache.",
      });
    }
  } else if (snapshot.freshness === "stale") {
    throw new SkillMarketError({
      code: "stale-mutation-denied",
      message: "Mutation requires a fresh catalog or an exact explicitly accepted stale head.",
      status: "blocked",
      details: { freshness: snapshot.freshness, head: snapshot.source.head ?? null },
      nextAction: "Restore repository access for a fresh read, or retry with --allow-stale-head <exact-head>.",
    });
  }
  if (snapshot.source.mode === "cache") {
    const [actualHead, rawStatus] = await Promise.all([
      git.head(snapshot.root),
      git.status(snapshot.root),
    ]);
    if (actualHead !== snapshot.source.head) {
      throw new SkillMarketError({
        code: "cache-head-mismatch",
        message: "The cache marker head does not match the actual Git checkout HEAD.",
        status: "blocked",
        details: { markerHead: snapshot.source.head, actualHead, cachePath: snapshot.root },
        nextAction: "Stop mutation and explicitly repair or refresh the configured cache before retrying.",
      });
    }
    const changes = String(rawStatus ?? "")
      .split("\n")
      .filter(Boolean)
      .filter((line) => line !== "?? .skill-market-cache.json");
    if (changes.length > 0) {
      throw new SkillMarketError({
        code: "dirty-cache-mutation-denied",
        message: "The configured Git cache has tracked or untracked changes outside its cache marker.",
        status: "blocked",
        details: { cachePath: snapshot.root, changes },
        nextAction: "Preserve any intentional work elsewhere, then explicitly repair or refresh this disposable cache.",
      });
    }
  }
  return snapshot;
}

export function resolveCatalogEntry(
  snapshot,
  id,
  { operation, allowDeprecated = false, expectedKind = null } = {},
) {
  const identity = parsePackageId(id);
  if (expectedKind && identity.kind !== expectedKind) {
    throw new SkillMarketError({
      code: "package-kind-mismatch",
      message: `${operation} expected a ${expectedKind} package id.`,
      details: { id, expectedKind, actualKind: identity.kind },
      nextAction: `Use a canonical <adapter>:${expectedKind}:<name> package id.`,
    });
  }
  const entry = snapshot.catalog.packages.find((candidate) => candidate.id === id);
  if (!entry) {
    throw new SkillMarketError({
      code: "catalog-package-missing",
      message: `Package ${id} is not present in the loaded catalog.`,
      status: "blocked",
      details: { id, head: snapshot.source.head ?? null },
      nextAction: "Run discover against the intended catalog source and choose an exact returned id.",
    });
  }
  if (["disabled", "removed"].includes(entry.status)) {
    throw new SkillMarketError({
      code: "catalog-status-blocked",
      message: `${id} has catalog status ${entry.status} and cannot be used for ${operation}.`,
      status: "blocked",
      details: { id, status: entry.status, operation },
      nextAction: "Choose an active package or ask a maintainer to change its catalog status.",
    });
  }
  if (entry.status === "deprecated" && ["install", "download"].includes(operation) && !allowDeprecated) {
    throw new SkillMarketError({
      code: "deprecated-package-confirmation",
      message: `${id} is deprecated and new ${operation} requires explicit acceptance.`,
      status: "needs_confirmation",
      details: { id, status: entry.status, operation },
      nextAction: `Confirm the deprecated package, then retry with --allow-deprecated.`,
    });
  }
  return entry;
}

export function stateSource(snapshot) {
  return {
    repoIdentity: snapshot.source.repoIdentity ?? snapshot.source.identity,
    head: snapshot.source.head ?? null,
    freshness: snapshot.freshness,
  };
}
