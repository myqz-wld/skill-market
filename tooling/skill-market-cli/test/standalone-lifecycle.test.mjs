import assert from "node:assert/strict";
import { access, cp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { SkillMarketError } from "../src/errors.mjs";
import { resolveStandalonePaths } from "../src/lifecycle-paths.mjs";
import { loadManagedState } from "../src/state-store.mjs";
import { readManagedPackages } from "../src/managed-state.mjs";
import {
  installStandalone,
  setStandaloneActivation,
  uninstallStandalone,
  updateStandalone,
} from "../src/standalone-lifecycle.mjs";
import { createStandaloneFixture } from "./helpers/lifecycle-fixture.mjs";
import {
  makeTempDirectory,
  removeTempDirectory,
  withTemporaryHome,
} from "./helpers/temp-env.mjs";

const FIXED_NOW = () => Date.parse("2026-08-03T00:00:00.000Z");

for (const adapter of ["claude", "codex", "grok"]) {
  test(`${adapter} standalone lifecycle preserves activation through update`, async () => {
    await withTemporaryHome(async (home) => {
      const fixture = await createStandaloneFixture(home, { adapter });
      const common = { ...fixture, home, now: FIXED_NOW };
      const paths = resolveStandalonePaths({
        adapter,
        name: fixture.entry.name,
        home,
        marketHome: fixture.marketHome,
      });

      const installed = await installStandalone(common);
      assert.equal(installed.data.activation, "active");
      assert.match(await readFile(path.join(paths.activePath, "SKILL.md"), "utf8"), /v1/u);

      const disabled = await setStandaloneActivation({
        id: fixture.entry.id,
        identity: fixture.entry,
        desired: "disabled",
        statePath: fixture.statePath,
        home,
        marketHome: fixture.marketHome,
        now: FIXED_NOW,
      });
      assert.equal(disabled.data.activation, "disabled");

      await writeFile(path.join(fixture.packagePath, "SKILL.md"), "fixture v2\n", "utf8");
      const nextEntry = { ...fixture.entry, version: "1.1.0" };
      fixture.snapshot.catalog.packages = [nextEntry];
      const updated = await updateStandalone({
        ...common,
        entry: nextEntry,
      });
      assert.equal(updated.data.activation, "disabled");
      assert.match(await readFile(path.join(paths.disabledPath, "SKILL.md"), "utf8"), /v2/u);
      await assert.rejects(access(paths.activePath), { code: "ENOENT" });

      await setStandaloneActivation({
        id: fixture.entry.id,
        identity: fixture.entry,
        desired: "active",
        statePath: fixture.statePath,
        home,
        marketHome: fixture.marketHome,
        now: FIXED_NOW,
      });
      await uninstallStandalone({
        id: fixture.entry.id,
        identity: fixture.entry,
        statePath: fixture.statePath,
        home,
        marketHome: fixture.marketHome,
        now: FIXED_NOW,
      });
      const history = (await loadManagedState(fixture.statePath)).packages[fixture.entry.id];
      assert.equal(history.uninstalledAt, "2026-08-03T00:00:00.000Z");
      assert.equal((await readManagedPackages(fixture.statePath))[0].localState, "absent");
      await assert.rejects(access(paths.activePath), { code: "ENOENT" });
    });
  });
}

test("unmanaged collisions require adoption and preserve disabled activation", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const paths = resolveStandalonePaths({
      adapter: "codex",
      name: fixture.entry.name,
      home,
      marketHome: fixture.marketHome,
    });
    await mkdir(paths.disabledPath, { recursive: true });
    await writeFile(path.join(paths.disabledPath, "SKILL.md"), "unmanaged\n", "utf8");
    await assert.rejects(
      installStandalone({ ...fixture, home, now: FIXED_NOW }),
      (error) =>
        error instanceof SkillMarketError &&
        error.code === "adoption-confirmation" &&
        error.status === "needs_confirmation",
    );
    assert.equal(await readFile(path.join(paths.disabledPath, "SKILL.md"), "utf8"), "unmanaged\n");

    const result = await installStandalone({
      ...fixture,
      home,
      adopt: true,
      now: FIXED_NOW,
    });
    assert.equal(result.data.activation, "disabled");
    const state = await loadManagedState(fixture.statePath);
    assert.equal(state.packages[fixture.entry.id].ownership, "adopted");
  });
});

test("local drift blocks activation until exact confirmation", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    await installStandalone({ ...fixture, home, now: FIXED_NOW });
    const paths = resolveStandalonePaths({
      adapter: "codex",
      name: fixture.entry.name,
      home,
      marketHome: fixture.marketHome,
    });
    await writeFile(path.join(paths.activePath, "local.txt"), "local edit\n", "utf8");
    const input = {
      id: fixture.entry.id,
      identity: fixture.entry,
      desired: "disabled",
      statePath: fixture.statePath,
      home,
      marketHome: fixture.marketHome,
      now: FIXED_NOW,
    };
    await assert.rejects(
      setStandaloneActivation(input),
      (error) => error instanceof SkillMarketError && error.code === "local-drift-confirmation",
    );
    assert.equal(await readFile(path.join(paths.activePath, "local.txt"), "utf8"), "local edit\n");
    await setStandaloneActivation({ ...input, confirmDrift: true });
    assert.equal(await readFile(path.join(paths.disabledPath, "local.txt"), "utf8"), "local edit\n");
  });
});

for (const boundary of ["beforeStateWrite", "afterStateWrite"]) {
  test(`install rollback restores an absent state after ${boundary} failure`, async () => {
    await withTemporaryHome(async (home) => {
      const fixture = await createStandaloneFixture(home);
      const paths = resolveStandalonePaths({
        adapter: "codex",
        name: fixture.entry.name,
        home,
        marketHome: fixture.marketHome,
      });
      await assert.rejects(
        installStandalone({
          ...fixture,
          home,
          now: FIXED_NOW,
          hooks: {
            [boundary]: async () => {
              throw new Error(`${boundary} fixture failure`);
            },
          },
        }),
        (error) => error instanceof SkillMarketError && error.code === "transaction-rolled-back",
      );
      await assert.rejects(access(paths.activePath), { code: "ENOENT" });
      await assert.rejects(access(fixture.statePath), { code: "ENOENT" });
    });
  });
}

test("unsafe managed-state paths block updates before touching either location", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    await installStandalone({ ...fixture, home, now: FIXED_NOW });
    const state = await loadManagedState(fixture.statePath);
    const outside = path.join(home, "outside", "fixture-skill");
    state.packages[fixture.entry.id].activePath = outside;
    await writeFile(fixture.statePath, JSON.stringify(state), "utf8");
    await assert.rejects(
      updateStandalone({ ...fixture, home, force: true, now: FIXED_NOW }),
      (error) => error instanceof SkillMarketError && error.code === "unsafe-managed-state-path",
    );
    await assert.rejects(access(outside), { code: "ENOENT" });
  });
});

test("duplicate active and disabled paths are treated as broken, not guessed", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    await installStandalone({ ...fixture, home, now: FIXED_NOW });
    const paths = resolveStandalonePaths({
      adapter: "codex",
      name: fixture.entry.name,
      home,
      marketHome: fixture.marketHome,
    });
    await cp(paths.activePath, paths.disabledPath, { recursive: true });
    await assert.rejects(
      uninstallStandalone({
        id: fixture.entry.id,
        identity: fixture.entry,
        statePath: fixture.statePath,
        home,
        marketHome: fixture.marketHome,
      }),
      (error) => error instanceof SkillMarketError && error.code === "broken-installation",
    );
  });
});

for (const adapter of ["claude", "codex", "grok"]) {
  test(`${adapter} writes through a symlinked adapter root`, async () => {
    await withTemporaryHome(async (home) => {
      const fixture = await createStandaloneFixture(home, { adapter });
      const relocatedRoot = await makeTempDirectory(`skill-market-${adapter}-root-`);
      try {
        assert.ok(path.relative(home, relocatedRoot).startsWith(".."));
        await symlink(relocatedRoot, path.join(home, `.${adapter}`));

        const installed = await installStandalone({ ...fixture, home, now: FIXED_NOW });
        const logicalPaths = resolveStandalonePaths({
          adapter,
          name: fixture.entry.name,
          home,
          marketHome: fixture.marketHome,
        });
        assert.equal(installed.data.path, logicalPaths.activePath);
        assert.equal(
          await readFile(
            path.join(relocatedRoot, "skills", fixture.entry.name, "SKILL.md"),
            "utf8",
          ),
          "fixture v1\n",
        );

        await setStandaloneActivation({
          id: fixture.entry.id,
          identity: fixture.entry,
          desired: "disabled",
          statePath: fixture.statePath,
          home,
          marketHome: fixture.marketHome,
          now: FIXED_NOW,
        });
        assert.equal(
          await readFile(
            path.join(relocatedRoot, "skills.disabled", fixture.entry.name, "SKILL.md"),
            "utf8",
          ),
          "fixture v1\n",
        );
        const [managed] = await readManagedPackages(fixture.statePath, {
          home,
          marketHome: fixture.marketHome,
        });
        assert.equal(managed.localState, "disabled");
        assert.equal(managed.location, logicalPaths.disabledPath);
      } finally {
        await removeTempDirectory(relocatedRoot);
      }
    });
  });
}

test("symlinked skills roots cannot redirect managed writes outside the adapter root", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const outside = path.join(home, "outside");
    await mkdir(path.join(home, ".codex"), { recursive: true });
    await mkdir(outside);
    await symlink(outside, path.join(home, ".codex", "skills"));
    await assert.rejects(
      installStandalone({ ...fixture, home, now: FIXED_NOW }),
      (error) => error instanceof SkillMarketError && error.code === "unsafe-path-topology",
    );
    await assert.rejects(access(path.join(outside, fixture.entry.name)), { code: "ENOENT" });
  });
});

test("dangling adapter-root symlinks remain blocked", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    await symlink(path.join(home, "missing-codex"), path.join(home, ".codex"));
    await assert.rejects(
      installStandalone({ ...fixture, home, now: FIXED_NOW }),
      (error) => error instanceof SkillMarketError && error.code === "unsafe-path-topology",
    );
  });
});

test("update, activation, and uninstall failures roll filesystem and state back together", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const common = { ...fixture, home, now: FIXED_NOW };
    const paths = resolveStandalonePaths({
      adapter: fixture.entry.adapter,
      name: fixture.entry.name,
      home,
      marketHome: fixture.marketHome,
    });
    await installStandalone(common);
    const originalState = await loadManagedState(fixture.statePath);

    await writeFile(path.join(fixture.packagePath, "SKILL.md"), "fixture v2\n", "utf8");
    const nextEntry = { ...fixture.entry, version: "1.1.0" };
    await assert.rejects(
      updateStandalone({
        ...common,
        entry: nextEntry,
        hooks: {
          afterStateWrite: async () => {
            throw new Error("update state boundary failure");
          },
        },
      }),
      (error) => error.code === "transaction-rolled-back",
    );
    assert.equal(await readFile(path.join(paths.activePath, "SKILL.md"), "utf8"), "fixture v1\n");
    assert.deepEqual(await loadManagedState(fixture.statePath), originalState);

    await assert.rejects(
      setStandaloneActivation({
        id: fixture.entry.id,
        identity: fixture.entry,
        desired: "disabled",
        statePath: fixture.statePath,
        home,
        marketHome: fixture.marketHome,
        now: FIXED_NOW,
        hooks: {
          afterSwap: async () => {
            throw new Error("activation swap failure");
          },
        },
      }),
      (error) => error.code === "transaction-rolled-back",
    );
    await access(paths.activePath);
    await assert.rejects(access(paths.disabledPath), { code: "ENOENT" });
    assert.deepEqual(await loadManagedState(fixture.statePath), originalState);

    await assert.rejects(
      uninstallStandalone({
        id: fixture.entry.id,
        identity: fixture.entry,
        statePath: fixture.statePath,
        home,
        marketHome: fixture.marketHome,
        now: FIXED_NOW,
        hooks: {
          afterBackup: async () => {
            throw new Error("uninstall backup failure");
          },
        },
      }),
      (error) => error.code === "transaction-rolled-back",
    );
    await access(paths.activePath);
    assert.deepEqual(await loadManagedState(fixture.statePath), originalState);
  });
});

test("uninstall history can be reinstalled as a fresh managed package", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const common = { ...fixture, home, now: FIXED_NOW };
    await installStandalone(common);
    await uninstallStandalone({
      id: fixture.entry.id,
      identity: fixture.entry,
      statePath: fixture.statePath,
      home,
      marketHome: fixture.marketHome,
      now: FIXED_NOW,
    });
    assert.equal((await readManagedPackages(fixture.statePath))[0].localState, "absent");
    const result = await installStandalone(common);
    assert.equal(result.status, "ok");
    const record = (await loadManagedState(fixture.statePath)).packages[fixture.entry.id];
    assert.equal(record.uninstalledAt, null);
    assert.equal((await readManagedPackages(fixture.statePath))[0].localState, "active");
  });
});

test("concurrent installs serialize into one install and one idempotent no-op", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    const results = await Promise.all([
      installStandalone({ ...fixture, home, now: FIXED_NOW }),
      installStandalone({ ...fixture, home, now: FIXED_NOW }),
    ]);
    assert.deepEqual(results.map((result) => result.status).sort(), ["noop", "ok"]);
  });
});

test("standalone source changes require an exact confirmation before overwrite", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await createStandaloneFixture(home);
    await installStandalone({ ...fixture, home, now: FIXED_NOW });
    const changedSnapshot = structuredClone(fixture.snapshot);
    changedSnapshot.source.repoIdentity = "example.test/other-market";
    await assert.rejects(
      updateStandalone({
        ...fixture,
        snapshot: changedSnapshot,
        home,
        force: true,
        now: FIXED_NOW,
      }),
      (error) => error.code === "source-change-confirmation",
    );
    const result = await updateStandalone({
      ...fixture,
      snapshot: changedSnapshot,
      home,
      force: true,
      confirmSourceChange: true,
      now: FIXED_NOW,
    });
    assert.equal(result.status, "ok");
    assert.equal(
      (await loadManagedState(fixture.statePath)).packages[fixture.entry.id].source.repoIdentity,
      "example.test/other-market",
    );
  });
});
