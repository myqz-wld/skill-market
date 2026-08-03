import assert from "node:assert/strict";
import { chmod, mkdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { SkillMarketError } from "../src/errors.mjs";
import { contentDigest, validatePackageContent } from "../src/package-content.mjs";
import { createStandaloneFixture } from "./helpers/lifecycle-fixture.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

test("package digests are stable across creation order but include executable mode", async () => {
  await withTemporaryHome(async (home) => {
    const left = path.join(home, "left");
    const right = path.join(home, "right");
    await mkdir(left);
    await mkdir(right);
    await writeFile(path.join(left, "b"), "two", { mode: 0o644 });
    await writeFile(path.join(left, "a"), "one", { mode: 0o755 });
    await writeFile(path.join(right, "a"), "one", { mode: 0o755 });
    await writeFile(path.join(right, "b"), "two", { mode: 0o644 });
    assert.equal(await contentDigest(left), await contentDigest(right));
    await chmod(path.join(right, "a"), 0o644);
    assert.notEqual(await contentDigest(left), await contentDigest(right));
  });
});

test("catalog packages reject symbolic links before copy", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const outside = path.join(home, "outside.txt");
    await writeFile(outside, "outside", "utf8");
    await symlink(outside, path.join(fixture.packagePath, "link"));
    await assert.rejects(
      validatePackageContent(fixture.entry, fixture.packagePath),
      (error) => error instanceof SkillMarketError && error.code === "invalid-package-content",
    );
  });
});
