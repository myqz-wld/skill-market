import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { runCli } from "../src/cli/index.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

async function contents(root, relative = "") {
  const files = {};
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) Object.assign(files, await contents(root, child));
    else files[child] = await readFile(path.join(root, child), "utf8");
  }
  return files;
}

test("catalog standalone packages install with all resources in an isolated home", async () => {
  const repo = path.resolve(".");
  const catalog = JSON.parse(await readFile("catalog/entries.json", "utf8"));
  await withTemporaryHome(async (home) => {
    const env = { HOME: home, PATH: path.dirname(process.execPath) };
    const entries = catalog.packages.filter((entry) =>
      entry.kind === "standalone" && entry.status === "active");
    for (const entry of entries) {
      const { id, adapter, name } = entry;
      const result = await runCli(["install", id, "--repo-path", repo], { env });
      assert.equal(result.ok, true, JSON.stringify(result));
      const source = await contents(path.join(repo, entry.path));
      const installed = await contents(path.join(home, `.${adapter}`, "skills", name));
      assert.deepEqual(installed, source, id);
      assert.ok(source["SKILL.md"], id + " entry");
      if (adapter === "codex") {
        assert.ok(source[path.join("agents", "openai.yaml")], id + " native metadata");
      }
      const repeated = await runCli(["install", id, "--repo-path", repo], { env });
      assert.equal(repeated.status, "noop", id);
    }
    const state = JSON.parse(await readFile(path.join(home, ".skill-market/managed-state.json"), "utf8"));
    assert.deepEqual(Object.keys(state.packages).sort(), entries.map((entry) => entry.id).sort());
    for (const [id, record] of Object.entries(state.packages)) {
      assert.equal(record.installedVersion, catalog.packages.find((entry) => entry.id === id).version);
    }
  });
});
