import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  canonicalDigest,
  normalizeProposalSpec,
  proposalIdFor,
  validateProposalAgainstCatalog,
} from "../src/proposal-contracts.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";

const CONTEXT = Object.freeze({
  specPath: "/tmp/proposals/spec.json",
  home: "/tmp/home",
});

function updateSpec(overrides = {}) {
  return {
    schemaVersion: 1,
    action: "update",
    summary: "Update fixture skill",
    targets: [
      {
        id: "codex:standalone:fixture-skill",
        sourcePath: "./fixture-skill",
        version: "0.0.2",
      },
    ],
    ...overrides,
  };
}

test("proposal specs normalize exact targets, source paths, and deterministic identity", () => {
  const input = updateSpec({
    targets: [
      {
        id: "grok:standalone:fixture-skill",
        sourcePath: "~/grok-source",
        version: "0.0.2",
      },
      {
        id: "codex:standalone:fixture-skill",
        sourcePath: "./fixture-skill",
        version: "0.0.2",
      },
    ],
  });
  const normalized = normalizeProposalSpec(input, CONTEXT);
  assert.deepEqual(normalized.targets.map((target) => target.id), [
    "codex:standalone:fixture-skill",
    "grok:standalone:fixture-skill",
  ]);
  assert.equal(
    normalized.targets[0].sourcePath,
    path.join("/tmp/proposals", "fixture-skill"),
  );
  assert.equal(normalized.targets[1].sourcePath, "/tmp/home/grok-source");
  const identity = { spec: normalized, baseCommit: "a".repeat(40) };
  assert.match(proposalIdFor(identity), /^proposal-[0-9a-f]{16}$/u);
  assert.equal(proposalIdFor(identity), proposalIdFor(structuredClone(identity)));
  assert.equal(canonicalDigest({ b: 2, a: 1 }), canonicalDigest({ a: 1, b: 2 }));
});

test("proposal specs reject implicit targets, metadata on delete actions, and bootstrap packages", () => {
  assert.throws(
    () => normalizeProposalSpec(updateSpec({ targets: [] }), CONTEXT),
    (error) => error.code === "invalid-proposal-spec",
  );
  assert.throws(
    () =>
      normalizeProposalSpec(
        {
          schemaVersion: 1,
          action: "remove",
          summary: "Remove fixture",
          targets: [{ id: "codex:standalone:fixture-skill", version: "0.0.2" }],
        },
        CONTEXT,
      ),
    (error) => error.code === "invalid-proposal-spec",
  );
  assert.throws(
    () =>
      normalizeProposalSpec(
        {
          schemaVersion: 1,
          action: "remove",
          summary: "Remove bootstrap",
          targets: [{ id: "grok:plugin:skill-market-grok" }],
        },
        CONTEXT,
      ),
    (error) => error.code === "bootstrap-proposal-forbidden",
  );
});

test("new standalone packages start at 0.0.1 and add requires catalog metadata", () => {
  const base = {
    schemaVersion: 1,
    action: "add",
    summary: "Add fixture",
    targets: [
      {
        id: "codex:standalone:new-skill",
        sourcePath: "/tmp/new-skill",
        version: "1.0.0",
        description: "New fixture skill",
      },
    ],
  };
  assert.throws(
    () => normalizeProposalSpec(base, CONTEXT),
    (error) => error.code === "invalid-proposal-version",
  );
  base.targets[0].version = "0.0.1";
  delete base.targets[0].description;
  assert.throws(
    () => normalizeProposalSpec(base, CONTEXT),
    (error) => error.code === "invalid-proposal-spec",
  );
});

test("catalog action validation enforces existence, versions, retirement, and tombstones", () => {
  const catalog = structuredClone(fixtureCatalog);
  const normalized = normalizeProposalSpec(updateSpec(), CONTEXT);
  const [planned] = validateProposalAgainstCatalog(normalized, catalog);
  assert.equal(planned.current.version, "0.0.1");
  assert.equal(planned.next.version, "0.0.2");
  assert.equal(planned.next.status, "active");

  assert.throws(
    () =>
      validateProposalAgainstCatalog(
        normalizeProposalSpec(updateSpec({
          targets: [{
            id: "codex:standalone:fixture-skill",
            sourcePath: "/tmp/source",
            version: "0.0.1",
          }],
        }), CONTEXT),
        catalog,
      ),
    (error) => error.code === "invalid-proposal-version",
  );

  const retire = normalizeProposalSpec(
    {
      schemaVersion: 1,
      action: "retire",
      summary: "Retire fixture",
      targets: [{ id: "codex:standalone:fixture-skill" }],
    },
    CONTEXT,
  );
  assert.equal(validateProposalAgainstCatalog(retire, catalog)[0].next.status, "deprecated");

  const remove = normalizeProposalSpec(
    {
      schemaVersion: 1,
      action: "remove",
      summary: "Remove fixture",
      targets: [{ id: "codex:standalone:fixture-skill" }],
    },
    CONTEXT,
  );
  assert.equal(validateProposalAgainstCatalog(remove, catalog)[0].next.status, "removed");

  const existing = catalog.packages.find((entry) => entry.id === "codex:standalone:fixture-skill");
  existing.status = "removed";
  assert.throws(
    () => validateProposalAgainstCatalog(remove, catalog),
    (error) => error.code === "proposal-action-noop",
  );
});
