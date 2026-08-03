import assert from "node:assert/strict";
import test from "node:test";

import { SkillMarketError } from "../src/errors.mjs";
import {
  loadMutationSnapshot,
  resolveCatalogEntry,
} from "../src/lifecycle-source.mjs";

const HEAD = "a".repeat(40);
const CLEAN_GIT = {
  head: async () => HEAD,
  status: async () => "?? .skill-market-cache.json",
};

function snapshot({ freshness = "fresh", head = HEAD, status = "active" } = {}) {
  return {
    root: "/tmp/catalog",
    freshness,
    source: {
      mode: "cache",
      repoIdentity: "example.test/skill-market",
      head,
    },
    catalog: {
      packages: [
        {
          id: "codex:standalone:fixture-skill",
          adapter: "codex",
          kind: "standalone",
          name: "fixture-skill",
          version: "1.0.0",
          status,
          path: "skills/codex/fixture-skill",
          description: "Fixture.",
        },
      ],
    },
    warnings: [],
  };
}

test("mutations request latest data and never accept implicit stale fallback", async () => {
  let observed;
  await assert.rejects(
    loadMutationSnapshot({
      config: {},
      loadSnapshot: async (options) => {
        observed = options;
        return snapshot({ freshness: "stale" });
      },
      git: CLEAN_GIT,
    }),
    (error) =>
      error instanceof SkillMarketError && error.code === "stale-mutation-denied",
  );
  assert.equal(observed.latest, true);
  assert.equal(observed.offline, false);
  assert.equal(observed.allowStaleOnRefreshFailure, false);
});

test("an exact stale head is an offline provenance pin, not a loose override", async () => {
  let observed;
  const result = await loadMutationSnapshot({
    config: {},
    allowStaleHead: HEAD,
    loadSnapshot: async (options) => {
      observed = options;
      return snapshot({ freshness: "stale" });
    },
    git: CLEAN_GIT,
  });
  assert.equal(result.source.head, HEAD);
  assert.equal(observed.latest, false);
  assert.equal(observed.offline, true);

  await assert.rejects(
    loadMutationSnapshot({
      config: {},
      allowStaleHead: "b".repeat(40),
      loadSnapshot: async () => snapshot(),
      git: CLEAN_GIT,
    }),
    (error) =>
      error instanceof SkillMarketError && error.code === "stale-provenance-mismatch",
  );
});

test("cache mutations bind marker provenance to actual HEAD and clean content", async () => {
  await assert.rejects(
    loadMutationSnapshot({
      config: {},
      loadSnapshot: async () => snapshot(),
      git: { head: async () => "b".repeat(40), status: async () => "" },
    }),
    (error) => error.code === "cache-head-mismatch",
  );
  await assert.rejects(
    loadMutationSnapshot({
      config: {},
      loadSnapshot: async () => snapshot(),
      git: { head: async () => HEAD, status: async () => " M catalog/entries.json" },
    }),
    (error) => error.code === "dirty-cache-mutation-denied",
  );
});

test("catalog status policy separates deprecated confirmation from hard blocks", () => {
  const id = "codex:standalone:fixture-skill";
  assert.throws(
    () => resolveCatalogEntry(snapshot({ status: "deprecated" }), id, { operation: "install" }),
    (error) => error.code === "deprecated-package-confirmation",
  );
  assert.equal(
    resolveCatalogEntry(snapshot({ status: "deprecated" }), id, {
      operation: "install",
      allowDeprecated: true,
    }).status,
    "deprecated",
  );
  assert.equal(
    resolveCatalogEntry(snapshot({ status: "deprecated" }), id, { operation: "update" }).status,
    "deprecated",
  );
  for (const status of ["disabled", "removed"]) {
    assert.throws(
      () => resolveCatalogEntry(snapshot({ status }), id, { operation: "update" }),
      (error) => error.code === "catalog-status-blocked",
    );
  }
});
