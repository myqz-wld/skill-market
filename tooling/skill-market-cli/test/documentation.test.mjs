import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { helpContract } from "../src/cli.mjs";

const FOCUSED_SKILLS = Object.freeze([
  "skill-market",
  "skill-list",
  "skill-discover",
  "skill-download",
  "skill-install",
  "skill-update",
  "skill-enable",
  "skill-disable",
  "skill-uninstall",
  "skill-propose",
]);

async function documentation() {
  const [readme, contributing] = await Promise.all([
    readFile("README.md", "utf8"),
    readFile("CONTRIBUTING.md", "utf8"),
  ]);
  return { readme, contributing };
}

test("README exposes the canonical three-adapter Skill surface without legacy aliases", async () => {
  const { readme } = await documentation();
  const publicBlock = readme.match(
    /The public Skill surface is:\n\n([\s\S]*?)\n\n\x60skill-list\x60 and \x60skill-discover\x60/u,
  );
  assert.ok(publicBlock, "public Skill block");
  const documented = [...publicBlock[1].matchAll(/^- \x60([^\x60]+)\x60$/gmu)].map(
    (match) => match[1],
  );
  assert.deepEqual(documented, FOCUSED_SKILLS);
  assert.doesNotMatch(readme, /skill-search|skill-upload/u);

  for (const adapter of ["Claude", "Codex", "Grok"]) {
    assert.ok(readme.includes(adapter), adapter);
  }
});

test("README keeps list local and discover catalog-oriented", async () => {
  const { readme } = await documentation();
  assert.match(
    readme,
    /\x60list\x60 reports local native plugins and Skill Market-managed standalone packages\. It never clones or refreshes the catalog\./u,
  );
  assert.match(
    readme,
    /\x60discover\x60 browses or searches canonical catalog metadata\.[^\n]+never installs anything\./u,
  );
  assert.match(readme, /Configuration is optional\./u);
  assert.match(readme, /~\/\.skill-market\/managed-state\.json/u);
  assert.doesNotMatch(
    readme,
    /required configuration file|managed-skills\.json|SKILL_MARKET_REPO_URL|SKILL_MARKET_CACHE\b/u,
  );
});

test("README configuration and result contract follow CLI help", async () => {
  const { readme } = await documentation();
  const contract = helpContract();
  for (const [option, details] of Object.entries(contract.sourceOptions)) {
    const key = option.slice(2).replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
    assert.ok(readme.includes(key), key);
    assert.ok(readme.includes(String(details.default)), key + " default");
  }
  for (const variable of Object.keys(contract.environment)) {
    assert.ok(readme.includes(variable), variable);
  }
  for (const [status, code] of Object.entries(contract.exitCodes)) {
    assert.ok(readme.includes("| " + code + " |"), status + " exit code");
  }
});

test("documentation identifies canonical and generated repository assets", async () => {
  const { readme, contributing } = await documentation();
  const combined = readme + "\n" + contributing;
  for (const file of [
    "catalog/entries.json",
    ".agents/plugins/marketplace.json",
    ".claude-plugin/marketplace.json",
    ".grok-plugin/marketplace.json",
    "skills/INDEX.md",
  ]) {
    assert.ok(combined.includes(file), file);
  }
  assert.match(combined, /source of truth/u);
  assert.match(combined, /byte-identical/u);
});

test("CONTRIBUTING documents the implemented proposal and safety boundaries", async () => {
  const { contributing } = await documentation();
  const contract = helpContract();
  for (const action of Object.keys(contract.commands.proposal.actions)) {
    assert.ok(contributing.includes("proposal " + action), action);
  }
  for (const action of contract.proposal.spec.action.values) {
    assert.ok(contributing.includes("\x60" + action + "\x60"), action);
  }
  assert.match(contributing, /--confirm-external-effects/u);
  assert.match(contributing, /never force-pushes/u);
  assert.match(contributing, /temporary homes/u);
  assert.doesNotMatch(
    contributing,
    /Do not add services, npm packages, custom CLIs, or custom registry APIs/u,
  );
});
