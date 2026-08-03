import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  PluginBundleDriftError,
  writePluginCliBundles,
} from "../src/packaging.mjs";
import { makeTempDirectory, removeTempDirectory } from "./helpers/temp-env.mjs";

const execFileAsync = promisify(execFile);

async function fixtureRoot() {
  const root = await makeTempDirectory("skill-market-packaging-");
  await mkdir(path.join(root, "tooling/skill-market-cli/bin"), { recursive: true });
  await mkdir(path.join(root, "tooling/skill-market-cli/src/nested"), { recursive: true });
  await writeFile(
    path.join(root, "tooling/skill-market-cli/bin/skill-market.mjs"),
    "#!/usr/bin/env node\nconsole.log('fixture');\n",
  );
  await writeFile(path.join(root, "tooling/skill-market-cli/src/main.mjs"), "export const value = 1;\n");
  await writeFile(path.join(root, "tooling/skill-market-cli/src/nested/value.mjs"), "export default 2;\n");
  return root;
}

test("plugin bundle generation creates byte-identical self-contained artifacts", async () => {
  const root = await fixtureRoot();
  try {
    const result = await writePluginCliBundles({ root });
    assert.equal(result.bundleRoots.length, 3);
    assert.equal(result.fileCount, 4);
    await writePluginCliBundles({ root, check: true });

    const snapshots = await Promise.all(result.bundleRoots.map(async (bundleRoot) => ({
      bin: await readFile(path.join(bundleRoot, "bin/skill-market.mjs")),
      source: await readFile(path.join(bundleRoot, "src/main.mjs")),
      nested: await readFile(path.join(bundleRoot, "src/nested/value.mjs")),
      manifest: await readFile(path.join(bundleRoot, "manifest.json")),
    })));
    for (const snapshot of snapshots.slice(1)) {
      assert.deepEqual(snapshot, snapshots[0]);
    }
  } finally {
    await removeTempDirectory(root);
  }
});

test("plugin bundle check reports changed and extra files", async () => {
  const root = await fixtureRoot();
  try {
    const result = await writePluginCliBundles({ root });
    await writeFile(path.join(result.bundleRoots[0], "src/main.mjs"), "drift\n");
    await writeFile(path.join(result.bundleRoots[1], "extra.mjs"), "extra\n");
    await assert.rejects(
      writePluginCliBundles({ root, check: true }),
      (error) =>
        error instanceof PluginBundleDriftError &&
        error.paths.some((item) => item.endsWith("src/main.mjs")) &&
        error.paths.some((item) => item.endsWith("extra.mjs")),
    );
  } finally {
    await removeTempDirectory(root);
  }
});

test("checked-in plugin bundles execute the canonical CLI", async () => {
  const helpOutputs = [];
  for (const adapter of ["codex", "claude", "grok"]) {
    const cli = path.resolve(`plugins/skill-market-${adapter}/cli/bin/skill-market.mjs`);
    const { stdout } = await execFileAsync(process.execPath, [cli, "--version"], {
      env: { ...process.env },
    });
    const result = JSON.parse(stdout);
    assert.equal(result.ok, true, adapter);
    assert.equal(result.data.version, "0.1.2", adapter);

    const help = await execFileAsync(process.execPath, [cli, "help"], {
      env: { ...process.env },
    });
    const contract = JSON.parse(help.stdout);
    assert.deepEqual(Object.keys(contract.data.commands), [
      "list",
      "discover",
      "download",
      "install",
      "update",
      "enable",
      "disable",
      "uninstall",
      "proposal",
      "config",
    ]);
    helpOutputs.push(help.stdout);
  }
  assert.equal(new Set(helpOutputs).size, 1);
});
