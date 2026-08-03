import assert from "node:assert/strict";
import test from "node:test";

import {
  failureResult,
  makePackageId,
  parsePackageId,
  successResult,
} from "../src/contracts.mjs";

test("package ids round-trip through the canonical parser", () => {
  const id = makePackageId("grok", "standalone", "prompt-asset-improver");
  assert.equal(id, "grok:standalone:prompt-asset-improver");
  assert.deepEqual(parsePackageId(id), {
    adapter: "grok",
    kind: "standalone",
    name: "prompt-asset-improver",
    id,
  });
});

test("package ids reject unsupported adapters and non-kebab names", () => {
  assert.throws(() => makePackageId("other", "plugin", "demo"), /adapter must be one of/u);
  assert.throws(() => makePackageId("codex", "plugin", "Demo Plugin"), /kebab-case/u);
  assert.throws(() => parsePackageId("codex:plugin"), /<adapter>:<kind>:<name>/u);
});

test("result helpers emit the stable v1 contract", () => {
  assert.deepEqual(successResult({ command: "list", summary: "No packages", status: "noop" }), {
    schemaVersion: 1,
    ok: true,
    status: "noop",
    command: "list",
    summary: "No packages",
    data: null,
  });
  assert.deepEqual(
    failureResult({
      command: "disable",
      code: "unsupported-capability",
      message: "Codex cannot disable plugins.",
      status: "unsupported",
    }),
    {
      schemaVersion: 1,
      ok: false,
      status: "unsupported",
      command: "disable",
      error: {
        code: "unsupported-capability",
        message: "Codex cannot disable plugins.",
        retryable: false,
        nextAction: null,
        details: null,
      },
    },
  );
});
