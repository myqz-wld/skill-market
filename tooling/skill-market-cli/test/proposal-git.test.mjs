import assert from "node:assert/strict";
import { mkdir, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  createProposalGitClient,
  digestBytes,
  validatePushTarget,
} from "../src/proposal-git.mjs";
import {
  createBareRemote,
  createProposalRepository,
  fixtureGit,
} from "./helpers/proposal-fixture.mjs";
import { removeTempDirectory } from "./helpers/temp-env.mjs";

test("proposal Git client creates an isolated branch worktree and hashes its exact diff", async () => {
  const fixture = await createProposalRepository();
  const git = createProposalGitClient();
  const proposalRoot = path.join(fixture.container, "proposal");
  const barePath = path.join(proposalRoot, "repository.git");
  const worktreePath = path.join(proposalRoot, "worktree");
  try {
    await mkdir(proposalRoot);
    assert.equal(await git.topLevel(fixture.root), await realpath(fixture.root));
    assert.equal(await git.resolveRef(fixture.root, "main"), fixture.head);
    await git.cloneBare({ sourceRoot: fixture.root, destination: barePath });
    await git.createWorktree({
      barePath,
      destination: worktreePath,
      branch: "market/update/codex/fixture-skill-deadbeef",
      commit: fixture.head,
    });
    const changed = "updated fixture\n";
    const packageRoot = path.join(worktreePath, "skills", "codex", "fixture-skill");
    await writeFile(
      path.join(packageRoot, "SKILL.md"),
      changed,
      "utf8",
    );
    await writeFile(path.join(packageRoot, ".gitignore"), "generated.txt\n", "utf8");
    await writeFile(path.join(packageRoot, "generated.txt"), "must be proposed\n", "utf8");
    assert.deepEqual(await git.changedPaths(worktreePath, fixture.head), [
      "skills/codex/fixture-skill/.gitignore",
      "skills/codex/fixture-skill/generated.txt",
      "skills/codex/fixture-skill/SKILL.md",
    ]);
    await git.diffCheck(worktreePath, fixture.head);
    await git.stage(worktreePath, ["skills/codex/fixture-skill"]);
    const prepared = await git.commit(worktreePath, { message: "market: update fixture" });
    assert.equal(
      await fixtureGit(["show", "HEAD:skills/codex/fixture-skill/generated.txt"], {
        cwd: worktreePath,
      }),
      "must be proposed",
    );
    const diff = await git.diffBytes(worktreePath, fixture.head, prepared);
    assert.ok(Buffer.isBuffer(diff));
    assert.match(digestBytes(diff), /^[0-9a-f]{64}$/u);
    assert.equal(await git.status(worktreePath), "");
    await git.removeWorktree({ barePath, destination: worktreePath });
    await assert.rejects(rm(worktreePath), { code: "ENOENT" });
  } finally {
    await removeTempDirectory(fixture.container);
  }
});

test("proposal Git pushes only when a remote branch is absent or already exact", async () => {
  const fixture = await createProposalRepository();
  const git = createProposalGitClient();
  const proposalRoot = path.join(fixture.container, "proposal");
  const barePath = path.join(proposalRoot, "repository.git");
  const worktreePath = path.join(proposalRoot, "worktree");
  const remote = await createBareRemote(fixture.container);
  const branch = "market/retire/codex/fixture-skill-deadbeef";
  try {
    await mkdir(proposalRoot);
    await git.cloneBare({ sourceRoot: fixture.root, destination: barePath });
    await git.createWorktree({ barePath, destination: worktreePath, branch, commit: fixture.head });
    await writeFile(path.join(worktreePath, "proposal.txt"), "fixture\n", "utf8");
    await git.stage(worktreePath, ["proposal.txt"]);
    const prepared = await git.commit(worktreePath, { message: "market: fixture" });
    assert.equal(await git.remoteBranchHead(remote, branch), null);
    await git.push({ root: worktreePath, pushTarget: remote, branch });
    assert.equal(await git.remoteBranchHead(remote, branch), prepared);
  } finally {
    await removeTempDirectory(fixture.container);
  }
});

test("proposal Git rejects embedded push credentials before execution", () => {
  assert.throws(
    () => validatePushTarget("https://token:secret@github.com/example/repo.git"),
    (error) => error.code === "invalid-push-target",
  );
  assert.equal(validatePushTarget("git@github.com:example/repo.git"), "git@github.com:example/repo.git");
});
