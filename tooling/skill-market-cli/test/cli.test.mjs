import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { runCli } from "../src/cli.mjs";
import { SkillMarketError } from "../src/errors.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import {
  createBareRemote,
  createProposalRepository,
} from "./helpers/proposal-fixture.mjs";
import {
  makeTempDirectory,
  removeTempDirectory,
  withTemporaryHome,
  writeFakeBinary,
} from "./helpers/temp-env.mjs";

const execFileAsync = promisify(execFile);

test("help exposes canonical commands and obsolete names are not aliases", async () => {
  const help = await runCli(["help"]);
  assert.equal(help.ok, true);
  assert.deepEqual(Object.keys(help.data.commands), [
    "list",
    "discover",
    "download",
    "install",
    "update",
    "enable",
    "disable",
    "uninstall",
    "proposal",
    "config",
  ]);
  assert.equal(help.data.commands.list.options["--history"].default, false);
  assert.match(help.data.lifecycle.catalogPolicy.explicitStale, /exact/u);
  assert.match(help.data.lifecycle.adapters.codex.pluginEnableDisable, /unsupported/u);
  assert.deepEqual(Object.keys(help.data.commands.proposal.actions), [
    "plan",
    "prepare",
    "submit",
    "status",
    "abort",
  ]);
  assert.deepEqual(help.data.proposal.spec.action.values, ["add", "update", "retire", "remove"]);
  assert.match(help.data.proposal.safety.externalEffects, /--confirm-external-effects/u);
  const obsolete = await runCli(["search"]);
  assert.equal(obsolete.ok, false);
  assert.equal(obsolete.error.code, "unknown-command");
  assert.ok(!obsolete.error.details.allowed.includes("search"));
  const upload = await runCli(["upload"]);
  assert.equal(upload.ok, false);
  assert.equal(upload.error.code, "unknown-command");
});

test("proposal CLI dispatches exact action contracts and rejects cross-action options", async () => {
  let planned;
  const result = await runCli(
    [
      "proposal",
      "plan",
      "--spec",
      "/tmp/proposal.json",
      "--repo-path",
      "/tmp/repository",
    ],
    {
      planProposal: async (input) => {
        planned = input;
        return {
          status: "ok",
          summary: "planned fixture",
          data: { proposal: { id: "proposal-0123456789abcdef", status: "planned" } },
        };
      },
    },
  );
  assert.equal(result.ok, true);
  assert.equal(result.command, "proposal plan");
  assert.equal(planned.specPath, "/tmp/proposal.json");
  assert.equal(planned.options.repoPath, "/tmp/repository");

  const unknown = await runCli(["proposal", "publish"]);
  assert.equal(unknown.error.code, "unknown-proposal-action");
  assert.deepEqual(unknown.error.details.allowed, ["plan", "prepare", "submit", "status", "abort"]);

  const irrelevant = await runCli([
    "proposal",
    "prepare",
    "proposal-0123456789abcdef",
    "--push-url",
    "/tmp/remote.git",
  ]);
  assert.equal(irrelevant.error.code, "invalid-arguments");

  let submitted = false;
  const conflicting = await runCli(
    [
      "proposal",
      "submit",
      "proposal-0123456789abcdef",
      "--confirm-external-effects",
      "--push-mode",
      "direct",
      "--fork-push-url",
      "/tmp/fork.git",
    ],
    {
      submitProposal: async () => {
        submitted = true;
        throw new Error("must not dispatch");
      },
    },
  );
  assert.equal(conflicting.error.code, "invalid-arguments");
  assert.equal(submitted, false);
});

test("lifecycle CLI maps exact options and domain warnings into the v1 envelope", async () => {
  let received;
  const result = await runCli(
    [
      "update",
      "codex:plugin:fixture-codex",
      "--repo-path",
      "/tmp/fixture-repo",
      "--allow-stale-head",
      "a".repeat(40),
      "--force",
      "--confirm-reinstall",
    ],
    {
      executeLifecycle: async (input) => {
        received = input;
        return {
          status: "ok",
          summary: "fixture update",
          data: { id: input.id },
          warnings: [{ code: "restart-required", message: "restart" }],
        };
      },
    },
  );
  assert.equal(result.ok, true);
  assert.equal(result.command, "update");
  assert.equal(received.options.sourceOverrides.repoPath, "/tmp/fixture-repo");
  assert.equal(received.options.allowStaleHead, "a".repeat(40));
  assert.equal(received.options.force, true);
  assert.equal(received.options.confirmReinstall, true);
  assert.equal(result.data.warnings[0].code, "restart-required");
});

test("lifecycle confirmation failures retain status, recovery, and exit-class data", async () => {
  const result = await runCli(["install", "grok:plugin:fixture-grok"], {
    executeLifecycle: async () => {
      throw new SkillMarketError({
        code: "grok-trust-confirmation",
        message: "Trust is required.",
        status: "needs_confirmation",
        details: { id: "grok:plugin:fixture-grok" },
        nextAction: "Inspect the source and retry with --confirm-trust.",
      });
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, "needs_confirmation");
  assert.equal(result.error.code, "grok-trust-confirmation");
  assert.match(result.error.nextAction, /--confirm-trust/u);
});

test("list reads local state without creating config or cache", async () => {
  await withTemporaryHome(async (home) => {
    const env = { HOME: home };
    let nativeReads = 0;
    const result = await runCli(["list", "--adapter", "codex", "--kind", "plugin"], {
      env,
      nativeReader: async ({ adapter }) => {
        nativeReads += 1;
        assert.equal(adapter, "codex");
        return [];
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.status, "noop");
    assert.equal(nativeReads, 1);
    await assert.rejects(access(path.join(home, ".skill-market/config.json")), { code: "ENOENT" });
    await assert.rejects(access(path.join(home, ".skill-market/cache")), { code: "ENOENT" });
  });
});

test("invalid list filters fail before config, cache, or native reads", async () => {
  let calls = 0;
  const result = await runCli(["list", "--adapter", "other"], {
    env: { HOME: "/tmp/skill-market-cli-filter-test" },
    loadEffectiveConfig: async () => {
      calls += 1;
      throw new Error("must not load config");
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid-filter");
  assert.equal(calls, 0);
});

test("discover passes refresh policy and returns ranked catalog JSON", async () => {
  await withTemporaryHome(async (home) => {
    const snapshot = {
      catalog: fixtureCatalog,
      freshness: "fresh",
      source: { mode: "cache", repoIdentity: "example.test/skill-market" },
      warnings: [],
    };
    let observed;
    const result = await runCli(
      ["discover", "fixture-codex", "--adapter", "codex", "--latest", "--limit", "5"],
      {
        env: { HOME: home },
        loadCatalogSnapshot: async (options) => {
          observed = options;
          return snapshot;
        },
        collectLocalInventory: async () => ({
          items: [],
          warnings: [],
          catalog: { loaded: true, freshness: "fresh", source: snapshot.source },
        }),
      },
    );
    assert.equal(result.ok, true);
    assert.equal(observed.latest, true);
    assert.equal(observed.offline, false);
    assert.equal(result.data.items[0].id, "codex:plugin:fixture-codex");
    assert.equal(result.data.items[0].match, "exact");
    assert.equal(result.data.items[0].localState, "absent");
  });
});

test("config set and unset are the only commands that persist defaults", async () => {
  await withTemporaryHome(async (home) => {
    const env = { HOME: home };
    const show = await runCli(["config", "show"], { env });
    assert.equal(show.data.configExists, false);

    const set = await runCli(["config", "set", "cacheTtlSeconds", "90"], { env });
    assert.equal(set.ok, true);
    const configPath = path.join(home, ".skill-market/config.json");
    assert.equal(JSON.parse(await readFile(configPath, "utf8")).cacheTtlSeconds, 90);

    const unset = await runCli(["config", "unset", "cacheTtlSeconds"], { env });
    assert.equal(unset.ok, true);
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")), { schemaVersion: 1 });
  });
});

test("the executable lists three adapters through fake binaries without network state", async () => {
  await withTemporaryHome(async (home) => {
    const binaryDirectory = await makeTempDirectory("skill-market-native-bin-");
    try {
      await writeFakeBinary(
        binaryDirectory,
        "codex",
        `process.stdout.write(${JSON.stringify(JSON.stringify({ installed: [{ pluginId: "fixture-codex@skill-market", name: "fixture-codex", marketplaceName: "skill-market", version: "0.1.0", enabled: true }] }))});`,
      );
      await writeFakeBinary(
        binaryDirectory,
        "claude",
        `process.stdout.write(${JSON.stringify(JSON.stringify([{ id: "fixture-claude@skill-market", version: "0.1.0", enabled: true }]))});`,
      );
      await writeFakeBinary(
        binaryDirectory,
        "grok",
        `process.stdout.write(${JSON.stringify(JSON.stringify([{ id: "fixture-grok@skill-market", version: "0.1.0", enabled: true }]))});`,
      );
      const executable = path.resolve("tooling/skill-market-cli/bin/skill-market.mjs");
      const { stdout } = await execFileAsync(process.execPath, [executable, "list", "--kind", "plugin"], {
        env: {
          HOME: home,
          PATH: [binaryDirectory, path.dirname(process.execPath)].join(path.delimiter),
        },
      });
      const result = JSON.parse(stdout);
      assert.deepEqual(result.data.items.map((item) => item.id), [
        "claude:plugin:fixture-claude",
        "codex:plugin:fixture-codex",
        "grok:plugin:fixture-grok",
      ]);
      await assert.rejects(access(path.join(home, ".skill-market/config.json")), { code: "ENOENT" });
      await assert.rejects(access(path.join(home, ".skill-market/cache")), { code: "ENOENT" });
    } finally {
      await removeTempDirectory(binaryDirectory);
    }
  });
});

test("the executable runs the full standalone lifecycle in an isolated HOME", async () => {
  await withTemporaryHome(async (home) => {
    const repoRoot = path.join(home, "fixture-repo");
    const catalogPath = path.join(repoRoot, "catalog", "entries.json");
    const skillPath = path.join(repoRoot, "skills", "codex", "fixture-skill");
    await mkdir(skillPath, { recursive: true });
    await mkdir(path.dirname(catalogPath), { recursive: true });
    const catalog = structuredClone(fixtureCatalog);
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    await writeFile(path.join(skillPath, "SKILL.md"), "fixture v1\n", "utf8");
    const executable = path.resolve("tooling/skill-market-cli/bin/skill-market.mjs");
    const env = {
      HOME: home,
      PATH: path.dirname(process.execPath),
    };
    const invoke = async (...args) => {
      const { stdout } = await execFileAsync(process.execPath, [executable, ...args], { env });
      return JSON.parse(stdout);
    };
    const id = "codex:standalone:fixture-skill";

    assert.equal((await invoke("install", id, "--repo-path", repoRoot)).status, "ok");
    assert.equal((await invoke("disable", id)).data.activation, "disabled");

    catalog.packages.find((entry) => entry.id === id).version = "0.0.2";
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    await writeFile(path.join(skillPath, "SKILL.md"), "fixture v2\n", "utf8");
    const updated = await invoke("update", id, "--repo-path", repoRoot);
    assert.equal(updated.data.activation, "disabled");
    assert.equal(updated.data.version, "0.0.2");

    const listed = await invoke(
      "list",
      "--adapter",
      "codex",
      "--kind",
      "standalone",
      "--repo-path",
      repoRoot,
    );
    assert.equal(listed.data.items[0].localState, "disabled");
    assert.equal(listed.data.items[0].drifted, false);
    assert.equal(listed.data.items[0].updateState, "current");

    assert.equal((await invoke("enable", id)).data.activation, "active");
    assert.equal((await invoke("uninstall", id)).status, "ok");
    const withoutHistory = await invoke(
      "list",
      "--adapter",
      "codex",
      "--kind",
      "standalone",
      "--repo-path",
      repoRoot,
    );
    assert.equal(withoutHistory.data.page.total, 0);
    const history = await invoke(
      "list",
      "--adapter",
      "codex",
      "--kind",
      "standalone",
      "--repo-path",
      repoRoot,
      "--history",
    );
    assert.equal(history.data.items[0].localState, "absent");
  });
});

test("the executable prepares and submits a proposal through a local remote and fake gh", async () => {
  await withTemporaryHome(async (home) => {
    const catalog = structuredClone(fixtureCatalog);
    const readRepoUrl = "https://github.com/example/skill-market.git";
    catalog.defaults.readRepoUrl = readRepoUrl;
    const fixture = await createProposalRepository({ catalog });
    const binaryDirectory = await makeTempDirectory("skill-market-proposal-bin-");
    try {
      const sourcePath = path.join(fixture.container, "proposal-source");
      await mkdir(sourcePath);
      await writeFile(
        path.join(sourcePath, "SKILL.md"),
        "---\nname: fixture-skill\ndescription: fixture\n---\n\nversion two\n",
        "utf8",
      );
      const specPath = path.join(fixture.container, "proposal.json");
      await writeFile(
        specPath,
        `${JSON.stringify({
          schemaVersion: 1,
          action: "update",
          summary: "Update Codex fixture skill",
          targets: [{
            id: "codex:standalone:fixture-skill",
            sourcePath,
            version: "0.0.2",
          }],
        }, null, 2)}\n`,
        "utf8",
      );
      const remote = await createBareRemote(fixture.container);
      const ghLog = path.join(binaryDirectory, "gh.log");
      await writeFakeBinary(
        binaryDirectory,
        "gh",
        `
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.GH_LOG, JSON.stringify(args) + "\\n");
if (args[0] === "auth" && args[1] === "status") process.exit(0);
if (args[0] === "repo" && args[1] === "view" && args.includes("viewerPermission")) {
  process.stdout.write("WRITE"); process.exit(0);
}
if (args[0] === "api" && args[1] === "user") {
  process.stdout.write("alice"); process.exit(0);
}
if (args[0] === "pr" && args[1] === "list") {
  process.stdout.write("[]"); process.exit(0);
}
if (args[0] === "pr" && args[1] === "create") {
  process.stdout.write("https://github.com/example/skill-market/pull/51\\n"); process.exit(0);
}
if (args[0] === "pr" && args[1] === "view") {
  process.stdout.write(JSON.stringify({number: 51, url: "https://github.com/example/skill-market/pull/51", state: "OPEN", headRefOid: process.env.GH_COMMIT})); process.exit(0);
}
process.stderr.write("unexpected command: " + args.join(" ")); process.exit(9);
`,
      );
      const executable = path.resolve("tooling/skill-market-cli/bin/skill-market.mjs");
      const baseEnv = {
        ...process.env,
        HOME: home,
        PATH: [binaryDirectory, path.dirname(process.execPath), process.env.PATH].join(path.delimiter),
        GH_LOG: ghLog,
      };
      const invoke = async (args, extraEnv = {}) => {
        const { stdout } = await execFileAsync(process.execPath, [executable, ...args], {
          env: { ...baseEnv, ...extraEnv },
        });
        return JSON.parse(stdout);
      };
      const planned = await invoke([
        "proposal",
        "plan",
        "--spec",
        specPath,
        "--repo-path",
        fixture.root,
        "--read-repo-url",
        readRepoUrl,
      ]);
      const id = planned.data.proposal.id;
      const prepared = await invoke(["proposal", "prepare", id]);
      const commit = prepared.data.proposal.workspace.preparedCommit;
      const submitted = await invoke(
        [
          "proposal",
          "submit",
          id,
          "--confirm-external-effects",
          "--push-mode",
          "direct",
          "--push-url",
          remote,
        ],
        { GH_COMMIT: commit },
      );
      assert.equal(submitted.data.proposal.status, "submitted");
      assert.equal(submitted.data.proposal.submission.pr.number, 51);
      const callsBefore = (await readFile(ghLog, "utf8")).trim().split("\n").length;
      const repeated = await invoke(["proposal", "submit", id]);
      assert.equal(repeated.status, "noop");
      const callsAfter = (await readFile(ghLog, "utf8")).trim().split("\n").length;
      assert.equal(callsAfter, callsBefore);
    } finally {
      await removeTempDirectory(binaryDirectory);
      await removeTempDirectory(fixture.container);
    }
  });
});
