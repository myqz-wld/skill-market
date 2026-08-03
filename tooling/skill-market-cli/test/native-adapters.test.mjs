import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { SkillMarketError } from "../src/errors.mjs";
import {
  runNativePluginLifecycle,
  verifyNativeMarketplace,
} from "../src/native-adapters.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

function pluginEntry(adapter, version = "1.1.0") {
  return {
    id: `${adapter}:plugin:fixture-${adapter}`,
    adapter,
    kind: "plugin",
    name: `fixture-${adapter}`,
    version,
    status: "active",
    path: `plugins/fixture-${adapter}`,
    manifestPath: `.${adapter}-plugin/plugin.json`,
    description: "Fixture plugin.",
  };
}

async function nativeFixture(home, adapter) {
  const root = path.join(home, "catalog-repo");
  const entry = pluginEntry(adapter);
  await mkdir(path.join(root, entry.path), { recursive: true });
  return {
    entry,
    root,
    snapshot: {
      root,
      freshness: "local_override",
      source: { mode: "local", identity: `local:${root}` },
      catalog: { packages: [entry] },
      warnings: [],
    },
    repository: {
      readRepoUrl: "https://example.test/skill-market.git",
      repoPath: root,
      cachePath: path.join(home, ".skill-market/cache/skill-market"),
    },
    git: {
      remoteUrl: async () => {
        throw new Error("fixture checkout has no remote");
      },
    },
  };
}

function installed(entry, overrides = {}) {
  return {
    id: entry.id,
    adapter: entry.adapter,
    kind: "plugin",
    name: entry.name,
    installedVersion: "1.0.0",
    localState: "active",
    ownership: "native",
    location: null,
    native: {
      marketplaceName: entry.adapter === "grok" ? null : "skill-market",
      pluginId: entry.name,
      scope: entry.adapter === "claude" ? "project" : null,
      source: null,
    },
    ...overrides,
  };
}

function marketplacePayload(adapter, root) {
  if (adapter === "codex") {
    return {
      marketplaces: [
        {
          name: "skill-market",
          root,
          marketplaceSource: { sourceType: "local", source: root },
        },
      ],
    };
  }
  return [{ name: "skill-market", source: "directory", path: root }];
}

test("Codex and Claude marketplace verification binds native mutation to the catalog source", async () => {
  for (const adapter of ["codex", "claude"]) {
    await withTemporaryHome(async (home) => {
      const fixture = await nativeFixture(home, adapter);
      const execute = async () => marketplacePayload(adapter, fixture.root);
      const verified = await verifyNativeMarketplace({
        adapter,
        snapshot: fixture.snapshot,
        execute,
        git: fixture.git,
      });
      assert.equal(verified.source, fixture.root);

      await assert.rejects(
        verifyNativeMarketplace({
          adapter,
          snapshot: fixture.snapshot,
          execute: async () => marketplacePayload(adapter, path.join(home, "other")),
          git: fixture.git,
        }),
        (error) =>
          error instanceof SkillMarketError &&
          error.code === "native-marketplace-source-mismatch",
      );
    });
  }
});

test("Codex local-marketplace update requires confirmation and bounds reinstall retries", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "codex");
    const item = installed(fixture.entry);
    const calls = [];
    let addAttempts = 0;
    const execute = async (command, args) => {
      calls.push([command, args]);
      if (args.join(" ") === "plugin marketplace list --json") {
        return marketplacePayload("codex", fixture.root);
      }
      if (args[1] === "add") {
        addAttempts += 1;
        if (addAttempts === 1) throw new Error("transient add failure");
      }
      return {};
    };
    const input = {
      operation: "update",
      entry: fixture.entry,
      snapshot: fixture.snapshot,
      repository: fixture.repository,
      execute,
      git: fixture.git,
      readPlugins: async () => [item],
    };
    await assert.rejects(
      runNativePluginLifecycle(input),
      (error) => error.code === "codex-reinstall-confirmation",
    );
    assert.equal(addAttempts, 0);

    const result = await runNativePluginLifecycle({
      ...input,
      options: { confirmReinstall: true },
    });
    assert.equal(result.status, "ok");
    assert.equal(result.warnings[0].code, "codex-reinstall-retried");
    assert.equal(addAttempts, 2);
    assert.deepEqual(
      calls.slice(-3).map(([, args]) => args.slice(0, 3)),
      [
        ["plugin", "remove", "fixture-codex@skill-market"],
        ["plugin", "add", "fixture-codex@skill-market"],
        ["plugin", "add", "fixture-codex@skill-market"],
      ],
    );
    assert.equal(
      calls.some(([, args]) => args.slice(0, 3).join(" ") === "plugin marketplace upgrade"),
      false,
    );
  });
});

test("Codex Git-marketplace update refreshes before the confirmed reinstall", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "codex");
    const calls = [];
    const repositoryUrl = "https://example.test/skill-market.git";
    const result = await runNativePluginLifecycle({
      operation: "update",
      entry: fixture.entry,
      snapshot: fixture.snapshot,
      repository: fixture.repository,
      options: { confirmReinstall: true },
      git: { remoteUrl: async () => repositoryUrl },
      readPlugins: async () => [installed(fixture.entry)],
      execute: async (command, args) => {
        calls.push([command, args]);
        if (args.join(" ") === "plugin marketplace list --json") {
          return {
            marketplaces: [
              {
                name: "skill-market",
                marketplaceSource: { sourceType: "git", source: repositoryUrl },
              },
            ],
          };
        }
        return {};
      },
    });
    assert.equal(result.status, "ok");
    assert.deepEqual(
      calls.slice(-3).map(([, args]) => args.slice(0, 3)),
      [
        ["plugin", "marketplace", "upgrade"],
        ["plugin", "remove", "fixture-codex@skill-market"],
        ["plugin", "add", "fixture-codex@skill-market"],
      ],
    );
  });
});

test("Codex reports an explicit blocked recovery after exactly two failed add attempts", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "codex");
    let addAttempts = 0;
    await assert.rejects(
      runNativePluginLifecycle({
        operation: "update",
        entry: fixture.entry,
        snapshot: fixture.snapshot,
        repository: fixture.repository,
        options: { confirmReinstall: true },
        git: fixture.git,
        readPlugins: async () => [installed(fixture.entry)],
        execute: async (command, args) => {
          if (args.join(" ") === "plugin marketplace list --json") {
            return marketplacePayload("codex", fixture.root);
          }
          if (args[1] === "add") {
            addAttempts += 1;
            throw new Error(`add failure ${addAttempts}`);
          }
          return {};
        },
      }),
      (error) =>
        error.code === "codex-reinstall-failed" &&
        error.status === "blocked" &&
        /codex plugin add/u.test(error.nextAction),
    );
    assert.equal(addAttempts, 2);
  });
});

test("Codex native activation gaps are reported before reading or mutating state", async () => {
  const entry = pluginEntry("codex");
  let reads = 0;
  await assert.rejects(
    runNativePluginLifecycle({
      operation: "disable",
      entry,
      readPlugins: async () => {
        reads += 1;
        return [];
      },
    }),
    (error) => error.code === "unsupported-capability" && error.status === "unsupported",
  );
  assert.equal(reads, 0);
});

test("Claude preserves detected scope, keeps data by default, and emits update restart guidance", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "claude");
    const item = installed(fixture.entry);
    const calls = [];
    const execute = async (command, args) => {
      calls.push([command, args]);
      if (args.join(" ") === "plugin marketplace list --json") {
        return marketplacePayload("claude", fixture.root);
      }
      return [];
    };
    const common = {
      entry: fixture.entry,
      snapshot: fixture.snapshot,
      repository: fixture.repository,
      execute,
      git: fixture.git,
      readPlugins: async () => [item],
    };
    const updated = await runNativePluginLifecycle({ ...common, operation: "update" });
    assert.equal(updated.data.scope, "project");
    assert.equal(updated.warnings[0].code, "restart-required");
    assert.deepEqual(calls.at(-1), [
      "claude",
      ["plugin", "update", "fixture-claude@skill-market", "--scope", "project"],
    ]);

    await runNativePluginLifecycle({
      ...common,
      operation: "uninstall",
      snapshot: null,
    });
    assert.deepEqual(calls.at(-1), [
      "claude",
      [
        "plugin",
        "uninstall",
        "fixture-claude@skill-market",
        "--scope",
        "project",
        "--keep-data",
      ],
    ]);

    await assert.rejects(
      runNativePluginLifecycle({
        ...common,
        operation: "disable",
        snapshot: null,
        options: { scope: "user" },
      }),
      (error) => error.code === "native-scope-mismatch",
    );
  });
});

test("Claude rejects managed install scope and requires explicit scope when installed scope is unknown", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "claude");
    const execute = async (command, args) =>
      args.join(" ") === "plugin marketplace list --json"
        ? marketplacePayload("claude", fixture.root)
        : [];
    const common = {
      entry: fixture.entry,
      snapshot: fixture.snapshot,
      repository: fixture.repository,
      execute,
      git: fixture.git,
    };
    await assert.rejects(
      runNativePluginLifecycle({
        ...common,
        operation: "install",
        options: { scope: "managed" },
        readPlugins: async () => [],
      }),
      (error) => error.code === "invalid-native-scope",
    );
    await assert.rejects(
      runNativePluginLifecycle({
        ...common,
        operation: "update",
        readPlugins: async () => [installed(fixture.entry, { native: { scope: null } })],
      }),
      (error) => error.code === "native-scope-unknown",
    );
  });
});

test("install does not call a native installer when the installed version requires update", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "codex");
    let installs = 0;
    await assert.rejects(
      runNativePluginLifecycle({
        operation: "install",
        entry: fixture.entry,
        snapshot: fixture.snapshot,
        repository: fixture.repository,
        git: fixture.git,
        readPlugins: async () => [installed(fixture.entry)],
        execute: async (command, args) => {
          if (args.join(" ") === "plugin marketplace list --json") {
            return marketplacePayload("codex", fixture.root);
          }
          installs += 1;
          return {};
        },
      }),
      (error) => error.code === "native-plugin-update-required",
    );
    assert.equal(installs, 0);
  });
});

test("Grok installation requires trust and local lifecycle verifies source provenance", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "grok");
    const calls = [];
    const execute = async (command, args) => {
      calls.push([command, args]);
      return [];
    };
    const common = {
      entry: fixture.entry,
      snapshot: fixture.snapshot,
      repository: fixture.repository,
      execute,
      git: fixture.git,
    };
    await assert.rejects(
      runNativePluginLifecycle({ ...common, operation: "install", readPlugins: async () => [] }),
      (error) => error.code === "grok-trust-confirmation",
    );
    const installedResult = await runNativePluginLifecycle({
      ...common,
      operation: "install",
      options: { confirmTrust: true },
      readPlugins: async () => [],
    });
    assert.equal(installedResult.status, "ok");
    assert.deepEqual(calls.at(-1), [
      "grok",
      ["plugin", "install", path.join(fixture.root, fixture.entry.path), "--trust"],
    ]);

    const mismatched = installed(fixture.entry, {
      native: { source: { path: path.join(home, "elsewhere", fixture.entry.name) } },
    });
    await assert.rejects(
      runNativePluginLifecycle({
        ...common,
        operation: "disable",
        snapshot: null,
        readPlugins: async () => [mismatched],
      }),
      (error) => error.code === "native-source-confirmation",
    );
    const confirmed = await runNativePluginLifecycle({
      ...common,
      operation: "disable",
      snapshot: null,
      options: { confirmSourceChange: true },
      readPlugins: async () => [mismatched],
    });
    assert.equal(confirmed.status, "ok");
    assert.deepEqual(calls.at(-1), ["grok", ["plugin", "disable", "fixture-grok"]]);
  });
});

test("Grok refreshes local-source metadata, preserves activation, and keeps data by default", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "grok");
    const source = { path: path.join(fixture.root, fixture.entry.path) };
    const calls = [];
    const execute = async (command, args) => {
      calls.push([command, args]);
      return [];
    };
    const invoke = (operation, overrides = {}, options = {}) =>
      runNativePluginLifecycle({
        operation,
        entry: fixture.entry,
        snapshot: operation === "update" ? fixture.snapshot : null,
        repository: fixture.repository,
        options,
        execute,
        git: fixture.git,
        readPlugins: async () => [
          installed(fixture.entry, {
            native: { source },
            ...overrides,
          }),
        ],
      });

    const updated = await invoke("update", { localState: "disabled" });
    assert.equal(updated.warnings[0].code, "grok-local-source-reinstalled");
    await invoke("enable", { localState: "disabled" });
    await invoke("disable");
    await invoke("uninstall");
    await invoke("uninstall", {}, { removeData: true });
    assert.deepEqual(calls, [
      ["grok", ["plugin", "uninstall", "fixture-grok", "--confirm", "--keep-data"]],
      ["grok", ["plugin", "install", source.path, "--trust"]],
      ["grok", ["plugin", "disable", "fixture-grok"]],
      ["grok", ["plugin", "enable", "fixture-grok"]],
      ["grok", ["plugin", "disable", "fixture-grok"]],
      ["grok", ["plugin", "uninstall", "fixture-grok", "--confirm", "--keep-data"]],
      ["grok", ["plugin", "uninstall", "fixture-grok", "--confirm"]],
    ]);
  });
});

test("Grok keeps native update for non-local sources", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "grok");
    const calls = [];
    const result = await runNativePluginLifecycle({
      operation: "update",
      entry: fixture.entry,
      snapshot: fixture.snapshot,
      repository: fixture.repository,
      options: { confirmSourceChange: true },
      execute: async (command, args) => {
        calls.push([command, args]);
        return [];
      },
      git: fixture.git,
      readPlugins: async () => [
        installed(fixture.entry, {
          native: { source: "https://example.test/skill-market.git" },
        }),
      ],
    });
    assert.equal(result.status, "ok");
    assert.deepEqual(calls, [["grok", ["plugin", "update", "fixture-grok"]]]);
  });
});

test("Grok bounds local-source reinstall retries after preserving data", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await nativeFixture(home, "grok");
    const source = path.join(fixture.root, fixture.entry.path);
    let installAttempts = 0;
    await assert.rejects(
      runNativePluginLifecycle({
        operation: "update",
        entry: fixture.entry,
        snapshot: fixture.snapshot,
        repository: fixture.repository,
        execute: async (command, args) => {
          if (args[1] === "install") {
            installAttempts += 1;
            throw new Error(`install failure ${installAttempts}`);
          }
          return [];
        },
        git: fixture.git,
        readPlugins: async () => [
          installed(fixture.entry, { native: { source: { path: source } } }),
        ],
      }),
      (error) =>
        error.code === "grok-reinstall-failed" &&
        error.status === "blocked" &&
        /grok plugin install/u.test(error.nextAction),
    );
    assert.equal(installAttempts, 2);
  });
});
