import assert from "node:assert/strict";
import test from "node:test";

import path from "node:path";

import {
  CatalogValidationError,
  loadCatalog,
  validateCatalog,
} from "../src/catalog.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";

test("the canonical fixture catalog validates", () => {
  assert.equal(validateCatalog(structuredClone(fixtureCatalog)).packages.length, 6);
});

test("the repository catalog covers every first-class adapter", async () => {
  const catalog = await loadCatalog(path.resolve("catalog/entries.json"));
  assert.equal(catalog.packages.length, 18);
  assert.deepEqual([...new Set(catalog.packages.map((entry) => entry.adapter))], [
    "claude",
    "codex",
    "grok",
  ]);
});

test("catalog plugins may be bootstrap or ordinary packages", () => {
  const catalog = structuredClone(fixtureCatalog);
  catalog.packages[0].bootstrap = false;
  assert.equal(validateCatalog(catalog).packages[0].bootstrap, false);
});

test("catalog validation rejects duplicate identities", () => {
  const catalog = structuredClone(fixtureCatalog);
  catalog.packages[1].id = catalog.packages[0].id;
  assert.throws(
    () => validateCatalog(catalog),
    (error) =>
      error instanceof CatalogValidationError &&
      error.issues.some((issue) => issue.includes("duplicates")),
  );
});

test("catalog validation rejects unsafe paths", () => {
  const catalog = structuredClone(fixtureCatalog);
  catalog.packages[0].path = "../outside";
  assert.throws(() => validateCatalog(catalog), /must stay inside the repository/u);
});

test("catalog validation rejects unsafe defaults and malformed package records", () => {
  const unsafeRemote = structuredClone(fixtureCatalog);
  unsafeRemote.defaults.readRepoUrl = "relative/skill-market.git";
  unsafeRemote.defaults.baseRef = "--upload-pack=bad";
  assert.throws(
    () => validateCatalog(unsafeRemote),
    (error) =>
      error instanceof CatalogValidationError &&
      error.issues.includes("defaults.readRepoUrl must be an absolute URL") &&
      error.issues.includes("defaults.baseRef must be a safe Git ref"),
  );

  const malformedPackage = structuredClone(fixtureCatalog);
  malformedPackage.packages[0] = null;
  assert.throws(
    () => validateCatalog(malformedPackage),
    (error) =>
      error instanceof CatalogValidationError &&
      error.issues.includes("packages[0] must be an object"),
  );
});

test("catalog paths and native manifest paths follow the canonical layout", () => {
  const catalog = structuredClone(fixtureCatalog);
  catalog.packages[0].manifestPath = "plugin.json";
  catalog.packages[1].path = "somewhere/else";
  assert.throws(
    () => validateCatalog(catalog),
    (error) =>
      error instanceof CatalogValidationError &&
      error.issues.includes(
        "packages[0].manifestPath must equal .claude-plugin/plugin.json",
      ) &&
      error.issues.includes(
        "packages[1].path must equal skills/claude/fixture-skill",
      ),
  );
});

test("catalog entries must remain sorted by id", () => {
  const catalog = structuredClone(fixtureCatalog);
  catalog.packages.reverse();
  assert.throws(() => validateCatalog(catalog), /packages must be sorted by id/u);
});
