import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { SkillMarketError } from "../src/errors.mjs";
import {
  abortProposal,
  planProposal,
  prepareProposal,
  statusProposal,
  submitProposal,
} from "../src/proposal.mjs";
import { createProposalGitClient } from "../src/proposal-git.mjs";
import { fixtureCatalog } from "./fixtures/catalog.mjs";
import {
  createBareRemote,
  createProposalRepository,
  fixtureGit,
} from "./helpers/proposal-fixture.mjs";
import { removeTempDirectory, withTemporaryHome } from "./helpers/temp-env.mjs";

const READ_URL = "https://github.com/example/skill-market.git";

async function setupPrepared(home) {
  const catalog = structuredClone(fixtureCatalog);
  catalog.defaults.readRepoUrl = READ_URL;
  const fixture = await createProposalRepository({ catalog });
  const sourcePath = path.join(fixture.container, "source-package");
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
  const env = { HOME: home };
  const planned = await planProposal({
    specPath,
    options: { repoPath: fixture.root, readRepoUrl: READ_URL, baseRef: "main" },
    env,
  });
  const id = planned.data.proposal.id;
  const prepared = await prepareProposal({ id, env });
  return { fixture, env, id, prepared };
}

function fakeGitHub({ permission = "WRITE", pushTarget, commit, authError = null, failCreate = null, existing = null } = {}) {
  const calls = [];
  return {
    calls,
    canPushDirect(value) {
      return ["ADMIN", "MAINTAIN", "WRITE"].includes(value);
    },
    async assertAuthenticated() {
      calls.push("auth");
      if (authError) throw authError;
    },
    async viewerPermission() {
      calls.push("permission");
      return permission;
    },
    async currentLogin() {
      calls.push("login");
      return "alice";
    },
    async ensureFork() {
      calls.push("fork");
      return {
        owner: "alice",
        nameWithOwner: "alice/skill-market",
        sshUrl: pushTarget,
      };
    },
    async findPullRequest() {
      calls.push("find-pr");
      return existing;
    },
    async createPullRequest() {
      calls.push("create-pr");
      if (failCreate) throw failCreate;
      return {
        number: 23,
        url: "https://github.com/example/skill-market/pull/23",
        state: "open",
        headRefOid: commit,
      };
    },
  };
}

test("submit requires exact external-effect confirmation before authentication or push", async () => {
  await withTemporaryHome(async (home) => {
    const setup = await setupPrepared(home);
    const remote = await createBareRemote(setup.fixture.container);
    const github = fakeGitHub({ pushTarget: remote, commit: setup.prepared.data.proposal.workspace.preparedCommit });
    try {
      await assert.rejects(
        submitProposal({
          id: setup.id,
          options: { pushMode: "direct", pushUrl: remote },
          env: setup.env,
          dependencies: { github },
        }),
        (error) => error.code === "proposal-submit-confirmation" && error.status === "needs_confirmation",
      );
      assert.deepEqual(github.calls, []);
      const git = createProposalGitClient();
      assert.equal(
        await git.remoteBranchHead(remote, setup.prepared.data.proposal.workspace.branch),
        null,
      );
    } finally {
      await removeTempDirectory(setup.fixture.container);
    }
  });
});

test("authentication failure blocks before branch creation", async () => {
  await withTemporaryHome(async (home) => {
    const setup = await setupPrepared(home);
    const remote = await createBareRemote(setup.fixture.container);
    const authError = new SkillMarketError({
      code: "github-auth-required",
      message: "not authenticated",
      status: "blocked",
    });
    const github = fakeGitHub({ pushTarget: remote, authError });
    try {
      await assert.rejects(
        submitProposal({
          id: setup.id,
          options: {
            confirmExternalEffects: true,
            pushMode: "direct",
            pushUrl: remote,
          },
          env: setup.env,
          dependencies: { github },
        }),
        (error) => error.code === "github-auth-required",
      );
      assert.deepEqual(github.calls, ["auth"]);
      const git = createProposalGitClient();
      assert.equal(
        await git.remoteBranchHead(remote, setup.prepared.data.proposal.workspace.branch),
        null,
      );
    } finally {
      await removeTempDirectory(setup.fixture.container);
    }
  });
});

test("direct submit pushes the exact prepared commit, creates one PR, and repeats as noop", async () => {
  await withTemporaryHome(async (home) => {
    const setup = await setupPrepared(home);
    const remote = await createBareRemote(setup.fixture.container);
    const commit = setup.prepared.data.proposal.workspace.preparedCommit;
    const github = fakeGitHub({ pushTarget: remote, commit });
    try {
      const submitted = await submitProposal({
        id: setup.id,
        options: {
          confirmExternalEffects: true,
          pushMode: "direct",
          pushUrl: remote,
        },
        env: setup.env,
        dependencies: { github },
      });
      assert.equal(submitted.data.proposal.status, "submitted");
      assert.equal(submitted.data.proposal.submission.strategy, "direct");
      assert.equal(submitted.data.proposal.submission.pr.number, 23);
      const git = createProposalGitClient();
      assert.equal(
        await git.remoteBranchHead(remote, setup.prepared.data.proposal.workspace.branch),
        commit,
      );
      const callCount = github.calls.length;
      const repeated = await submitProposal({
        id: setup.id,
        options: {},
        env: setup.env,
        dependencies: { github },
      });
      assert.equal(repeated.status, "noop");
      assert.equal(github.calls.length, callCount);
      await assert.rejects(
        abortProposal({ id: setup.id, env: setup.env }),
        (error) => error.code === "proposal-has-external-effects",
      );
    } finally {
      await removeTempDirectory(setup.fixture.container);
    }
  });
});

test("remote branch collisions block without force-push or PR creation", async () => {
  await withTemporaryHome(async (home) => {
    const setup = await setupPrepared(home);
    const remote = await createBareRemote(setup.fixture.container);
    const branch = setup.prepared.data.proposal.workspace.branch;
    await fixtureGit(["push", remote, `HEAD:refs/heads/${branch}`], { cwd: setup.fixture.root });
    const github = fakeGitHub({
      pushTarget: remote,
      commit: setup.prepared.data.proposal.workspace.preparedCommit,
    });
    try {
      await assert.rejects(
        submitProposal({
          id: setup.id,
          options: {
            confirmExternalEffects: true,
            pushMode: "direct",
            pushUrl: remote,
          },
          env: setup.env,
          dependencies: { github },
        }),
        (error) => error.code === "proposal-branch-collision",
      );
      assert.ok(!github.calls.includes("create-pr"));
      assert.equal((await statusProposal({ id: setup.id, env: setup.env })).data.proposal.status, "prepared");
    } finally {
      await removeTempDirectory(setup.fixture.container);
    }
  });
});

test("read-only permission selects a verified fork as an equal submit path", async () => {
  await withTemporaryHome(async (home) => {
    const setup = await setupPrepared(home);
    const forkRemote = await createBareRemote(setup.fixture.container, "fork.git");
    const commit = setup.prepared.data.proposal.workspace.preparedCommit;
    const github = fakeGitHub({ permission: "READ", pushTarget: forkRemote, commit });
    try {
      const submitted = await submitProposal({
        id: setup.id,
        options: { confirmExternalEffects: true, pushMode: "auto" },
        env: setup.env,
        dependencies: { github },
      });
      assert.equal(submitted.data.proposal.submission.strategy, "fork");
      assert.equal(submitted.data.proposal.submission.headOwner, "alice");
      assert.ok(github.calls.includes("fork"));
      assert.equal(
        await createProposalGitClient().remoteBranchHead(
          forkRemote,
          setup.prepared.data.proposal.workspace.branch,
        ),
        commit,
      );
    } finally {
      await removeTempDirectory(setup.fixture.container);
    }
  });
});

test("submit resumes after push and discovers an exact PR without pushing again", async () => {
  await withTemporaryHome(async (home) => {
    const setup = await setupPrepared(home);
    const remote = await createBareRemote(setup.fixture.container);
    const commit = setup.prepared.data.proposal.workspace.preparedCommit;
    const first = fakeGitHub({
      pushTarget: remote,
      commit,
      failCreate: new SkillMarketError({
        code: "github-command-failed",
        message: "simulated failure after push",
        retryable: true,
      }),
    });
    try {
      await assert.rejects(
        submitProposal({
          id: setup.id,
          options: {
            confirmExternalEffects: true,
            pushMode: "direct",
            pushUrl: remote,
          },
          env: setup.env,
          dependencies: { github: first },
        }),
        (error) => error.code === "github-command-failed",
      );
      assert.equal((await statusProposal({ id: setup.id, env: setup.env })).data.proposal.status, "pushed");
      const existing = {
        number: 41,
        url: "https://github.com/example/skill-market/pull/41",
        state: "open",
        headRefOid: commit,
      };
      const resumed = fakeGitHub({ pushTarget: remote, commit, existing });
      const submitted = await submitProposal({
        id: setup.id,
        options: { confirmExternalEffects: true },
        env: setup.env,
        dependencies: { github: resumed },
      });
      assert.equal(submitted.data.proposal.submission.pr.number, 41);
      assert.ok(!resumed.calls.includes("permission"));
      assert.ok(!resumed.calls.includes("create-pr"));
    } finally {
      await removeTempDirectory(setup.fixture.container);
    }
  });
});
