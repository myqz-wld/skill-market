import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  PluginBundleDriftError,
  writePluginCliBundles,
} from "../src/build/packaging.mjs";
import { makeTempDirectory, removeTempDirectory } from "./helpers/temp-env.mjs";
import { CLI_VERSION } from "../src/cli/version.mjs";
import { helpContract } from "../src/cli/help.mjs";

const execFileAsync = promisify(execFile);

async function fixtureRoot() {
  const root = await makeTempDirectory("skill-market-packaging-");
  await mkdir(path.join(root, "tooling/skill-market-cli/bin"), { recursive: true });
  await mkdir(path.join(root, "tooling/skill-market-cli/src/nested"), { recursive: true });
  await mkdir(path.join(root, "tooling/skill-market-cli/src/build"), { recursive: true });
  await writeFile(path.join(root, "tooling/skill-market-cli/src/build/packaging.mjs"), "build only\n");
  await writeFile(path.join(root, "AGENTS.md"), "repository instructions\n");
  await writeFile(
    path.join(root, "tooling/skill-market-cli/package.json"),
    JSON.stringify({ name: "fixture-cli", version: "0.0.1", type: "module" }),
  );
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
    assert.equal(result.fileCount, 5);
    await writePluginCliBundles({ root, check: true });

    const snapshots = await Promise.all(result.bundleRoots.map(async (bundleRoot) => ({
      bin: await readFile(path.join(bundleRoot, "bin/skill-market.mjs")),
      source: await readFile(path.join(bundleRoot, "src/main.mjs")),
      nested: await readFile(path.join(bundleRoot, "src/nested/value.mjs")),
      metadata: await readFile(path.join(bundleRoot, "package.json")),
      manifest: await readFile(path.join(bundleRoot, "manifest.json")),
    })));
    for (const snapshot of snapshots.slice(1)) {
      assert.deepEqual(snapshot, snapshots[0]);
    }
    assert.equal(JSON.parse(snapshots[0].metadata).version, "0.0.1");
    for (const bundleRoot of result.bundleRoots) {
      await assert.rejects(access(path.join(bundleRoot, "src/build")), { code: "ENOENT" });
      await assert.rejects(access(path.join(bundleRoot, "AGENTS.md")), { code: "ENOENT" });
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

test("bundle metadata cannot redirect outside the source package", async () => {
  const root = await fixtureRoot();
  try {
    const metadata = path.join(root, "tooling/skill-market-cli/package.json");
    const external = path.join(root, "external.json");
    await writeFile(external, "{}");
    await rm(metadata);
    await symlink(external, metadata);
    await assert.rejects(writePluginCliBundles({ root }), /package.json must be a regular file/u);
  } finally {
    await removeTempDirectory(root);
  }
});

test("plugin bundles execute independently of the repository and working directory", async () => {
  const isolated = await makeTempDirectory("skill-market-detached-bundles-");
  const helpOutputs = [];
  try {
    const options = {
      cwd: isolated,
      env: { HOME: isolated, PATH: path.dirname(process.execPath) },
    };
    for (const adapter of ["codex", "claude", "grok"]) {
      const bundle = path.join(isolated, adapter);
      await cp(path.resolve(`plugins/skill-market-${adapter}/cli`), bundle, { recursive: true });
      const cli = path.join(bundle, "bin/skill-market.mjs");
      const { stdout } = await execFileAsync(process.execPath, [cli, "--version"], options);
      const result = JSON.parse(stdout);
      assert.equal(result.ok, true, adapter);
      assert.equal(result.data.version, CLI_VERSION, adapter);

      const help = await execFileAsync(process.execPath, [cli, "help"], options);
      assert.deepEqual(JSON.parse(help.stdout).data, helpContract(), adapter);
      helpOutputs.push(help.stdout);
    }
    assert.equal(new Set(helpOutputs).size, 1);
  } finally {
    await removeTempDirectory(isolated);
  }
});
