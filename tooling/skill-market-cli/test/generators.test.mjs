import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  GeneratedFileDriftError,
  renderCatalogViews,
  writeCatalogViews,
} from "../src/generators.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import { makeTempDirectory, removeTempDirectory } from "./helpers/temp-env.mjs";

test("rendered views match the checked-in golden files byte for byte", async () => {
  const views = renderCatalogViews(structuredClone(fixtureCatalog));
  assert.deepEqual([...views.keys()], [
    ".agents/plugins/marketplace.json",
    ".claude-plugin/marketplace.json",
    ".grok-plugin/marketplace.json",
    "skills/INDEX.md",
  ]);
  for (const [relativePath, rendered] of views) {
    const golden = await readFile(
      path.join("tooling/skill-market-cli/test/fixtures/generated", relativePath),
      "utf8",
    );
    assert.equal(rendered, golden, relativePath);
  }
});

test("write and check modes detect generated drift", async () => {
  const root = await makeTempDirectory("skill-market-generator-");
  try {
    await writeCatalogViews({ root, catalog: structuredClone(fixtureCatalog) });
    await writeCatalogViews({ root, catalog: structuredClone(fixtureCatalog), check: true });

    const codexPath = path.join(root, ".agents/plugins/marketplace.json");
    const original = await readFile(codexPath, "utf8");
    await writeFile(codexPath, original.replace("Skill Market", "Drifted Market"), "utf8");

    await assert.rejects(
      writeCatalogViews({ root, catalog: structuredClone(fixtureCatalog), check: true }),
      (error) =>
        error instanceof GeneratedFileDriftError &&
        error.paths.includes(".agents/plugins/marketplace.json"),
    );
  } finally {
    await removeTempDirectory(root);
  }
});
