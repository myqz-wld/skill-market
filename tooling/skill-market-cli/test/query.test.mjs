import assert from "node:assert/strict";
import test from "node:test";

import { discoverCatalog, listInventory } from "../src/query.mjs";

const catalog = {
  packages: [
    entry("codex:standalone:alpha", "alpha", "Exact package."),
    entry("claude:standalone:alpha-tool", "alpha-tool", "Prefix package.", "claude"),
    entry("grok:standalone:tool-alpha", "tool-alpha", "Token package.", "grok"),
    entry("codex:standalone:other", "other", "Contains alpha only in description."),
    entry("codex:standalone:alpha-old", "alpha-old", "Deprecated package.", "codex", "deprecated"),
  ],
};

function entry(id, name, description, adapter = "codex", status = "active") {
  return {
    id,
    adapter,
    kind: "standalone",
    name,
    version: "1.0.0",
    status,
    path: `skills/${adapter}/${name}`,
    description,
    keywords: [],
  };
}

test("discover ranks exact, prefix, token, then description matches", () => {
  const result = discoverCatalog({ catalog, query: "alpha", freshness: "fresh" });
  assert.deepEqual(
    result.items.map((item) => [item.id, item.match]),
    [
      ["codex:standalone:alpha", "exact"],
      ["claude:standalone:alpha-tool", "prefix"],
      ["grok:standalone:tool-alpha", "token"],
      ["codex:standalone:other", "description"],
    ],
  );
  assert.ok(result.items.every((item) => item.localState === "absent"));
});

test("discover without a query browses active entries with stable pagination", () => {
  const first = discoverCatalog({ catalog, limit: 2, offset: 0, freshness: "stale" });
  const second = discoverCatalog({ catalog, limit: 2, offset: 2, freshness: "stale" });
  assert.equal(first.page.total, 4);
  assert.equal(first.page.hasMore, true);
  assert.deepEqual(
    [...first.items, ...second.items].map((item) => item.id),
    [
      "claude:standalone:alpha-tool",
      "codex:standalone:alpha",
      "codex:standalone:other",
      "grok:standalone:tool-alpha",
    ],
  );
  assert.ok(first.items.every((item) => item.match === null));
});

test("discover filters deprecated entries only when explicitly requested", () => {
  assert.equal(discoverCatalog({ catalog, query: "alpha-old" }).items.length, 0);
  const result = discoverCatalog({
    catalog,
    query: "alpha-old",
    statuses: ["deprecated"],
    adapters: ["codex"],
  });
  assert.equal(result.items[0].catalogStatus, "deprecated");
});

test("list filters only normalized local inventory and retains provenance", () => {
  const inventory = {
    catalog: { loaded: false, freshness: null, source: null },
    warnings: [],
    items: [
      {
        id: "codex:plugin:one",
        adapter: "codex",
        kind: "plugin",
        localState: "active",
        ownership: "native",
        updateState: "unknown",
      },
      {
        id: "grok:standalone:two",
        adapter: "grok",
        kind: "standalone",
        localState: "disabled",
        ownership: "adopted",
        updateState: "update_available",
      },
    ],
  };
  const result = listInventory({
    inventory,
    adapters: ["grok"],
    localStates: ["disabled"],
    updateStates: ["update_available"],
  });
  assert.deepEqual(result.items.map((item) => item.id), ["grok:standalone:two"]);
  assert.equal(result.catalog.loaded, false);
});

test("list excludes absent history by default and requires an explicit history view", () => {
  const inventory = {
    catalog: { loaded: false, freshness: null, source: null },
    warnings: [],
    items: [
      {
        id: "codex:standalone:past",
        adapter: "codex",
        kind: "standalone",
        localState: "absent",
        ownership: "skill-market",
        updateState: "unknown",
      },
    ],
  };
  assert.equal(listInventory({ inventory }).page.total, 0);
  assert.equal(listInventory({ inventory, history: true }).page.total, 1);
  assert.throws(
    () => listInventory({ inventory, localStates: ["absent"] }),
    (error) => error.code === "history-required",
  );
});

test("query validation rejects invalid filters and unbounded pages", () => {
  assert.throws(() => discoverCatalog({ catalog, adapters: ["other"] }), /unsupported values/u);
  assert.throws(() => discoverCatalog({ catalog, limit: 101 }), /1 through 100/u);
});
