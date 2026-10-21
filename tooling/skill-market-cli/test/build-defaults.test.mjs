import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { CLI_DEFAULTS_PATH, writeCliDefaults } from "../src/build/defaults.mjs";
import { writePluginCliBundles } from "../src/build/packaging.mjs";
import { GeneratedFileDriftError } from "../src/catalog/generators.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import { makeTempDirectory, removeTempDirectory } from "./helpers/temp-env.mjs";

const execFileAsync = promisify(execFile);

function isDefaultsDrift(error) {
  return error instanceof GeneratedFileDriftError && error.paths.includes(CLI_DEFAULTS_PATH);
}

test("CLI defaults checks detect missing, edited, and stale output without rewriting it", async () => {
  const root = await makeTempDirectory("skill-market-defaults-");
  const catalog = structuredClone(fixtureCatalog);
  const output = path.join(root, CLI_DEFAULTS_PATH);
  try {
    await assert.rejects(writeCliDefaults({ root, catalog, check: true }), isDefaultsDrift);
    await assert.rejects(access(output), { code: "ENOENT" });

    await writeCliDefaults({ root, catalog });
    await writeCliDefaults({ root, catalog, check: true });
    const original = await readFile(output, "utf8");
    const edited = original + "// manual edit\n";
    await writeFile(output, edited);
    await assert.rejects(writeCliDefaults({ root, catalog, check: true }), isDefaultsDrift);
    assert.equal(await readFile(output, "utf8"), edited);

    await writeCliDefaults({ root, catalog });
    catalog.defaults.cacheTtlSeconds = 0;
    await assert.rejects(writeCliDefaults({ root, catalog, check: true }), isDefaultsDrift);
    assert.equal(await readFile(output, "utf8"), original);

    await writeCliDefaults({ root, catalog });
    await writeCliDefaults({ root, catalog, check: true });
    const generated = await import(pathToFileURL(output).href);
    assert.equal(generated.DEFAULT_READ_REPO_URL, catalog.defaults.readRepoUrl);
    assert.equal(generated.DEFAULT_BASE_REF, catalog.defaults.baseRef);
    assert.equal(generated.DEFAULT_CACHE_TTL_SECONDS, 0);
  } finally {
    await removeTempDirectory(root);
  }
});

test("CLI defaults generation rejects embedded credentials before writing output", async () => {
  const root = await makeTempDirectory("skill-market-defaults-credentials-");
  const catalog = structuredClone(fixtureCatalog);
  catalog.defaults.readRepoUrl = "https://fixture:secret@example.test/market.git";
  try {
    await assert.rejects(
      writeCliDefaults({ root, catalog }),
      (error) => error.code === "invalid-repository-url",
    );
    await assert.rejects(access(path.join(root, CLI_DEFAULTS_PATH)), { code: "ENOENT" });
  } finally {
    await removeTempDirectory(root);
  }
});

test("catalog generation feeds runtime and help defaults in all detached plugin bundles", async () => {
  const root = await makeTempDirectory("skill-market-defaults-bundles-");
  const checkout = path.join(root, "checkout");
  const source = path.join(checkout, "tooling/skill-market-cli");
  const home = path.join(root, "home");
  const catalog = structuredClone(fixtureCatalog);
  catalog.defaults = {
    readRepoUrl: "https://example.test/alternate-market.git",
    baseRef: "release/fixture",
    cacheTtlSeconds: 123,
  };
  const options = { cwd: root, env: { HOME: home, PATH: path.dirname(process.execPath) } };
  try {
    await mkdir(source, { recursive: true });
    await mkdir(home);
    for (const item of ["bin", "src", "scripts", "package.json"]) {
      await cp(path.resolve("tooling/skill-market-cli", item), path.join(source, item), {
        recursive: true,
      });
    }
    await mkdir(path.join(checkout, "catalog"));
    await writeFile(path.join(checkout, "catalog/entries.json"), JSON.stringify(catalog));
    await rm(path.join(checkout, CLI_DEFAULTS_PATH));

    const generator = path.join(source, "scripts/generate-catalogs.mjs");
    await execFileAsync(process.execPath, [generator, "--root", checkout], options);
    await execFileAsync(process.execPath, [generator, "--root", checkout, "--check"], options);
    const { bundleRoots } = await writePluginCliBundles({ root: checkout });
    await writePluginCliBundles({ root: checkout, check: true });
    await rm(path.join(checkout, "tooling"), { recursive: true });
    await rm(path.join(checkout, "catalog"), { recursive: true });

    for (const bundle of bundleRoots) {
      const cli = path.join(bundle, "bin/skill-market.mjs");
      const config = JSON.parse((await execFileAsync(
        process.execPath, [cli, "config", "show"], options,
      )).stdout);
      assert.equal(config.ok, true);
      assert.equal(config.data.configExists, false);
      for (const [key, value] of Object.entries(catalog.defaults)) {
        assert.equal(config.data.effective[key], value, key);
        assert.equal(config.data.sources[key], "default", key);
      }

      const help = JSON.parse((await execFileAsync(process.execPath, [cli, "help"], options)).stdout);
      assert.equal(help.ok, true);
      for (const [option, key] of [
        ["--read-repo-url", "readRepoUrl"],
        ["--base-ref", "baseRef"],
        ["--cache-ttl-seconds", "cacheTtlSeconds"],
      ]) {
        assert.equal(help.data.sourceOptions[option].default, catalog.defaults[key], option);
      }

      const manifest = JSON.parse(await readFile(path.join(bundle, "manifest.json"), "utf8"));
      assert.ok(manifest.files.some((file) => file.path === "src/shared/defaults.generated.mjs"));
      await assert.rejects(access(path.join(bundle, "src/build")), { code: "ENOENT" });
    }
    await assert.rejects(access(path.join(home, ".skill-market")), { code: "ENOENT" });
  } finally {
    await removeTempDirectory(root);
  }
});
