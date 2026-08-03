import assert from "node:assert/strict";
import { access, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { loadCatalog } from "../src/catalog.mjs";
import {
  applyProposalToWorktree,
  enrichProposalSources,
} from "../src/proposal-apply.mjs";
import { canonicalDigest, normalizeProposalSpec } from "../src/proposal-contracts.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import { writeFixtureRepository } from "./helpers/proposal-fixture.mjs";
import { makeTempDirectory, removeTempDirectory } from "./helpers/temp-env.mjs";

async function writeSkill(root, name, body) {
  await mkdir(root, { recursive: true });
  await writeFile(
    path.join(root, "SKILL.md"),
    `---\nname: ${name}\ndescription: fixture\n---\n\n${body}\n`,
    "utf8",
  );
}

async function writePlugin(root, adapter, name, version) {
  const manifestDirectory = {
    claude: ".claude-plugin",
    codex: ".codex-plugin",
    grok: ".grok-plugin",
  }[adapter];
  await mkdir(path.join(root, manifestDirectory), { recursive: true });
  await writeFile(
    path.join(root, manifestDirectory, "plugin.json"),
    `${JSON.stringify({ name, version, description: `${adapter} fixture plugin` }, null, 2)}\n`,
    "utf8",
  );
}

function baseState({ spec, catalog, root }) {
  return {
    source: { catalogDigest: canonicalDigest(catalog) },
    spec,
    workspace: { worktreePath: root },
  };
}

async function normalizedSpec(raw, root) {
  const specPath = path.join(root, "input", "proposal.json");
  return normalizeProposalSpec(raw, { specPath, home: root });
}

test("proposal apply adds explicit packages for all three adapters and regenerates views", async () => {
  const root = await makeTempDirectory("skill-market-proposal-add-");
  const worktree = path.join(root, "worktree");
  try {
    const catalog = structuredClone(fixtureCatalog);
    await writeFixtureRepository(worktree, catalog);
    const targets = [];
    for (const adapter of ["claude", "codex", "grok"]) {
      const sourcePath = path.join(root, "sources", adapter);
      await writeSkill(sourcePath, "new-skill", `${adapter} new skill`);
      targets.push({
        id: `${adapter}:standalone:new-skill`,
        sourcePath,
        version: "0.0.1",
        description: `${adapter} new skill`,
        keywords: ["fixture"],
      });
    }
    const spec = await normalizedSpec(
      { schemaVersion: 1, action: "add", summary: "Add new skills", targets },
      root,
    );
    const enriched = await enrichProposalSources({
      spec,
      catalog,
      proposalsRoot: path.join(root, "proposals"),
    });
    const result = await applyProposalToWorktree({
      state: baseState({ spec: enriched, catalog, root: worktree }),
      worktreePath: worktree,
      proposalsRoot: path.join(root, "proposals"),
    });
    assert.deepEqual(result.changes.map((change) => change.id), [
      "claude:standalone:new-skill",
      "codex:standalone:new-skill",
      "grok:standalone:new-skill",
    ]);
    const next = await loadCatalog(path.join(worktree, "catalog", "entries.json"));
    assert.equal(next.packages.filter((entry) => entry.name === "new-skill").length, 3);
    const index = await readFile(path.join(worktree, "skills", "INDEX.md"), "utf8");
    assert.match(index, /\| grok \| new-skill \| 0\.0\.1/u);
  } finally {
    await removeTempDirectory(root);
  }
});

test("proposal apply updates versions while preserving each adapter catalog status", async () => {
  const root = await makeTempDirectory("skill-market-proposal-update-");
  const worktree = path.join(root, "worktree");
  try {
    const catalog = structuredClone(fixtureCatalog);
    catalog.packages.find((entry) => entry.id === "claude:standalone:fixture-skill").status = "deprecated";
    catalog.packages.find((entry) => entry.id === "grok:standalone:fixture-skill").status = "disabled";
    await writeFixtureRepository(worktree, catalog);
    const targets = [];
    for (const adapter of ["claude", "codex", "grok"]) {
      const sourcePath = path.join(root, "sources", adapter);
      await writeSkill(sourcePath, "fixture-skill", `${adapter} version two`);
      targets.push({ id: `${adapter}:standalone:fixture-skill`, sourcePath, version: "0.0.2" });
    }
    const spec = await normalizedSpec(
      { schemaVersion: 1, action: "update", summary: "Update fixture skills", targets },
      root,
    );
    const enriched = await enrichProposalSources({
      spec,
      catalog,
      proposalsRoot: path.join(root, "proposals"),
    });
    await applyProposalToWorktree({
      state: baseState({ spec: enriched, catalog, root: worktree }),
      worktreePath: worktree,
      proposalsRoot: path.join(root, "proposals"),
    });
    const next = await loadCatalog(path.join(worktree, "catalog", "entries.json"));
    assert.deepEqual(
      next.packages
        .filter((entry) => entry.name === "fixture-skill")
        .map((entry) => [entry.adapter, entry.version, entry.status]),
      [
        ["claude", "0.0.2", "deprecated"],
        ["codex", "0.0.2", "active"],
        ["grok", "0.0.2", "disabled"],
      ],
    );
  } finally {
    await removeTempDirectory(root);
  }
});

test("plugin updates synchronize exact manifests and generated native catalog versions", async () => {
  const root = await makeTempDirectory("skill-market-proposal-plugin-update-");
  const worktree = path.join(root, "worktree");
  try {
    const catalog = structuredClone(fixtureCatalog);
    for (const entry of catalog.packages.filter((item) => item.kind === "plugin")) {
      entry.bootstrap = false;
    }
    await writeFixtureRepository(worktree, catalog);
    const targets = [];
    for (const adapter of ["claude", "codex", "grok"]) {
      const name = `fixture-${adapter}`;
      const sourcePath = path.join(root, "plugin-sources", adapter);
      await writePlugin(sourcePath, adapter, name, "0.2.0");
      targets.push({ id: `${adapter}:plugin:${name}`, sourcePath, version: "0.2.0" });
    }
    const spec = await normalizedSpec(
      { schemaVersion: 1, action: "update", summary: "Update fixture plugins", targets },
      root,
    );
    const enriched = await enrichProposalSources({
      spec,
      catalog,
      proposalsRoot: path.join(root, "proposals"),
    });
    await applyProposalToWorktree({
      state: baseState({ spec: enriched, catalog, root: worktree }),
      worktreePath: worktree,
      proposalsRoot: path.join(root, "proposals"),
    });
    const next = await loadCatalog(path.join(worktree, "catalog", "entries.json"));
    assert.ok(
      next.packages
        .filter((entry) => entry.kind === "plugin")
        .every((entry) => entry.version === "0.2.0"),
    );
    for (const adapter of ["claude", "codex", "grok"]) {
      const entry = next.packages.find((item) => item.id === `${adapter}:plugin:fixture-${adapter}`);
      const manifest = JSON.parse(
        await readFile(path.join(worktree, entry.path, entry.manifestPath), "utf8"),
      );
      assert.equal(manifest.version, "0.2.0");
    }
    const claudeMarket = JSON.parse(
      await readFile(path.join(worktree, ".claude-plugin", "marketplace.json"), "utf8"),
    );
    const grokMarket = JSON.parse(
      await readFile(path.join(worktree, ".grok-plugin", "marketplace.json"), "utf8"),
    );
    assert.equal(claudeMarket.plugins[0].version, "0.2.0");
    assert.equal(grokMarket.plugins[0].version, "0.2.0");
  } finally {
    await removeTempDirectory(root);
  }
});

test("retire keeps package files while remove deletes content and keeps a tombstone", async () => {
  for (const action of ["retire", "remove"]) {
    const root = await makeTempDirectory(`skill-market-proposal-${action}-`);
    const worktree = path.join(root, "worktree");
    try {
      const catalog = structuredClone(fixtureCatalog);
      await writeFixtureRepository(worktree, catalog);
      const spec = await normalizedSpec(
        {
          schemaVersion: 1,
          action,
          summary: `${action} fixture skill`,
          targets: [{ id: "codex:standalone:fixture-skill" }],
        },
        root,
      );
      await applyProposalToWorktree({
        state: baseState({ spec, catalog, root: worktree }),
        worktreePath: worktree,
        proposalsRoot: path.join(root, "proposals"),
      });
      const next = await loadCatalog(path.join(worktree, "catalog", "entries.json"));
      const entry = next.packages.find((item) => item.id === "codex:standalone:fixture-skill");
      assert.equal(entry.status, action === "retire" ? "deprecated" : "removed");
      const packagePath = path.join(worktree, entry.path);
      if (action === "retire") {
        await access(packagePath);
      } else {
        await assert.rejects(access(packagePath), { code: "ENOENT" });
      }
    } finally {
      await removeTempDirectory(root);
    }
  }
});

test("prepare blocks source changes after plan and never follows a package symlink for remove", async (context) => {
  const root = await makeTempDirectory("skill-market-proposal-safety-");
  const worktree = path.join(root, "worktree");
  try {
    const catalog = structuredClone(fixtureCatalog);
    await writeFixtureRepository(worktree, catalog);
    const sourcePath = path.join(root, "source");
    await writeSkill(sourcePath, "fixture-skill", "version two");
    const raw = {
      schemaVersion: 1,
      action: "update",
      summary: "Update fixture",
      targets: [{ id: "codex:standalone:fixture-skill", sourcePath, version: "0.0.2" }],
    };
    const spec = await normalizedSpec(raw, root);
    const enriched = await enrichProposalSources({
      spec,
      catalog,
      proposalsRoot: path.join(root, "proposals"),
    });
    await writeFile(path.join(sourcePath, "SKILL.md"), "changed after plan\n", "utf8");
    await assert.rejects(
      applyProposalToWorktree({
        state: baseState({ spec: enriched, catalog, root: worktree }),
        worktreePath: worktree,
        proposalsRoot: path.join(root, "proposals"),
      }),
      (error) => error.code === "proposal-source-changed",
    );

    if (process.platform !== "win32") {
      const outside = path.join(root, "outside");
      await mkdir(outside);
      const target = path.join(worktree, "skills", "codex", "fixture-skill");
      const { rm } = await import("node:fs/promises");
      await rm(target, { recursive: true });
      await symlink(outside, target);
      const removeSpec = await normalizedSpec(
        {
          schemaVersion: 1,
          action: "remove",
          summary: "Remove fixture",
          targets: [{ id: "codex:standalone:fixture-skill" }],
        },
        root,
      );
      await assert.rejects(
        applyProposalToWorktree({
          state: baseState({ spec: removeSpec, catalog, root: worktree }),
          worktreePath: worktree,
          proposalsRoot: path.join(root, "proposals"),
        }),
        (error) => error.code === "invalid-package-content",
      );
      await access(outside);
    } else {
      context.diagnostic("symlink deletion coverage skipped on Windows");
    }
  } finally {
    await removeTempDirectory(root);
  }
});
