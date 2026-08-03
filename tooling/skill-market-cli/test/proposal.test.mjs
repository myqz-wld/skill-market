import assert from "node:assert/strict";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  abortProposal,
  planProposal,
  prepareProposal,
  statusProposal,
} from "../src/proposal.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import {
  createProposalRepository,
  fixtureGit,
} from "./helpers/proposal-fixture.mjs";
import {
  removeTempDirectory,
  withTemporaryHome,
} from "./helpers/temp-env.mjs";

const READ_URL = "https://github.com/example/skill-market.git";

async function writeUpdateSource(root, body = "fixture version two") {
  const sourcePath = path.join(root, "package-source");
  await mkdir(sourcePath, { recursive: true });
  await writeFile(
    path.join(sourcePath, "SKILL.md"),
    `---\nname: fixture-skill\ndescription: fixture\n---\n\n${body}\n`,
    "utf8",
  );
  return sourcePath;
}

async function writeSpec(root, sourcePath, overrides = {}) {
  const specPath = path.join(root, "proposal-input.json");
  const spec = {
    schemaVersion: 1,
    action: "update",
    summary: "Update Codex fixture skill",
    targets: [
      {
        id: "codex:standalone:fixture-skill",
        sourcePath,
        version: "0.0.2",
      },
    ],
    ...overrides,
  };
  await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  return specPath;
}

function sourceOptions(repoPath) {
  return { repoPath, readRepoUrl: READ_URL, baseRef: "main" };
}

async function fixtureRepository() {
  const catalog = structuredClone(fixtureCatalog);
  catalog.defaults.readRepoUrl = READ_URL;
  return createProposalRepository({ catalog });
}

test("plan, prepare, status, abort, and identical re-plan are durable and local", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await fixtureRepository();
    try {
      const sourcePath = await writeUpdateSource(fixture.container);
      const specPath = await writeSpec(fixture.container, sourcePath);
      const env = { HOME: home };
      const planned = await planProposal({
        specPath,
        options: sourceOptions(fixture.root),
        env,
      });
      assert.equal(planned.status, "ok");
      assert.equal(planned.data.proposal.status, "planned");
      const id = planned.data.proposal.id;
      assert.match(id, /^proposal-[0-9a-f]{16}$/u);

      const duplicate = await planProposal({
        specPath,
        options: sourceOptions(fixture.root),
        env,
      });
      assert.equal(duplicate.status, "noop");
      assert.equal(duplicate.data.proposal.id, id);

      const prepared = await prepareProposal({ id, env });
      assert.equal(prepared.status, "ok");
      assert.equal(prepared.data.proposal.status, "prepared");
      assert.match(prepared.data.proposal.workspace.diffHash, /^[0-9a-f]{64}$/u);
      const worktreePath = prepared.data.proposal.workspace.worktreePath;
      const nextCatalog = JSON.parse(
        await readFile(path.join(worktreePath, "catalog", "entries.json"), "utf8"),
      );
      assert.equal(
        nextCatalog.packages.find((entry) => entry.id === "codex:standalone:fixture-skill").version,
        "0.0.2",
      );
      const originalCatalog = JSON.parse(
        await readFile(path.join(fixture.root, "catalog", "entries.json"), "utf8"),
      );
      assert.equal(
        originalCatalog.packages.find((entry) => entry.id === "codex:standalone:fixture-skill").version,
        "0.0.1",
      );

      const status = await statusProposal({ id, env });
      assert.equal(status.data.workspaceHealth.present, true);
      assert.equal(status.data.workspaceHealth.clean, true);
      assert.equal(status.data.workspaceHealth.exact, true);

      const aborted = await abortProposal({ id, env });
      assert.equal(aborted.data.proposal.status, "aborted");
      await assert.rejects(access(worktreePath), { code: "ENOENT" });

      const replanned = await planProposal({
        specPath,
        options: sourceOptions(fixture.root),
        env,
      });
      assert.equal(replanned.status, "ok");
      assert.equal(replanned.data.proposal.status, "planned");
      assert.equal(replanned.data.proposal.id, id);
    } finally {
      await removeTempDirectory(fixture.container);
    }
  });
});

test("plan blocks a dirty base checkout before creating durable proposal state", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await fixtureRepository();
    try {
      const sourcePath = await writeUpdateSource(fixture.container);
      const specPath = await writeSpec(fixture.container, sourcePath);
      await writeFile(path.join(fixture.root, "untracked.txt"), "dirty\n", "utf8");
      await assert.rejects(
        planProposal({
          specPath,
          options: sourceOptions(fixture.root),
          env: { HOME: home },
        }),
        (error) => error.code === "dirty-proposal-base",
      );
      await assert.rejects(access(path.join(home, ".skill-market", "proposals")), {
        code: "ENOENT",
      });
    } finally {
      await removeTempDirectory(fixture.container);
    }
  });
});

test("prepare detects source mutation, rolls back its transient state, and can resume after re-plan", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await fixtureRepository();
    try {
      const sourcePath = await writeUpdateSource(fixture.container);
      const specPath = await writeSpec(fixture.container, sourcePath);
      const env = { HOME: home };
      const planned = await planProposal({
        specPath,
        options: sourceOptions(fixture.root),
        env,
      });
      const id = planned.data.proposal.id;
      await writeFile(path.join(sourcePath, "SKILL.md"), "changed after plan\n", "utf8");
      await assert.rejects(
        prepareProposal({ id, env }),
        (error) => error.code === "proposal-source-changed",
      );
      const status = await statusProposal({ id, env });
      assert.equal(status.data.proposal.status, "planned");
      assert.equal(status.data.workspaceHealth.present, false);
    } finally {
      await removeTempDirectory(fixture.container);
    }
  });
});

test("abort requires explicit discard only for drift inside the exact proposal worktree", async () => {
  await withTemporaryHome(async (home) => {
    const fixture = await fixtureRepository();
    try {
      const sourcePath = await writeUpdateSource(fixture.container);
      const specPath = await writeSpec(fixture.container, sourcePath);
      const env = { HOME: home };
      const planned = await planProposal({
        specPath,
        options: sourceOptions(fixture.root),
        env,
      });
      const id = planned.data.proposal.id;
      const prepared = await prepareProposal({ id, env });
      const worktreePath = prepared.data.proposal.workspace.worktreePath;
      await writeFile(path.join(worktreePath, "local-note.txt"), "do not discard silently\n", "utf8");
      await assert.rejects(
        abortProposal({ id, env }),
        (error) => error.code === "proposal-abort-confirmation" && error.status === "needs_confirmation",
      );
      await access(worktreePath);
      await fixtureGit(["add", "local-note.txt"], { cwd: worktreePath });
      await fixtureGit(
        [
          "-c",
          "user.name=Fixture",
          "-c",
          "user.email=fixture@example.test",
          "commit",
          "--no-gpg-sign",
          "-m",
          "local commit",
        ],
        { cwd: worktreePath },
      );
      await assert.rejects(
        abortProposal({ id, env }),
        (error) =>
          error.code === "proposal-abort-confirmation" &&
          error.details.actualHead !== error.details.expectedHead &&
          error.details.status === "",
      );
      const aborted = await abortProposal({
        id,
        options: { confirmDiscard: true },
        env,
      });
      assert.equal(aborted.data.proposal.status, "aborted");
      await assert.rejects(access(worktreePath), { code: "ENOENT" });
      await access(fixture.root);
    } finally {
      await removeTempDirectory(fixture.container);
    }
  });
});
