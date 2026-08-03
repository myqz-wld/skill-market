import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  evolveProposalState,
  initialProposalState,
  readProposalState,
  resolveProposalPaths,
  writeProposalState,
} from "../src/proposal-store.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

const ID = "proposal-0123456789abcdef";
const NOW = Date.parse("2026-08-03T10:00:00.000Z");

function initial(paths) {
  return initialProposalState({
    id: ID,
    planHash: "1".repeat(64),
    spec: {
      schemaVersion: 1,
      action: "retire",
      summary: "Retire fixture",
      targets: [{ id: "codex:standalone:fixture-skill" }],
    },
    source: {
      root: "/tmp/source",
      mode: "local",
      readRepoUrl: "https://github.com/example/skill-market.git",
      repoIdentity: "github.com/example/skill-market",
      baseRef: "main",
      baseCommit: "a".repeat(40),
      catalogDigest: "b".repeat(64),
      freshness: "local_override",
    },
    now: () => NOW,
  });
}

test("proposal state is sealed, revisioned, and stored only at canonical paths", async () => {
  await withTemporaryHome(async (home) => {
    const paths = resolveProposalPaths({ HOME: home }, ID);
    const state = await writeProposalState(paths, initial(paths));
    assert.equal((await readProposalState(paths)).integrityHash, state.integrityHash);

    const prepared = evolveProposalState(state, {
      status: "prepared",
      patch: {
        workspace: {
          barePath: paths.barePath,
          worktreePath: paths.worktreePath,
          bodyPath: paths.bodyPath,
          branchName: "market/retire/codex/fixture-skill-01234567",
          preparedCommit: "c".repeat(40),
          diffHash: "d".repeat(64),
        },
      },
      event: "prepared",
      now: () => NOW + 1000,
    });
    await writeProposalState(paths, prepared);
    const loaded = await readProposalState(paths);
    assert.equal(loaded.revision, 2);
    assert.equal(loaded.status, "prepared");
    assert.equal(loaded.history.at(-1).type, "prepared");
  });
});

test("proposal state rejects hand edits and redirected workspace paths", async () => {
  await withTemporaryHome(async (home) => {
    const paths = resolveProposalPaths({ HOME: home }, ID);
    await writeProposalState(paths, initial(paths));
    const edited = JSON.parse(await readFile(paths.statePath, "utf8"));
    edited.status = "submitted";
    await writeFile(paths.statePath, `${JSON.stringify(edited)}\n`, "utf8");
    await assert.rejects(
      readProposalState(paths),
      (error) => error.code === "proposal-state-integrity-mismatch",
    );

    const clean = initial(paths);
    const redirected = evolveProposalState(clean, {
      status: "preparing",
      patch: {
        workspace: {
          barePath: "/tmp/other.git",
          worktreePath: paths.worktreePath,
          bodyPath: paths.bodyPath,
          branchName: "market/test",
        },
      },
      event: "preparing",
      now: () => NOW,
    });
    await assert.rejects(
      writeProposalState(paths, redirected),
      (error) => error.code === "unsafe-proposal-state",
    );
  });
});

test("proposal storage rejects symlinked managed roots", async (context) => {
  if (process.platform === "win32") {
    context.skip("symlink topology coverage is POSIX-only");
    return;
  }
  await withTemporaryHome(async (home) => {
    const { symlink } = await import("node:fs/promises");
    const external = path.join(home, "external");
    await mkdir(external);
    await mkdir(path.join(home, ".skill-market"));
    await symlink(external, path.join(home, ".skill-market", "proposals"));
    const paths = resolveProposalPaths({ HOME: home }, ID);
    const { assertProposalTopology } = await import("../src/proposal-store.mjs");
    await assert.rejects(
      assertProposalTopology(paths),
      (error) => error.code === "unsafe-proposal-path",
    );
  });
});

test("proposal storage rejects filesystem-root HOME before creating locks", async () => {
  const paths = resolveProposalPaths({ HOME: path.parse(process.cwd()).root }, ID);
  const { assertProposalTopology } = await import("../src/proposal-store.mjs");
  await assert.rejects(
    assertProposalTopology(paths),
    (error) => error.code === "unsafe-proposal-path",
  );
});

test("proposal storage accepts an explicit safe Skill Market home outside HOME", async () => {
  await withTemporaryHome(async (home) => {
    const marketHome = path.join(path.dirname(home), `${path.basename(home)}-market-state`);
    await mkdir(marketHome);
    try {
      const paths = resolveProposalPaths({ HOME: home, SKILL_MARKET_HOME: marketHome }, ID);
      const { assertProposalTopology } = await import("../src/proposal-store.mjs");
      await assert.doesNotReject(assertProposalTopology(paths));
    } finally {
      await rm(marketHome, { recursive: true, force: true });
    }
  });
});
