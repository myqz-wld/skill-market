import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { helpContract } from "../src/cli/index.mjs";

const ADAPTERS = Object.freeze(["codex", "claude", "grok"]);
const SKILLS = Object.freeze(["skill-market", "skill-manage", "skill-propose"]);
const MUTATING = new Set(["skill-manage", "skill-propose"]);

function frontmatter(text) {
  const closing = text.indexOf("\n---\n", 4);
  assert.notEqual(closing, -1, "frontmatter must close");
  const entries = {};
  for (const line of text.slice(4, closing).split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.startsWith('"')) value = JSON.parse(value);
    entries[key] = value;
  }
  return entries;
}

async function relativeFiles(root, relative = "") {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = path.join(relative, entry.name);
    assert.ok(!entry.isSymbolicLink(), `${root}/${child} must not redirect outside its package`);
    if (entry.isDirectory()) files.push(...await relativeFiles(root, child));
    else if (entry.isFile()) files.push(child.split(path.sep).join(path.posix.sep));
  }
  return files;
}

test("all adapters expose only the three canonical management Skills", async () => {
  for (const adapter of ADAPTERS) {
    const root = path.resolve(`plugins/skill-market-${adapter}/skills`);
    const discovered = [];
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        await readFile(path.join(root, entry.name, "SKILL.md"), "utf8");
        discovered.push(entry.name);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    assert.deepEqual(discovered.sort(), [...SKILLS].sort(), adapter);
  }
});

test("focused Skills are thin CLI entry points with intentional invocation policy", async () => {
  const invocation = {
    codex: 'node "<plugin-root>/cli/bin/skill-market.mjs"',
    claude: 'node "${CLAUDE_PLUGIN_ROOT}/cli/bin/skill-market.mjs"',
    grok: 'node "${GROK_PLUGIN_ROOT}/cli/bin/skill-market.mjs"',
  };
  for (const adapter of ADAPTERS) {
    for (const name of SKILLS) {
      const skillRoot = path.resolve(`plugins/skill-market-${adapter}/skills/${name}`);
      const text = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
      const metadata = frontmatter(text);
      assert.equal(metadata.name, name, `${adapter}:${name}`);
      assert.ok(metadata.description.length >= 40, `${adapter}:${name} description`);
      assert.ok(text.includes(invocation[adapter]), `${adapter}:${name} bundled CLI`);
      assert.ok(text.split("\n").length <= 90, `${adapter}:${name} stays thin`);
      assert.doesNotMatch(text, /managed-skills\.json|skills\/INDEX\.md|codex plugin |claude plugin |grok plugin /u);

      if (adapter === "codex") {
        assert.deepEqual(Object.keys(metadata).sort(), ["description", "name"]);
        const ui = await readFile(path.join(skillRoot, "agents/openai.yaml"), "utf8");
        assert.ok(ui.includes(`$${name}`), `${adapter}:${name} default prompt`);
        assert.ok(
          ui.includes(`allow_implicit_invocation: ${MUTATING.has(name) ? "false" : "true"}`),
          `${adapter}:${name} invocation policy`,
        );
      } else {
        assert.equal(
          metadata["disable-model-invocation"] === "true",
          MUTATING.has(name),
          `${adapter}:${name} invocation policy`,
        );
      }
    }
  }
});

test("management routes resolve and CLI operations remain reachable", async () => {
  const contract = helpContract();
  for (const adapter of ADAPTERS) {
    const root = path.resolve(`plugins/skill-market-${adapter}/skills`);
    const texts = {};
    for (const name of SKILLS) {
      const text = await readFile(path.join(root, name, "SKILL.md"), "utf8");
      texts[name] = text;
      for (const match of text.matchAll(/`(\.\.\/skill-[a-z-]+\/SKILL\.md)`/gu)) {
        await access(path.resolve(root, name, match[1]));
      }
    }
    const market = texts["skill-market"];
    const manage = texts["skill-manage"];
    assert.ok(market.includes("list --adapter " + adapter), adapter);
    assert.ok(market.includes("discover [quoted-query] --adapter " + adapter), adapter);
    assert.ok(market.includes("config show --json"), adapter);
    assert.ok(!market.includes("config set <"), adapter + " query entry does not write config");
    assert.ok(manage.includes("config set <key> <value> --json"), adapter);
    assert.ok(manage.includes("config unset <key> --json"), adapter);
    const operations = [...manage.matchAll(/^\| `([a-z]+)` \|/gmu)].map((match) => match[1]);
    const expected = Object.keys(contract.commands).filter((name) =>
      ["download", "install", "update", "enable", "disable", "uninstall"].includes(name));
    assert.deepEqual(operations, expected, adapter);
    for (const name of ["skill-market", "skill-manage"]) {
      assert.ok(texts[name].includes("help --json"), `${adapter}:${name} uses live CLI options`);
    }
    for (const action of Object.keys(contract.commands.proposal.actions)) {
      assert.ok(texts["skill-propose"].includes("proposal " + action), `${adapter}:${action}`);
    }
  }
});

async function catalogEntries() {
  const catalog = JSON.parse(await readFile(path.resolve("catalog/entries.json"), "utf8"));
  return catalog.packages.filter((entry) => entry.status !== "removed");
}

async function skillDirectories(prefix) {
  const adapters = await readdir(prefix, { withFileTypes: true });
  const result = [];
  for (const adapter of adapters) {
    assert.ok(!adapter.isSymbolicLink(), `${prefix}/${adapter.name} must not be a symlink`);
    if (!adapter.isDirectory()) continue;
    assert.ok(ADAPTERS.includes(adapter.name), `${prefix}/${adapter.name} adapter`);
    for (const skill of await readdir(path.join(prefix, adapter.name), { withFileTypes: true })) {
      if (skill.isFile() && skill.name === ".gitkeep") continue;
      assert.ok(skill.isDirectory(), `${prefix}/${adapter.name}/${skill.name} package directory`);
      result.push({ adapter: adapter.name, name: skill.name, path: `${prefix}/${adapter.name}/${skill.name}` });
    }
  }
  return result;
}

async function validateSkill(entry) {
  const root = path.resolve(entry.path);
  const files = await relativeFiles(root);
  assert.ok(files.includes("SKILL.md"), entry.path);
  const text = await readFile(path.join(root, "SKILL.md"), "utf8");
  assert.ok(text.startsWith("---\n"), `${entry.path} frontmatter`);
  const metadata = frontmatter(text);
  assert.equal(metadata.name, entry.name, entry.path);
  assert.ok(metadata.description?.length >= 20, `${entry.path} description`);
  const resources = new Set(
    [...text.matchAll(/`((?:assets|references|scripts|agents)\/[a-zA-Z0-9._/-]+)`/gu),
      ...text.matchAll(/\]\(((?:assets|references|scripts|agents)\/[a-zA-Z0-9._/-]+)(?:#[^)]*)?\)/gu)]
      .map((match) => match[1]),
  );
  for (const resource of resources) {
    const resolved = path.resolve(root, resource);
    assert.ok(resolved.startsWith(root + path.sep), `${entry.path}: ${resource} stays in its package`);
    await access(resolved);
  }
  if (entry.adapter === "codex" && files.includes("agents/openai.yaml")) {
    const ui = await readFile(path.join(root, "agents/openai.yaml"), "utf8");
    if (/^\s*default_prompt:/mu.test(ui)) {
      assert.ok(ui.includes(`$${entry.name}`), `${entry.path} invocation metadata`);
    }
  }
}

test("plugin manifests match their canonical catalog targets", async () => {
  for (const entry of (await catalogEntries()).filter((item) => item.kind === "plugin")) {
    const manifest = JSON.parse(await readFile(path.join(entry.path, entry.manifestPath), "utf8"));
    assert.equal(manifest.name, entry.name, entry.id);
    assert.equal(manifest.version, entry.version, entry.id);
    if (entry.bootstrap) {
      assert.match(manifest.description, /bundled CLI/u);
      assert.doesNotMatch(JSON.stringify(manifest), /searching|uploading|skill-search|skill-upload/u);
    }
  }
});

test("published standalone directories and catalog targets agree in both directions", async () => {
  const declared = (await catalogEntries()).filter((entry) => entry.kind === "standalone");
  const actual = await skillDirectories("skills");
  assert.deepEqual(actual.map((entry) => entry.path).sort(), declared.map((entry) => entry.path).sort());
  for (const entry of declared) await validateSkill(entry);
});
