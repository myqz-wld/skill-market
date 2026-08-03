import assert from "node:assert/strict";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { collectLocalInventory, updateStateFor } from "../src/inventory.mjs";
import { readManagedPackages } from "../src/managed-state.mjs";
import {
  parseNativePluginList,
  readNativePlugins,
} from "../src/native-inventory.mjs";
import { compareSemver } from "../src/versions.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

const nativePayloads = {
  codex: {
    installed: [
      {
        pluginId: "fixture-codex@skill-market",
        name: "fixture-codex",
        marketplaceName: "skill-market",
        version: "0.0.9",
        installed: true,
        enabled: true,
        source: { source: "local", path: "/plugins/fixture-codex" },
      },
      {
        pluginId: "unrelated@elsewhere",
        name: "unrelated",
        marketplaceName: "elsewhere",
        version: "1.0.0",
        installed: true,
      },
    ],
    available: [],
  },
  claude: [
    {
      id: "fixture-claude@skill-market",
      version: "0.1.0",
      scope: "project",
      enabled: false,
      installPath: "/plugins/fixture-claude",
    },
  ],
  grok: [
    {
      id: "fixture-grok@skill-market",
      version: "0.1.1",
      enabled: true,
      installPath: "/plugins/fixture-grok",
    },
  ],
};

test("native JSON variants normalize to one three-adapter inventory contract", () => {
  const codex = parseNativePluginList("codex", nativePayloads.codex);
  const claude = parseNativePluginList("claude", nativePayloads.claude);
  const grok = parseNativePluginList("grok", nativePayloads.grok);
  assert.equal(codex.length, 1);
  assert.equal(codex[0].id, "codex:plugin:fixture-codex");
  assert.equal(claude[0].localState, "disabled");
  assert.equal(claude[0].native.scope, "project");
  assert.equal(grok[0].id, "grok:plugin:fixture-grok");
  assert.ok([...codex, ...claude, ...grok].every((item) => item.ownership === "native"));
});

test("native reader uses adapter-owned commands and machine-readable output", async () => {
  const calls = [];
  const execute = async (command, args) => {
    calls.push([command, args]);
    return JSON.stringify(nativePayloads[command]);
  };
  await readNativePlugins({ adapter: "codex", execute });
  await readNativePlugins({ adapter: "claude", execute });
  await readNativePlugins({ adapter: "grok", execute });
  assert.deepEqual(calls, [
    ["codex", ["plugin", "list", "--marketplace", "skill-market", "--json"]],
    ["claude", ["plugin", "list", "--json"]],
    ["grok", ["plugin", "list", "--json"]],
  ]);
});

test("managed v2 state reconciles active, disabled, and broken paths", async () => {
  await withTemporaryHome(async (home) => {
    const statePath = path.join(home, ".skill-market/managed-state.json");
    const activePath = path.join(home, ".codex/skills/fixture-skill");
    const disabledPath = path.join(home, ".codex/skills.disabled/fixture-skill");
    const brokenActive = path.join(home, ".grok/skills/fixture-skill");
    const brokenDisabled = path.join(home, ".grok/skills.disabled/fixture-skill");
    await mkdir(activePath, { recursive: true });
    await mkdir(brokenActive, { recursive: true });
    await mkdir(brokenDisabled, { recursive: true });
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(
      statePath,
      JSON.stringify({
        schemaVersion: 2,
        packages: {
          "codex:standalone:fixture-skill": {
            adapter: "codex",
            kind: "standalone",
            name: "fixture-skill",
            installedVersion: "0.0.1",
            ownership: "skill-market",
            catalogPath: "skills/codex/fixture-skill",
            activePath,
            disabledPath,
            contentDigest: "b".repeat(64),
            activation: "active",
            installedAt: "2026-08-03T00:00:00.000Z",
            updatedAt: "2026-08-03T00:00:00.000Z",
            uninstalledAt: null,
            source: {
              repoIdentity: "example.test/skill-market",
              head: "a".repeat(40),
              freshness: "fresh",
            },
          },
          "grok:standalone:fixture-skill": {
            adapter: "grok",
            kind: "standalone",
            name: "fixture-skill",
            installedVersion: "0.0.1",
            ownership: "adopted",
            catalogPath: "skills/grok/fixture-skill",
            activePath: brokenActive,
            disabledPath: brokenDisabled,
            contentDigest: "c".repeat(64),
            activation: "active",
            installedAt: "2026-08-03T00:00:00.000Z",
            updatedAt: "2026-08-03T00:00:00.000Z",
            uninstalledAt: null,
            source: {
              repoIdentity: "example.test/skill-market",
              head: "a".repeat(40),
              freshness: "fresh",
            },
          },
        },
      }),
      "utf8",
    );
    const packages = await readManagedPackages(statePath);
    assert.equal(packages.find((item) => item.adapter === "codex").localState, "active");
    const broken = packages.find((item) => item.adapter === "grok");
    assert.equal(broken.localState, "broken");
    assert.match(broken.diagnostic, /both exist/u);
  });
});

test("local inventory joins optional catalog data without scanning unrelated skills", async () => {
  await withTemporaryHome(async (home) => {
    const statePath = path.join(home, ".skill-market/managed-state.json");
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(statePath, JSON.stringify({ schemaVersion: 2, packages: {} }), "utf8");
    await mkdir(path.join(home, ".codex/skills/unrelated"), { recursive: true });
    const nativeReader = async ({ adapter }) =>
      parseNativePluginList(adapter, nativePayloads[adapter]);
    const result = await collectLocalInventory({
      statePath,
      nativeReader,
      catalogSnapshot: {
        catalog: fixtureCatalog,
        freshness: "fresh",
        source: { mode: "cache" },
      },
      env: { HOME: home },
    });
    assert.deepEqual(result.items.map((item) => item.id), [
      "claude:plugin:fixture-claude",
      "codex:plugin:fixture-codex",
      "grok:plugin:fixture-grok",
    ]);
    assert.equal(
      result.items.find((item) => item.adapter === "codex").updateState,
      "update_available",
    );
    assert.equal(result.items.find((item) => item.adapter === "claude").updateState, "current");
    assert.equal(result.items.find((item) => item.adapter === "grok").updateState, "ahead");
  });
});

test("semantic version comparison and catalog absence states are deterministic", () => {
  assert.equal(compareSemver("1.0.0-beta.2", "1.0.0-beta.10"), -1);
  assert.equal(compareSemver("1.0.0", "1.0.0-rc.1"), 1);
  assert.equal(updateStateFor("1.0.0", null, false), "unknown");
  assert.equal(updateStateFor("1.0.0", null, true), "catalog_missing");
});

test("inventory reports unsafe recorded paths as broken without trusting their location", async () => {
  await withTemporaryHome(async (home) => {
    const statePath = path.join(home, ".skill-market/managed-state.json");
    const outside = path.join(home, "outside", "fixture-skill");
    await mkdir(outside, { recursive: true });
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(
      statePath,
      JSON.stringify({
        schemaVersion: 2,
        packages: {
          "codex:standalone:fixture-skill": {
            adapter: "codex",
            kind: "standalone",
            name: "fixture-skill",
            installedVersion: "1.0.0",
            ownership: "skill-market",
            catalogPath: "skills/codex/fixture-skill",
            activePath: outside,
            disabledPath: path.join(home, ".codex/skills.disabled/fixture-skill"),
            contentDigest: "b".repeat(64),
            activation: "active",
            installedAt: "2026-08-03T00:00:00.000Z",
            updatedAt: "2026-08-03T00:00:00.000Z",
            uninstalledAt: null,
            source: {
              repoIdentity: "example.test/skill-market",
              head: "a".repeat(40),
              freshness: "fresh",
            },
          },
        },
      }),
      "utf8",
    );
    const [item] = await readManagedPackages(statePath, { home });
    assert.equal(item.localState, "broken");
    assert.equal(item.location, null);
    assert.match(item.diagnostic, /paths do not match/u);
  });
});

test("inventory rejects a symlinked managed-state file before reading it", async () => {
  await withTemporaryHome(async (home) => {
    const marketHome = path.join(home, ".skill-market");
    const outside = path.join(home, "outside-state.json");
    const statePath = path.join(marketHome, "managed-state.json");
    await mkdir(marketHome, { recursive: true });
    await writeFile(outside, JSON.stringify({ schemaVersion: 2, packages: {} }), "utf8");
    await symlink(outside, statePath);
    await assert.rejects(
      readManagedPackages(statePath, { home, marketHome }),
      (error) => error.code === "unsafe-path-topology",
    );
  });
});
