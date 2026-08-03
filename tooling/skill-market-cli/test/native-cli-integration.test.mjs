import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { fixtureCatalog } from "./fixtures/catalog.mjs";
import {
  makeTempDirectory,
  removeTempDirectory,
  withTemporaryHome,
  writeFakeBinary,
} from "./helpers/temp-env.mjs";

const execFileAsync = promisify(execFile);

function fakeNativeSource(adapter) {
  return `
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_NATIVE_LOG, JSON.stringify(args) + "\\n");
if (args[0] === "plugin" && args[1] === "marketplace" && args[2] === "list") {
  const root = process.env.FAKE_REPO_ROOT;
  const payload = ${JSON.stringify(adapter)} === "codex"
    ? { marketplaces: [{ name: "skill-market", root, marketplaceSource: { sourceType: "local", source: root } }] }
    : [{ name: "skill-market", source: "directory", path: root }];
  process.stdout.write(JSON.stringify(payload));
} else if (args[0] === "plugin" && args[1] === "list") {
  process.stdout.write(JSON.stringify(${JSON.stringify(adapter)} === "codex" ? { installed: [] } : []));
} else {
  process.stdout.write(JSON.stringify({ ok: true }));
}
`;
}

test("the executable mutates plugins only through each adapter's fake native CLI", async () => {
  await withTemporaryHome(async (home) => {
    const binaryDirectory = await makeTempDirectory("skill-market-native-lifecycle-");
    try {
      const repoRoot = path.join(home, "repo");
      await mkdir(path.join(repoRoot, "catalog"), { recursive: true });
      await writeFile(
        path.join(repoRoot, "catalog", "entries.json"),
        `${JSON.stringify(fixtureCatalog, null, 2)}\n`,
        "utf8",
      );
      for (const adapter of ["claude", "codex", "grok"]) {
        const entry = fixtureCatalog.packages.find(
          (candidate) => candidate.adapter === adapter && candidate.kind === "plugin",
        );
        const packageRoot = path.join(repoRoot, entry.path);
        await mkdir(path.join(packageRoot, path.dirname(entry.manifestPath)), {
          recursive: true,
        });
        await writeFile(
          path.join(packageRoot, entry.manifestPath),
          `${JSON.stringify({ name: entry.name, version: entry.version })}\n`,
          "utf8",
        );
        await writeFakeBinary(binaryDirectory, adapter, fakeNativeSource(adapter));
      }

      const executable = path.resolve("tooling/skill-market-cli/bin/skill-market.mjs");
      const logPath = path.join(home, "native.log");
      const env = {
        HOME: home,
        PATH: [binaryDirectory, path.dirname(process.execPath)].join(path.delimiter),
        FAKE_NATIVE_LOG: logPath,
        FAKE_REPO_ROOT: repoRoot,
      };
      const invoke = async (...args) => {
        const { stdout } = await execFileAsync(process.execPath, [executable, ...args], { env });
        return JSON.parse(stdout);
      };

      assert.equal(
        (await invoke(
          "install",
          "codex:plugin:fixture-codex",
          "--repo-path",
          repoRoot,
        )).status,
        "ok",
      );
      assert.equal(
        (await invoke(
          "install",
          "claude:plugin:fixture-claude",
          "--repo-path",
          repoRoot,
          "--scope",
          "project",
        )).status,
        "ok",
      );
      assert.equal(
        (await invoke(
          "install",
          "grok:plugin:fixture-grok",
          "--repo-path",
          repoRoot,
          "--confirm-trust",
        )).status,
        "ok",
      );

      const calls = (await readFile(logPath, "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      assert.deepEqual(calls, [
        ["plugin", "list", "--marketplace", "skill-market", "--json"],
        ["plugin", "marketplace", "list", "--json"],
        ["plugin", "add", "fixture-codex@skill-market", "--json"],
        ["plugin", "list", "--json"],
        ["plugin", "marketplace", "list", "--json"],
        ["plugin", "install", "fixture-claude@skill-market", "--scope", "project"],
        ["plugin", "list", "--json"],
        [
          "plugin",
          "install",
          path.join(await realpath(repoRoot), "plugins/fixture-grok"),
          "--trust",
        ],
      ]);
    } finally {
      await removeTempDirectory(binaryDirectory);
    }
  });
});
