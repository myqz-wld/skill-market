import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { validatePluginManifest, validateRepositoryPlugins } from "../src/build/plugin-validation.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

const execFileAsync = promisify(execFile);
const script = path.resolve("tooling/skill-market-cli/scripts/validate-plugins.mjs");

async function withFixture(callback) {
  await withTemporaryHome(async (home) => {
    const root = path.join(home, "repo");
    const catalog = JSON.parse(await readFile("catalog/entries.json", "utf8"));
    const entries = catalog.packages.filter((entry) => entry.kind === "plugin");
    const fixtures = {};
    for (const entry of entries) {
      const manifest = JSON.parse(await readFile(path.join(entry.path, entry.manifestPath), "utf8"));
      const directory = path.join(root, entry.path);
      const file = path.join(directory, entry.manifestPath);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify(manifest));
      await mkdir(path.join(directory, "skills/example"), { recursive: true });
      await writeFile(path.join(directory, "skills/example/SKILL.md"),
        "---\nname: example\ndescription: A synthetic test skill.\n---\n");
      fixtures[entry.adapter] = { entry, manifest, directory, file };
    }
    await mkdir(path.join(root, "catalog"));
    await writeFile(path.join(root, "catalog/entries.json"),
      JSON.stringify({ ...catalog, packages: entries }));
    await callback({ home, root, fixtures });
  });
}

test("repository plugin validation works without native CLIs, Python or installed skills", async () => {
  await withFixture(async ({ home, root }) => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [script, "--root", root], {
      cwd: home, env: { HOME: home, PATH: "" },
    });
    assert.match(stdout, /checked 3 plugin manifests/u);
    assert.equal(stderr, "");
    assert.deepEqual((await validateRepositoryPlugins({ root })).map((result) => result.skills),
      [1, 1, 1]);
  });
});

test("all adapters reject malformed JSON, field types, unknown fields and identity drift", async () => {
  await withFixture(async ({ root, fixtures }) => {
    const cases = [
      [null, /must be an object/u],
      [[], /must be an object/u],
      [{ description: 42 }, /\.description: must be a non-empty string/u],
      [{ author: "Example" }, /\.author: must be an object/u],
      [{ author: { name: false } }, /\.author.name: must be a non-empty string/u],
      [{ keywords: ["one", 2] }, /\.keywords\[1\]/u],
      [{ keywords: ["one", "one"] }, /duplicates/u],
      [{ license: false }, /\.license/u],
      [{ descrption: "Typo" }, /unsupported field/u],
      [{ name: "different-name" }, /identity must equal/u],
      [{ version: "0.0.0-invalid..version" }, /must be semver/u],
    ];
    for (const fixture of Object.values(fixtures)) {
      for (const [change, expected] of cases) {
        const candidate = change === null || Array.isArray(change)
          ? change : { ...fixture.manifest, ...change };
        await writeFile(fixture.file, JSON.stringify(candidate));
        await assert.rejects(validatePluginManifest({ root, entry: fixture.entry }), expected);
      }
      await writeFile(fixture.file, "{invalid");
      await assert.rejects(validatePluginManifest({ root, entry: fixture.entry }), /valid JSON/u);
    }
  });
});

test("Codex validates its interface metadata without applying it to other adapters", async () => {
  await withFixture(async ({ root, fixtures }) => {
    const { file, manifest, entry } = fixtures.codex;
    for (const invalid of [
      null, [], { ...manifest.interface, displayName: "" },
      { ...manifest.interface, defaultPrompt: "not-an-array" },
      { ...manifest.interface, capabilities: [false] },
      { ...manifest.interface, brandColor: "#GGGGGG" },
      { ...manifest.interface, displayNmae: "Typo" },
    ]) {
      await writeFile(file, JSON.stringify({ ...manifest, interface: invalid }));
      await assert.rejects(validatePluginManifest({ root, entry }), /interface/u);
    }
    for (const adapter of ["claude", "grok"]) {
      const fixture = fixtures[adapter];
      await writeFile(fixture.file, JSON.stringify({ ...fixture.manifest, interface: {} }));
      await assert.rejects(validatePluginManifest({ root, entry: fixture.entry }), /unsupported field/u);
    }
    await assert.rejects(validatePluginManifest({
      root, entry: { ...entry, manifestPath: ".claude-plugin/plugin.json" },
    }), /manifestPath must equal .codex-plugin/u);
  });
});

test("Codex follows its declared skill directory and rejects unsafe or mistyped paths", async () => {
  await withFixture(async ({ root, fixtures }) => {
    const { directory, file, manifest, entry } = fixtures.codex;
    await rename(path.join(directory, "skills"), path.join(directory, "custom"));
    await writeFile(file, JSON.stringify({ ...manifest, skills: "./custom/" }));
    assert.equal((await validatePluginManifest({ root, entry })).skills, 1);
    for (const skills of [
      1, [], "/tmp/skills", "../outside", "./custom/../../outside",
      "C:\\skills", "./custom\\example", "./custom//example", "./custom/./example",
      "file:skills", "./missing/", "./custom/example/SKILL.md",
    ]) {
      await writeFile(file, JSON.stringify({ ...manifest, skills }));
      await assert.rejects(validatePluginManifest({ root, entry }), /skills/u);
    }
  });
});

test("all adapters reject missing, empty or invalid skill entry directories", async () => {
  await withFixture(async ({ root, fixtures }) => {
    for (const fixture of Object.values(fixtures)) {
      const skill = path.join(fixture.directory, "skills/example/SKILL.md");
      await rm(skill);
      await assert.rejects(validatePluginManifest({ root, entry: fixture.entry }), /SKILL.md/u);
      await mkdir(skill);
      await assert.rejects(validatePluginManifest({ root, entry: fixture.entry }), /regular file/u);
      await rm(path.dirname(skill), { recursive: true });
      await assert.rejects(validatePluginManifest({ root, entry: fixture.entry }), /at least one skill/u);
      await rm(path.join(fixture.directory, "skills"), { recursive: true });
      await assert.rejects(validatePluginManifest({ root, entry: fixture.entry }), /required directory/u);
    }
  });
});

test("manifest, skill and ancestor symlinks cannot redirect validation outside a package", async () => {
  await withFixture(async ({ home, root, fixtures }) => {
    const fixture = fixtures.codex;
    const options = { root, entry: fixture.entry };
    const outside = path.join(home, "outside");
    await mkdir(outside);
    await writeFile(path.join(outside, "SKILL.md"), "outside\n");
    const entryFile = path.join(fixture.directory, "skills/example/SKILL.md");
    await rm(entryFile);
    await symlink(path.join(outside, "SKILL.md"), entryFile);
    await assert.rejects(validatePluginManifest(options), /symbolic links/u);

    const skills = path.join(fixture.directory, "skills");
    await rm(skills, { recursive: true });
    await symlink(outside, skills);
    await assert.rejects(validatePluginManifest(options), /symbolic links/u);
    await rm(skills);
    await mkdir(skills);
    await symlink(outside, path.join(skills, "example"));
    await assert.rejects(validatePluginManifest(options), /symbolic links/u);

    await rm(fixture.file);
    await writeFile(path.join(outside, "plugin.json"), JSON.stringify(fixture.manifest));
    await symlink(path.join(outside, "plugin.json"), fixture.file);
    await assert.rejects(validatePluginManifest(options), /symbolic links/u);

    await rename(path.join(root, "plugins"), path.join(home, "redirected-plugins"));
    await symlink(path.join(home, "redirected-plugins"), path.join(root, "plugins"));
    await assert.rejects(validatePluginManifest(options), /symbolic links/u);
    await assert.rejects(validatePluginManifest({
      root, entry: { ...fixture.entry, path: "../outside" },
    }), /parent segments/u);
  });
});

test("validation command fails usefully on a bad package without exposing machine paths", async () => {
  await withFixture(async ({ home, root, fixtures }) => {
    await writeFile(fixtures.grok.file, JSON.stringify({ ...fixtures.grok.manifest, version: 4 }));
    await assert.rejects(
      execFileAsync(process.execPath, [script, "--root", root], {
        cwd: home, env: { HOME: home, PATH: "" },
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /plugins\/skill-market-grok\/.grok-plugin\/plugin.json.version/u);
        assert.ok(!error.stderr.includes(home));
        assert.equal(error.stdout, "");
        return true;
      },
    );
  });
});
