import assert from "node:assert/strict";
import { access, mkdir, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { downloadPackage } from "../src/download.mjs";
import { SkillMarketError } from "../src/errors.mjs";
import { createStandaloneFixture } from "./helpers/lifecycle-fixture.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

test("downloads are versioned, idempotent, and require force for different content", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const downloadsRoot = path.join(fixture.marketHome, "downloads");
    const input = {
      entry: fixture.entry,
      snapshot: fixture.snapshot,
      downloadsRoot,
      marketHome: fixture.marketHome,
    };
    const first = await downloadPackage(input);
    assert.equal(first.status, "ok");
    assert.equal(first.data.path, path.join(downloadsRoot, "codex", "standalone", "fixture-skill", "1.0.0"));
    assert.equal((await downloadPackage(input)).status, "noop");

    await writeFile(path.join(fixture.packagePath, "SKILL.md"), "changed catalog content\n", "utf8");
    await assert.rejects(
      downloadPackage(input),
      (error) =>
        error instanceof SkillMarketError && error.code === "download-overwrite-confirmation",
    );
    const forced = await downloadPackage({ ...input, force: true });
    assert.equal(forced.status, "ok");
    assert.match(await readFile(forced.data.path + "/SKILL.md", "utf8"), /changed/u);
  });
});

test("download swap failures restore the prior destination", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const downloadsRoot = path.join(fixture.marketHome, "downloads");
    const input = {
      entry: fixture.entry,
      snapshot: fixture.snapshot,
      downloadsRoot,
      marketHome: fixture.marketHome,
    };
    const first = await downloadPackage(input);
    await writeFile(path.join(fixture.packagePath, "SKILL.md"), "replacement\n", "utf8");
    await assert.rejects(
      downloadPackage({
        ...input,
        force: true,
        hooks: {
          afterSwap: async () => {
            throw new Error("fixture swap failure");
          },
        },
      }),
      (error) =>
        error.code === "transaction-rolled-back" &&
        /fixture swap failure/u.test(error.details.originalError),
    );
    assert.equal(await readFile(path.join(first.data.path, "SKILL.md"), "utf8"), "fixture v1\n");
    await access(first.data.path);
  });
});

test("symlinked download roots cannot redirect writes", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const outside = path.join(home, "outside");
    await mkdir(fixture.marketHome, { recursive: true });
    await mkdir(outside);
    await symlink(outside, path.join(fixture.marketHome, "downloads"));
    await assert.rejects(
      downloadPackage({
        entry: fixture.entry,
        snapshot: fixture.snapshot,
        downloadsRoot: path.join(fixture.marketHome, "downloads"),
        marketHome: fixture.marketHome,
      }),
      (error) => error.code === "unsafe-path-topology",
    );
    assert.deepEqual(await readdir(outside), []);
  });
});
