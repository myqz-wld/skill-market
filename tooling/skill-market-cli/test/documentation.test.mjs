import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { helpContract } from "../src/cli/index.mjs";

test("README skill interface matches each installed native package", async () => {
  const readme = await readFile("README.md", "utf8");
  const documented = [...readme.matchAll(/^\| `(skill-[a-z-]+)` \|/gmu)]
    .map((match) => match[1]).sort();
  for (const adapter of ["claude", "codex", "grok"]) {
    const entries = await readdir(`plugins/skill-market-${adapter}/skills`, { withFileTypes: true });
    assert.deepEqual(documented, entries.filter((entry) => entry.isDirectory())
      .map((entry) => entry.name).sort(), adapter);
  }
});

test("README and contributor documentation links resolve within the repository", async () => {
  const root = path.resolve(".");
  for (const file of ["README.md", "CONTRIBUTING.md"]) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
      const target = match[1].split("#")[0];
      if (!target || /^[a-z]+:/u.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), target);
      assert.ok(resolved.startsWith(root + path.sep), `${file}: ${target}`);
      await access(resolved);
    }
  }
});

test("README exposes the live command surface and configuration entry points", async () => {
  const readme = await readFile("README.md", "utf8");
  assert.match(readme, /~\/\.skill-market\/managed-state\.json/u);
  assert.match(readme, /help --pretty/u);
  for (const command of Object.keys(helpContract().commands)) {
    assert.ok(readme.includes("`" + command), command);
  }
});

test("CONTRIBUTING preserves proposal phases and canonical source ownership", async () => {
  const contributing = await readFile("CONTRIBUTING.md", "utf8");
  for (const action of Object.keys(helpContract().commands.proposal.actions)) {
    assert.ok(contributing.includes("proposal " + action), action);
  }
  for (const file of ["catalog/entries.json", ".agents/plugins/marketplace.json",
    ".claude-plugin/marketplace.json", ".grok-plugin/marketplace.json", "skills/INDEX.md"]) {
    assert.ok(contributing.includes(file), file);
  }
  assert.match(contributing, /--confirm-external-effects/u);
  assert.match(contributing, /never force-pushes/u);
  assert.match(contributing, /temporary homes/u);
});
