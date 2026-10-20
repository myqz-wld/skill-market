import assert from "node:assert/strict";
import test from "node:test";

import { compareSemver, isSemver } from "../src/shared/versions.mjs";

test("prereleases sort numerically before the corresponding stable release", () => {
  const versions = ["0.0.1-draft.1", "0.0.1-draft.2", "0.0.1-draft.10", "0.0.1", "0.0.2"];
  for (let i = 1; i < versions.length; i += 1) {
    assert.equal(compareSemver(versions[i - 1], versions[i]), -1);
  }
  assert.equal(compareSemver("0.0.1-draft.1+build.01", "0.0.1-draft.1"), 0);
});

test("malformed prerelease identifiers cannot enter package versions or paths", () => {
  for (const version of ["0.0.1-draft..1", "0.0.1-draft.01", "0.0.1-.draft",
    "0.0.1-draft.", "0.0.1+build..1", "0.0.1-draft/1", "0.0.1-draft.1\n"]) {
    assert.equal(isSemver(version), false, JSON.stringify(version));
  }
  for (const version of ["0.0.1-draft.0", "0.0.1-draft-01", "0.0.1+build.01"]) {
    assert.equal(isSemver(version), true, version);
  }
});
