import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { SkillMarketError } from "../src/errors.mjs";
import { executeLifecycle } from "../src/lifecycle.mjs";
import { createStandaloneFixture } from "./helpers/lifecycle-fixture.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

function effectiveConfig(home, repoRoot) {
  return {
    paths: {
      home,
      marketHome: path.join(home, ".skill-market"),
      managedStatePath: path.join(home, ".skill-market/managed-state.json"),
      downloadsRoot: path.join(home, ".skill-market/downloads"),
    },
    values: {
      readRepoUrl: "https://example.test/skill-market.git",
      baseRef: "main",
      cachePath: path.join(home, ".skill-market/cache/skill-market"),
      cacheTtlSeconds: 86400,
      repoPath: repoRoot,
    },
  };
}

function cleanGit(snapshot) {
  return {
    head: async () => snapshot.source.head,
    status: async () => "",
  };
}

test("lifecycle rejects invalid ids and adapter-incompatible options before config reads", async () => {
  let reads = 0;
  const dependencies = {
    loadEffectiveConfig: async () => {
      reads += 1;
      throw new Error("config must not be read");
    },
  };
  await assert.rejects(
    executeLifecycle({ operation: "install", id: "not-an-id", dependencies }),
    (error) => error instanceof SkillMarketError && error.code === "invalid-package-id",
  );
  await assert.rejects(
    executeLifecycle({
      operation: "update",
      id: "claude:plugin:fixture-claude",
      options: { confirmReinstall: true },
      dependencies,
    }),
    (error) => error.code === "invalid-option-combination",
  );
  await assert.rejects(
    executeLifecycle({
      operation: "disable",
      id: "codex:standalone:fixture-skill",
      options: { sourceOverrides: { repoPath: "/tmp/fixture" } },
      dependencies,
    }),
    (error) => error.code === "invalid-option-combination",
  );
  assert.equal(reads, 0);
});

test("standalone catalog mutations route through the strict snapshot and preserve exact options", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    let snapshotOptions;
    let received;
    const result = await executeLifecycle({
      operation: "update",
      id: fixture.entry.id,
      options: { force: true, confirmDrift: true },
      env: { HOME: home },
      dependencies: {
        loadEffectiveConfig: async () => effectiveConfig(home, fixture.snapshot.root),
        loadCatalogSnapshot: async (options) => {
          snapshotOptions = options;
          return fixture.snapshot;
        },
        git: cleanGit(fixture.snapshot),
        updateStandalone: async (input) => {
          received = input;
          return { status: "ok", summary: "fixture", data: {}, warnings: [] };
        },
      },
    });
    assert.equal(result.status, "ok");
    assert.equal(snapshotOptions.latest, true);
    assert.equal(snapshotOptions.allowStaleOnRefreshFailure, false);
    assert.equal(received.force, true);
    assert.equal(received.confirmDrift, true);
    assert.equal(received.entry.id, fixture.entry.id);
  });
});

test("implicit stale lifecycle snapshots are denied before package handlers run", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    let handlerCalls = 0;
    await assert.rejects(
      executeLifecycle({
        operation: "install",
        id: fixture.entry.id,
        env: { HOME: home },
        dependencies: {
          loadEffectiveConfig: async () => effectiveConfig(home, fixture.snapshot.root),
          loadCatalogSnapshot: async () => ({ ...fixture.snapshot, freshness: "stale" }),
          git: cleanGit(fixture.snapshot),
          installStandalone: async () => {
            handlerCalls += 1;
          },
        },
      }),
      (error) => error.code === "stale-mutation-denied",
    );
    assert.equal(handlerCalls, 0);
  });
});

test("plugin routing validates manifest identity and passes source expectations to native adapters", async () => {
  await withTemporaryHome(async (home) => {
    const repoRoot = path.join(home, "repo");
    const entry = {
      id: "grok:plugin:fixture-grok",
      adapter: "grok",
      kind: "plugin",
      name: "fixture-grok",
      version: "1.0.0",
      status: "active",
      path: "plugins/fixture-grok",
      manifestPath: ".grok-plugin/plugin.json",
      description: "Fixture.",
    };
    const packageRoot = path.join(repoRoot, entry.path);
    await mkdir(path.join(packageRoot, ".grok-plugin"), { recursive: true });
    await writeFile(
      path.join(packageRoot, entry.manifestPath),
      JSON.stringify({ name: entry.name, version: entry.version }),
      "utf8",
    );
    const snapshot = {
      root: repoRoot,
      freshness: "local_override",
      source: { mode: "local", identity: `local:${repoRoot}` },
      catalog: { packages: [entry] },
      warnings: [],
    };
    let received;
    const result = await executeLifecycle({
      operation: "install",
      id: entry.id,
      options: { confirmTrust: true },
      env: { HOME: home },
      dependencies: {
        loadEffectiveConfig: async () => effectiveConfig(home, repoRoot),
        loadCatalogSnapshot: async () => snapshot,
        runNativePluginLifecycle: async (input) => {
          received = input;
          return { status: "ok", summary: "fixture", data: {}, warnings: [] };
        },
      },
    });
    assert.equal(result.status, "ok");
    assert.equal(received.repository.repoPath, repoRoot);
    assert.equal(received.options.confirmTrust, true);
  });
});

test("custom download destinations cannot escape the managed downloads root", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    await assert.rejects(
      executeLifecycle({
        operation: "download",
        id: fixture.entry.id,
        options: { destination: path.join(home, "outside") },
        env: { HOME: home },
        dependencies: {
          loadEffectiveConfig: async () => effectiveConfig(home, fixture.snapshot.root),
          loadCatalogSnapshot: async () => fixture.snapshot,
          git: cleanGit(fixture.snapshot),
        },
      }),
      (error) => error.code === "unsafe-target-path",
    );
  });
});
