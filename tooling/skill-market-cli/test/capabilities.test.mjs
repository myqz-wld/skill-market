import assert from "node:assert/strict";
import test from "node:test";

import {
  BASELINE_ADAPTER_CAPABILITIES,
  CapabilityValidationError,
  getAdapterCapabilities,
  validateAdapterCapabilities,
} from "../src/capabilities.mjs";

test("baseline capability contracts cover Claude, Codex, and Grok", () => {
  assert.deepEqual(Object.keys(BASELINE_ADAPTER_CAPABILITIES), ["claude", "codex", "grok"]);
  for (const capabilities of Object.values(BASELINE_ADAPTER_CAPABILITIES)) {
    assert.equal(validateAdapterCapabilities(capabilities), capabilities);
  }
});

test("Codex capability gaps are explicit and recoverable", () => {
  const codex = getAdapterCapabilities("codex");
  assert.equal(codex.plugin.operations.update.level, "composed");
  assert.match(codex.plugin.operations.update.detail, /explicit reinstall confirmation/u);
  assert.equal(codex.plugin.operations.enable.level, "unsupported");
  assert.equal(codex.plugin.operations.disable.level, "unsupported");
});

test("Claude scope and Grok trust requirements remain adapter-specific", () => {
  assert.equal(getAdapterCapabilities("claude").plugin.preserveInstallScope, true);
  const grok = getAdapterCapabilities("grok");
  assert.equal(grok.plugin.requiresExplicitTrust, true);
  assert.equal(grok.plugin.operations.update.level, "composed");
  assert.match(grok.plugin.operations.update.detail, /local-source metadata/u);
});

test("capability validation rejects incomplete operation contracts", () => {
  const capabilities = getAdapterCapabilities("grok");
  delete capabilities.plugin.operations.update;
  assert.throws(
    () => validateAdapterCapabilities(capabilities),
    (error) =>
      error instanceof CapabilityValidationError &&
      error.issues.includes("plugin.operations.update must be an object"),
  );
});
