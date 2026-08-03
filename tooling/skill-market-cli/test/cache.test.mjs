import assert from "node:assert/strict";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  CACHE_MARKER_NAME,
  loadCatalogSnapshot,
  loadOptionalCatalogSnapshot,
} from "../src/cache.mjs";
import { SkillMarketError } from "../src/errors.mjs";
import { canonicalRepositoryIdentity } from "../src/source-identity.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

const READ_URL = "https://example.test/skill-market.git";
const HEAD = "a".repeat(40);
const NOW = Date.parse("2026-08-03T00:00:00.000Z");

function configFor(home, overrides = {}) {
  return {
    readRepoUrl: READ_URL,
    baseRef: "main",
    cachePath: path.join(home, ".skill-market/cache/skill-market"),
    cacheTtlSeconds: 3600,
    repoPath: null,
    ...overrides,
  };
}

async function writeCatalogRoot(root) {
  await mkdir(path.join(root, "catalog"), { recursive: true });
  await writeFile(
    path.join(root, "catalog/entries.json"),
    `${JSON.stringify(fixtureCatalog, null, 2)}\n`,
    "utf8",
  );
}

async function writeCache(config, markerOverrides = {}) {
  await writeCatalogRoot(config.cachePath);
  const marker = {
    schemaVersion: 1,
    repoIdentity: canonicalRepositoryIdentity(config.readRepoUrl),
    repoUrl: config.readRepoUrl,
    baseRef: config.baseRef,
    fetchedAt: new Date(NOW - 1000).toISOString(),
    head: HEAD,
    ...markerOverrides,
  };
  await writeFile(
    path.join(config.cachePath, CACHE_MARKER_NAME),
    `${JSON.stringify(marker)}\n`,
    "utf8",
  );
}

function fakeGit(overrides = {}) {
  return {
    async clone() {
      throw new Error("unexpected clone");
    },
    async remoteUrl() {
      return READ_URL;
    },
    async refresh() {},
    async head() {
      return HEAD;
    },
    async status() {
      return "";
    },
    ...overrides,
  };
}

test("an explicit local repository bypasses cache and Git operations", async () => {
  await withTemporaryHome(async (home) => {
    const repoPath = path.join(home, "checkout");
    await writeCatalogRoot(repoPath);
    const git = fakeGit({
      async remoteUrl() {
        throw new Error("local override must not call git");
      },
    });
    const snapshot = await loadCatalogSnapshot({
      config: configFor(home, { repoPath }),
      offline: true,
      git,
      now: () => NOW,
    });
    assert.equal(snapshot.freshness, "local_override");
    assert.equal(snapshot.source.mode, "local");
    assert.equal(snapshot.catalog.packages.length, 6);
  });
});

test("a missing cache clones atomically only when online", async () => {
  await withTemporaryHome(async (home) => {
    const config = configFor(home);
    await assert.rejects(
      loadCatalogSnapshot({ config, offline: true, git: fakeGit(), now: () => NOW }),
      (error) => error instanceof SkillMarketError && error.code === "cache-missing-offline",
    );

    let clones = 0;
    const git = fakeGit({
      async clone({ destination }) {
        clones += 1;
        await writeCatalogRoot(destination);
      },
    });
    const snapshot = await loadCatalogSnapshot({ config, git, now: () => NOW });
    assert.equal(clones, 1);
    assert.equal(snapshot.freshness, "fresh");
    assert.equal(snapshot.source.repoIdentity, canonicalRepositoryIdentity(READ_URL));
    const marker = JSON.parse(
      await readFile(path.join(config.cachePath, CACHE_MARKER_NAME), "utf8"),
    );
    assert.equal(marker.head, HEAD);
    await assert.rejects(access(`${config.cachePath}.lock`), { code: "ENOENT" });
  });
});

test("cache source mismatches block reads before refresh", async () => {
  await withTemporaryHome(async (home) => {
    const config = configFor(home);
    await writeCache(config, { repoIdentity: "example.test/somewhere-else" });
    let refreshes = 0;
    await assert.rejects(
      loadCatalogSnapshot({
        config,
        latest: true,
        git: fakeGit({
          async refresh() {
            refreshes += 1;
          },
        }),
        now: () => NOW,
      }),
      (error) => error instanceof SkillMarketError && error.code === "cache-source-mismatch",
    );
    assert.equal(refreshes, 0);
  });
});

test("read refresh failures may return stale data but strict callers fail", async () => {
  await withTemporaryHome(async (home) => {
    const config = configFor(home, { cacheTtlSeconds: 60 });
    await writeCache(config, { fetchedAt: new Date(NOW - 120_000).toISOString() });
    const refreshError = new SkillMarketError({
      code: "git-command-failed",
      message: "fixture refresh failed",
      retryable: true,
    });
    const git = fakeGit({
      async refresh() {
        throw refreshError;
      },
    });
    const snapshot = await loadCatalogSnapshot({ config, git, now: () => NOW });
    assert.equal(snapshot.freshness, "stale");
    assert.equal(snapshot.warnings[0].code, "cache-refresh-failed");
    await assert.rejects(
      loadCatalogSnapshot({
        config,
        git,
        now: () => NOW,
        allowStaleOnRefreshFailure: false,
      }),
      (error) => error === refreshError,
    );
  });
});

test("optional catalog lookup never creates or refreshes a cache", async () => {
  await withTemporaryHome(async (home) => {
    const config = configFor(home);
    assert.deepEqual(await loadOptionalCatalogSnapshot({ config, now: () => NOW }), {
      snapshot: null,
      warnings: [],
    });
    await writeCache(config, { fetchedAt: new Date(NOW - 10_000).toISOString() });
    const result = await loadOptionalCatalogSnapshot({ config, now: () => NOW });
    assert.equal(result.snapshot.freshness, "fresh");
    assert.equal(result.snapshot.catalog.packages.length, 6);
  });
});

test("zero TTL disables automatic refresh while reporting stale provenance", async () => {
  await withTemporaryHome(async (home) => {
    const config = configFor(home, { cacheTtlSeconds: 0 });
    await writeCache(config);
    let refreshes = 0;
    const snapshot = await loadCatalogSnapshot({
      config,
      git: fakeGit({
        async refresh() {
          refreshes += 1;
        },
      }),
      now: () => NOW,
    });
    assert.equal(snapshot.freshness, "stale");
    assert.equal(refreshes, 0);
  });
});

test("invalid cache marker JSON is surfaced without rewriting it", async () => {
  await withTemporaryHome(async (home) => {
    const config = configFor(home);
    await writeCatalogRoot(config.cachePath);
    const markerPath = path.join(config.cachePath, CACHE_MARKER_NAME);
    await writeFile(markerPath, "{invalid", "utf8");
    await assert.rejects(
      loadCatalogSnapshot({ config, git: fakeGit(), now: () => NOW }),
      (error) => error instanceof SkillMarketError && error.code === "invalid-cache-marker",
    );
    const optional = await loadOptionalCatalogSnapshot({ config, now: () => NOW });
    assert.equal(optional.snapshot, null);
    assert.equal(optional.warnings[0].code, "invalid-cache-marker");
    assert.equal(await readFile(markerPath, "utf8"), "{invalid");
  });
});

test("invalid catalog content returns a typed blocked recovery", async () => {
  await withTemporaryHome(async (home) => {
    const repoPath = path.join(home, "checkout");
    await mkdir(path.join(repoPath, "catalog"), { recursive: true });
    await writeFile(path.join(repoPath, "catalog/entries.json"), "{invalid", "utf8");
    await assert.rejects(
      loadCatalogSnapshot({ config: configFor(home, { repoPath }), offline: true }),
      (error) =>
        error.code === "invalid-catalog" &&
        error.status === "blocked" &&
        /catalog\/entries\.json/u.test(error.nextAction),
    );
  });
});
