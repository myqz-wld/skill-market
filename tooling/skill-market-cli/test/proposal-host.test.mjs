import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  createGitHubClient,
  githubRepositoryFromIdentity,
  resolveSubmissionStrategy,
} from "../src/proposal-host.mjs";
import {
  makeTempDirectory,
  removeTempDirectory,
  writeFakeBinary,
} from "./helpers/temp-env.mjs";

async function fakeGitHubEnvironment(overrides = {}) {
  const root = await makeTempDirectory("skill-market-fake-gh-");
  const logPath = path.join(root, "gh.log");
  const executable = await writeFakeBinary(
    root,
    "gh",
    `
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.GH_LOG, JSON.stringify(args) + "\\n");
if (args[0] === "auth" && args[1] === "status") {
  if (process.env.GH_AUTH_FAIL === "1") process.exit(1);
  process.exit(0);
}
if (args[0] === "api" && args[1] === "user") {
  process.stdout.write(process.env.GH_LOGIN || "alice");
  process.exit(0);
}
if (args[0] === "repo" && args[1] === "view" && args.includes("viewerPermission")) {
  process.stdout.write(process.env.GH_PERMISSION || "READ");
  process.exit(0);
}
if (args[0] === "repo" && args[1] === "view") {
  if (process.env.GH_FORK_MISSING === "1" && !fs.existsSync(process.env.GH_LOG + ".fork")) process.exit(1);
  process.stdout.write(JSON.stringify({
    nameWithOwner: "alice/skill-market",
    sshUrl: process.env.GH_FORK_URL || "git@github.com:alice/skill-market.git",
    isFork: true,
    parent: { nameWithOwner: "example/skill-market" }
  }));
  process.exit(0);
}
if (args[0] === "repo" && args[1] === "fork") {
  fs.writeFileSync(process.env.GH_LOG + ".fork", "created");
  process.exit(0);
}
if (args[0] === "pr" && args[1] === "list") {
  process.stdout.write(process.env.GH_PRS || "[]");
  process.exit(0);
}
if (args[0] === "pr" && args[1] === "create") {
  process.stdout.write("https://github.com/example/skill-market/pull/17\\n");
  process.exit(0);
}
if (args[0] === "pr" && args[1] === "view") {
  process.stdout.write(JSON.stringify({
    number: 17,
    url: "https://github.com/example/skill-market/pull/17",
    state: "OPEN",
    headRefOid: process.env.GH_COMMIT
  }));
  process.exit(0);
}
process.stderr.write("unexpected fake gh command: " + args.join(" "));
process.exit(9);
`,
  );
  return {
    root,
    logPath,
    executable,
    env: { ...process.env, GH_LOG: logPath, ...overrides },
  };
}

test("GitHub host identity and strategy select direct or fork without guessing push URLs", () => {
  const baseRepository = githubRepositoryFromIdentity("github.com/example/skill-market");
  assert.equal(baseRepository, "example/skill-market");
  assert.throws(
    () => githubRepositoryFromIdentity("gitlab.com/example/skill-market"),
    (error) => error.code === "unsupported-proposal-host",
  );

  const direct = resolveSubmissionStrategy({
    pushMode: "auto",
    permission: "WRITE",
    baseRepository,
    login: "alice",
    pushUrl: "/tmp/direct.git",
    canPushDirect: (permission) => permission === "WRITE",
  });
  assert.equal(direct.strategy, "direct");
  assert.equal(direct.headOwner, "example");

  const fork = resolveSubmissionStrategy({
    pushMode: "auto",
    permission: "READ",
    baseRepository,
    login: "alice",
    fork: {
      owner: "alice",
      nameWithOwner: "alice/skill-market",
      sshUrl: "git@github.com:alice/skill-market.git",
    },
    canPushDirect: () => false,
  });
  assert.equal(fork.strategy, "fork");
  assert.equal(fork.headRepository, "alice/skill-market");

  assert.throws(
    () => resolveSubmissionStrategy({
      pushMode: "direct",
      permission: "READ",
      baseRepository,
      login: "alice",
      pushUrl: "/tmp/direct.git",
      canPushDirect: () => false,
    }),
    (error) => error.code === "direct-push-not-authorized",
  );
});

test("GitHub client blocks unauthenticated submission before repository mutation", async () => {
  const fixture = await fakeGitHubEnvironment({ GH_AUTH_FAIL: "1" });
  try {
    const github = createGitHubClient({ env: fixture.env, executable: fixture.executable });
    await assert.rejects(
      github.assertAuthenticated(),
      (error) => error.code === "github-auth-required" && error.status === "blocked",
    );
    const commands = (await readFile(fixture.logPath, "utf8")).trim().split("\n");
    assert.equal(commands.length, 1);
    assert.deepEqual(JSON.parse(commands[0]).slice(0, 2), ["auth", "status"]);
  } finally {
    await removeTempDirectory(fixture.root);
  }
});

test("GitHub client creates/verifies forks and discovers or creates exact pull requests", async () => {
  const commit = "c".repeat(40);
  const fixture = await fakeGitHubEnvironment({ GH_COMMIT: commit, GH_FORK_MISSING: "1" });
  try {
    const github = createGitHubClient({ env: fixture.env, executable: fixture.executable });
    await github.assertAuthenticated();
    assert.equal(await github.currentLogin(), "alice");
    assert.equal(await github.viewerPermission("example/skill-market"), "READ");
    const fork = await github.ensureFork({ baseRepository: "example/skill-market", login: "alice" });
    assert.equal(fork.nameWithOwner, "alice/skill-market");
    const commands = (await readFile(fixture.logPath, "utf8"))
      .trim()
      .split("\n")
      .map(JSON.parse);
    assert.ok(commands.some((args) => args[0] === "repo" && args[1] === "fork"));
    assert.equal(
      await github.findPullRequest({
        baseRepository: "example/skill-market",
        headOwner: "alice",
        branch: "market/update/codex/fixture-deadbeef",
        commit,
      }),
      null,
    );
    const created = await github.createPullRequest({
      baseRepository: "example/skill-market",
      baseRef: "main",
      headOwner: "alice",
      branch: "market/update/codex/fixture-deadbeef",
      title: "Update fixture",
      bodyPath: "/tmp/body.md",
    });
    assert.equal(created.number, 17);
    assert.equal(created.headRefOid, commit);
  } finally {
    await removeTempDirectory(fixture.root);
  }
});

test("existing PRs are idempotent only for the exact owner, branch, and commit", async () => {
  const commit = "d".repeat(40);
  const record = {
    number: 9,
    url: "https://github.com/example/skill-market/pull/9",
    state: "OPEN",
    headRefName: "market/update/codex/fixture-deadbeef",
    headRefOid: commit,
    headRepositoryOwner: { login: "alice" },
    headRepository: { nameWithOwner: "alice/skill-market" },
  };
  const fixture = await fakeGitHubEnvironment({ GH_PRS: JSON.stringify([record]) });
  try {
    const github = createGitHubClient({ env: fixture.env, executable: fixture.executable });
    const found = await github.findPullRequest({
      baseRepository: "example/skill-market",
      headOwner: "alice",
      branch: record.headRefName,
      commit,
    });
    assert.equal(found.number, 9);
    await assert.rejects(
      github.findPullRequest({
        baseRepository: "example/skill-market",
        headOwner: "alice",
        branch: record.headRefName,
        commit: "e".repeat(40),
      }),
      (error) => error.code === "pull-request-branch-collision",
    );
  } finally {
    await removeTempDirectory(fixture.root);
  }
});
