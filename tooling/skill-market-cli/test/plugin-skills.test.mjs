import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { helpContract } from "../src/cli.mjs";

const ADAPTERS = Object.freeze(["codex", "claude", "grok"]);
const SKILLS = Object.freeze([
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
const MUTATING = new Set([
  "skill-download",
  "skill-install",
  "skill-update",
  "skill-enable",
  "skill-disable",
  "skill-uninstall",
  "skill-propose",
]);
const STANDALONE = Object.freeze([
  "complex-work-planning",
  "parallel-tasks",
  "plantuml-diagrams",
  "project-engineering-foundation",
  "prompt-asset-improver",
]);

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
    if (entry.isDirectory()) files.push(...await relativeFiles(root, child));
    else if (entry.isFile()) files.push(child.split(path.sep).join(path.posix.sep));
  }
  return files;
}

test("all adapters expose only the ten canonical focused Skills", async () => {
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

test("focused Skills name every command-specific option from the CLI contract", async () => {
  const contract = helpContract();
  const sameForEveryAdapter = {
    "skill-list": Object.keys(contract.commands.list.options),
    "skill-discover": Object.keys(contract.commands.discover.options),
    "skill-propose": [
      "--spec",
      "--read-repo-url",
      "--base-ref",
      "--cache-path",
      "--cache-ttl-seconds",
      "--repo-path",
      ...Object.keys(contract.commands.proposal.actions.submit.options),
      "--confirm-discard",
    ],
  };
  for (const adapter of ADAPTERS) {
    for (const [name, options] of Object.entries(sameForEveryAdapter)) {
      const text = await readFile(
        path.resolve(`plugins/skill-market-${adapter}/skills/${name}/SKILL.md`),
        "utf8",
      );
      for (const option of new Set(options)) {
        assert.ok(text.includes(option), `${adapter}:${name} documents ${option}`);
      }
    }
  }

  for (const name of [
    "skill-download",
    "skill-install",
    "skill-update",
    "skill-enable",
    "skill-disable",
    "skill-uninstall",
  ]) {
    const operation = name.slice("skill-".length);
    const allowed = new Set(contract.commands[operation].options);
    const documented = new Set();
    for (const adapter of ADAPTERS) {
      const text = await readFile(
        path.resolve(`plugins/skill-market-${adapter}/skills/${name}/SKILL.md`),
        "utf8",
      );
      const mentioned = new Set(text.match(/--[a-z][a-z-]*/gu) ?? []);
      mentioned.delete("--json");
      for (const option of mentioned) {
        assert.ok(allowed.has(option), `${adapter}:${name} rejects undocumented ${option}`);
        documented.add(option);
      }
    }
    assert.deepEqual([...documented].sort(), [...allowed].sort(), `${name} adapter union`);
  }
});

test("plugin manifests expose v0.1.2 without legacy search or upload promises", async () => {
  const manifests = {
    codex: ".codex-plugin/plugin.json",
    claude: ".claude-plugin/plugin.json",
    grok: ".grok-plugin/plugin.json",
  };
  for (const adapter of ADAPTERS) {
    const file = path.resolve(`plugins/skill-market-${adapter}`, manifests[adapter]);
    const manifest = JSON.parse(await readFile(file, "utf8"));
    assert.equal(manifest.name, `skill-market-${adapter}`);
    assert.equal(manifest.version, "0.1.2");
    assert.match(manifest.description, /bundled CLI/u);
    assert.doesNotMatch(JSON.stringify(manifest), /searching|uploading|skill-search|skill-upload/u);
  }
});

test("every non-removed catalog package has its declared content and manifest", async () => {
  const catalog = JSON.parse(await readFile(path.resolve("catalog/entries.json"), "utf8"));
  for (const entry of catalog.packages.filter((item) => item.status !== "removed")) {
    const packageRoot = path.resolve(entry.path);
    await access(packageRoot);
    if (entry.kind === "plugin") {
      await access(path.join(packageRoot, entry.manifestPath));
    } else {
      await access(path.join(packageRoot, "SKILL.md"));
    }
  }
});

test("Grok standalone packages mirror complete source topology with controlled prompt deltas", async () => {
  const changedSkills = new Set([
    "plantuml-diagrams/SKILL.md",
    "project-engineering-foundation/SKILL.md",
    "prompt-asset-improver/SKILL.md",
  ]);
  for (const name of STANDALONE) {
    const codexRoot = path.resolve(`skills/codex/${name}`);
    const grokRoot = path.resolve(`skills/grok/${name}`);
    const codexFiles = await relativeFiles(codexRoot);
    const grokFiles = await relativeFiles(grokRoot);
    assert.deepEqual(grokFiles, codexFiles, name);
    for (const relativePath of codexFiles) {
      const [codex, grok] = await Promise.all([
        readFile(path.join(codexRoot, relativePath)),
        readFile(path.join(grokRoot, relativePath)),
      ]);
      const key = `${name}/${relativePath}`;
      if (changedSkills.has(key)) assert.notDeepEqual(grok, codex, key);
      else assert.deepEqual(grok, codex, key);
    }
    const skillText = await readFile(path.join(grokRoot, "SKILL.md"), "utf8");
    const resources = new Set(
      [...skillText.matchAll(/`((?:assets|references|scripts)\/[a-zA-Z0-9._/-]+)`/gu)]
        .map((match) => match[1]),
    );
    for (const resource of resources) {
      await access(path.join(grokRoot, resource));
    }
  }
  const promptImprover = await readFile(
    path.resolve("skills/grok/prompt-asset-improver/SKILL.md"),
    "utf8",
  );
  assert.match(promptImprover, /Codex\/Claude\/Grok/u);
});
