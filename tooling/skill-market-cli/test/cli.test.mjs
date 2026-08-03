import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { runCli } from "../src/cli.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import {
  makeTempDirectory,
  removeTempDirectory,
  withTemporaryHome,
  writeFakeBinary,
} from "./helpers/temp-env.mjs";

const execFileAsync = promisify(execFile);

test("help exposes canonical commands and obsolete names are not aliases", async () => {
  const help = await runCli(["help"]);
  assert.equal(help.ok, true);
  assert.deepEqual(Object.keys(help.data.commands), ["list", "discover", "config"]);
  const obsolete = await runCli(["search"]);
  assert.equal(obsolete.ok, false);
  assert.equal(obsolete.error.code, "unknown-command");
  assert.ok(!obsolete.error.details.allowed.includes("search"));
});

test("list reads local state without creating config or cache", async () => {
  await withTemporaryHome(async (home) => {
    const env = { HOME: home };
    let nativeReads = 0;
    const result = await runCli(["list", "--adapter", "codex", "--kind", "plugin"], {
      env,
      nativeReader: async ({ adapter }) => {
        nativeReads += 1;
        assert.equal(adapter, "codex");
        return [];
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.status, "noop");
    assert.equal(nativeReads, 1);
    await assert.rejects(access(path.join(home, ".skill-market/config.json")), { code: "ENOENT" });
    await assert.rejects(access(path.join(home, ".skill-market/cache")), { code: "ENOENT" });
  });
});

test("invalid list filters fail before config, cache, or native reads", async () => {
  let calls = 0;
  const result = await runCli(["list", "--adapter", "other"], {
    env: { HOME: "/tmp/skill-market-cli-filter-test" },
    loadEffectiveConfig: async () => {
      calls += 1;
      throw new Error("must not load config");
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid-filter");
  assert.equal(calls, 0);
});

test("discover passes refresh policy and returns ranked catalog JSON", async () => {
  await withTemporaryHome(async (home) => {
    const snapshot = {
      catalog: fixtureCatalog,
      freshness: "fresh",
      source: { mode: "cache", repoIdentity: "example.test/skill-market" },
      warnings: [],
    };
    let observed;
    const result = await runCli(
      ["discover", "fixture-codex", "--adapter", "codex", "--latest", "--limit", "5"],
      {
        env: { HOME: home },
        loadCatalogSnapshot: async (options) => {
          observed = options;
          return snapshot;
        },
        collectLocalInventory: async () => ({
          items: [],
          warnings: [],
          catalog: { loaded: true, freshness: "fresh", source: snapshot.source },
        }),
      },
    );
    assert.equal(result.ok, true);
    assert.equal(observed.latest, true);
    assert.equal(observed.offline, false);
    assert.equal(result.data.items[0].id, "codex:plugin:fixture-codex");
    assert.equal(result.data.items[0].match, "exact");
    assert.equal(result.data.items[0].localState, "absent");
  });
});

test("config set and unset are the only commands that persist defaults", async () => {
  await withTemporaryHome(async (home) => {
    const env = { HOME: home };
    const show = await runCli(["config", "show"], { env });
    assert.equal(show.data.configExists, false);

    const set = await runCli(["config", "set", "cacheTtlSeconds", "90"], { env });
    assert.equal(set.ok, true);
    const configPath = path.join(home, ".skill-market/config.json");
    assert.equal(JSON.parse(await readFile(configPath, "utf8")).cacheTtlSeconds, 90);

    const unset = await runCli(["config", "unset", "cacheTtlSeconds"], { env });
    assert.equal(unset.ok, true);
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")), { schemaVersion: 1 });
  });
});

test("the executable lists three adapters through fake binaries without network state", async () => {
  await withTemporaryHome(async (home) => {
    const binaryDirectory = await makeTempDirectory("skill-market-native-bin-");
    try {
      await writeFakeBinary(
        binaryDirectory,
        "codex",
        `process.stdout.write(${JSON.stringify(JSON.stringify({ installed: [{ pluginId: "fixture-codex@skill-market", name: "fixture-codex", marketplaceName: "skill-market", version: "0.1.0", enabled: true }] }))});`,
      );
      await writeFakeBinary(
        binaryDirectory,
        "claude",
        `process.stdout.write(${JSON.stringify(JSON.stringify([{ id: "fixture-claude@skill-market", version: "0.1.0", enabled: true }]))});`,
      );
      await writeFakeBinary(
        binaryDirectory,
        "grok",
        `process.stdout.write(${JSON.stringify(JSON.stringify([{ id: "fixture-grok@skill-market", version: "0.1.0", enabled: true }]))});`,
      );
      const executable = path.resolve("tooling/skill-market-cli/bin/skill-market.mjs");
      const { stdout } = await execFileAsync(process.execPath, [executable, "list", "--kind", "plugin"], {
        env: {
          HOME: home,
          PATH: [binaryDirectory, path.dirname(process.execPath)].join(path.delimiter),
        },
      });
      const result = JSON.parse(stdout);
      assert.deepEqual(result.data.items.map((item) => item.id), [
        "claude:plugin:fixture-claude",
        "codex:plugin:fixture-codex",
        "grok:plugin:fixture-grok",
      ]);
      await assert.rejects(access(path.join(home, ".skill-market/config.json")), { code: "ENOENT" });
      await assert.rejects(access(path.join(home, ".skill-market/cache")), { code: "ENOENT" });
    } finally {
      await removeTempDirectory(binaryDirectory);
    }
  });
});
