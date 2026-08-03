import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";

import { SkillMarketError } from "./errors.mjs";
import { validateGitRef } from "./source-identity.mjs";

const execFileAsync = promisify(execFile);
const COMMIT = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/u;

function sanitizedArgs(args) {
  return args.map((arg, index) => {
    const previous = args[index - 1];
    if (["push", "ls-remote"].includes(previous)) return "<push-target>";
    if (/^https?:\/\//u.test(arg)) {
      try {
        const url = new URL(arg);
        return `${url.protocol}//${url.host}${url.pathname}`;
      } catch {
        return "<repository-url>";
      }
    }
    return arg;
  });
}

function gitError(args, error) {
  return new SkillMarketError({
    code: "proposal-git-failed",
    message: `Git failed during proposal processing: git ${sanitizedArgs(args).join(" ")}.`,
    retryable: true,
    details: {
      args: sanitizedArgs(args),
      exitCode: error.code,
      stdout: Buffer.isBuffer(error.stdout) ? error.stdout.toString("utf8").trim() : error.stdout?.trim() ?? "",
      stderr: Buffer.isBuffer(error.stderr) ? error.stderr.toString("utf8").trim() : error.stderr?.trim() ?? "",
    },
    nextAction: "Resolve the reported Git repository, worktree, branch, or authentication issue, then retry the same proposal command.",
    cause: error,
  });
}

async function runGit(
  args,
  { env, encoding = "utf8", allowedExitCodes = [], trim = true } = {},
) {
  try {
    const result = await execFileAsync("git", args, {
      env,
      encoding,
      timeout: 120000,
      maxBuffer: 64 * 1024 * 1024,
    });
    return {
      stdout: encoding === null || !trim ? result.stdout : result.stdout.trim(),
      stderr: encoding === null || !trim ? result.stderr : result.stderr.trim(),
      exitCode: 0,
    };
  } catch (error) {
    if (allowedExitCodes.includes(error.code)) {
      return {
        stdout: encoding === null || !trim ? error.stdout : error.stdout?.trim() ?? "",
        stderr: encoding === null || !trim ? error.stderr : error.stderr?.trim() ?? "",
        exitCode: error.code,
      };
    }
    throw gitError(args, error);
  }
}

function assertCommit(value, field = "commit") {
  if (typeof value !== "string" || !COMMIT.test(value)) {
    throw new SkillMarketError({
      code: "invalid-proposal-commit",
      message: `${field} must be a full lowercase Git commit id.`,
      status: "blocked",
      details: { field, value },
      nextAction: "Recreate the proposal from a verified Git repository state.",
    });
  }
  return value;
}

function validatePushTarget(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SkillMarketError({
      code: "push-target-required",
      message: "Proposal submission requires an explicit push target.",
      status: "blocked",
      details: { value },
      nextAction: "Configure --push-url for direct submission or --fork-push-url for fork submission.",
    });
  }
  if (path.isAbsolute(value)) return path.normalize(value);
  if (!value.includes("://") && /^(?:[^@\s]+@)?[^:\s]+:.+$/u.test(value)) return value;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new SkillMarketError({
      code: "invalid-push-target",
      message: "Push target must be an absolute local path or an HTTPS, SSH, or scp-style Git URL.",
      status: "blocked",
      details: { value },
      nextAction: "Set a credential-free canonical Git push target and retry submission.",
    });
  }
  if (!["https:", "ssh:", "file:"].includes(url.protocol) || url.username || url.password) {
    throw new SkillMarketError({
      code: "invalid-push-target",
      message: "Push target must use HTTPS, SSH, or file transport without embedded credentials.",
      status: "blocked",
      details: { protocol: url.protocol, embeddedCredentials: Boolean(url.username || url.password) },
      nextAction: "Use the Git credential helper or SSH agent instead of embedding credentials in the push target.",
    });
  }
  return value;
}

function parseNullList(value) {
  return value.split("\0").filter(Boolean);
}

export function digestBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function createProposalGitClient({ env = process.env } = {}) {
  return Object.freeze({
    async topLevel(root) {
      return (await runGit(["-C", root, "rev-parse", "--show-toplevel"], { env })).stdout;
    },
    async head(root) {
      return assertCommit((await runGit(["-C", root, "rev-parse", "HEAD"], { env })).stdout, "HEAD");
    },
    async resolveRef(root, ref) {
      validateGitRef(ref, "ref");
      return assertCommit(
        (await runGit(["-C", root, "rev-parse", "--verify", `${ref}^{commit}`], { env })).stdout,
        ref,
      );
    },
    async status(root) {
      return (await runGit(
        ["-C", root, "status", "--porcelain=v1", "--untracked-files=all"],
        { env },
      )).stdout;
    },
    async cloneBare({ sourceRoot, destination }) {
      await runGit(["clone", "--bare", "--no-hardlinks", sourceRoot, destination], { env });
    },
    async createWorktree({ barePath, destination, branch, commit }) {
      validateGitRef(branch, "branch");
      assertCommit(commit);
      await runGit(
        ["--git-dir", barePath, "worktree", "add", "-b", branch, destination, commit],
        { env },
      );
    },
    async removeWorktree({ barePath, destination, force = false }) {
      const args = ["--git-dir", barePath, "worktree", "remove"];
      if (force) args.push("--force");
      args.push(destination);
      await runGit(args, { env });
      await runGit(["--git-dir", barePath, "worktree", "prune"], { env });
    },
    async changedPaths(root, baseCommit) {
      assertCommit(baseCommit, "baseCommit");
      const [tracked, untracked, ignored] = await Promise.all([
        runGit(["-C", root, "diff", "--name-only", "-z", baseCommit, "--"], {
          env,
          trim: false,
        }),
        runGit(["-C", root, "ls-files", "--others", "--exclude-standard", "-z"], {
          env,
          trim: false,
        }),
        runGit(
          ["-C", root, "ls-files", "--others", "--ignored", "--exclude-standard", "-z"],
          { env, trim: false },
        ),
      ]);
      return [
        ...new Set([
          ...parseNullList(tracked.stdout),
          ...parseNullList(untracked.stdout),
          ...parseNullList(ignored.stdout),
        ]),
      ]
        .sort((left, right) => left.localeCompare(right));
    },
    async diffCheck(root, baseCommit) {
      assertCommit(baseCommit, "baseCommit");
      await runGit(["-C", root, "diff", "--check", baseCommit, "--"], { env });
    },
    async stage(root, relativePaths) {
      if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
        throw new TypeError("stage requires at least one repository-relative path");
      }
      await runGit(["-C", root, "add", "--all", "--force", "--", ...relativePaths], { env });
    },
    async commit(root, { message, authorName = "Skill Market Proposal", authorEmail = "skill-market@localhost" }) {
      await runGit(
        [
          "-C",
          root,
          "-c",
          `user.name=${authorName}`,
          "-c",
          `user.email=${authorEmail}`,
          "commit",
          "--no-gpg-sign",
          "--no-verify",
          "-m",
          message,
        ],
        { env },
      );
      return assertCommit(
        (await runGit(["-C", root, "rev-parse", "HEAD"], { env })).stdout,
        "HEAD",
      );
    },
    async tree(root, commit = "HEAD") {
      const value = commit === "HEAD" ? "HEAD" : assertCommit(commit);
      return (await runGit(["-C", root, "rev-parse", `${value}^{tree}`], { env })).stdout;
    },
    async diffBytes(root, baseCommit, preparedCommit) {
      assertCommit(baseCommit, "baseCommit");
      assertCommit(preparedCommit, "preparedCommit");
      return (await runGit(
        ["-C", root, "diff", "--binary", "--full-index", baseCommit, preparedCommit, "--"],
        { env, encoding: null },
      )).stdout;
    },
    async remoteBranchHead(pushTarget, branch) {
      const target = validatePushTarget(pushTarget);
      validateGitRef(branch, "branch");
      const result = await runGit(
        ["ls-remote", "--exit-code", "--heads", target, `refs/heads/${branch}`],
        { env, allowedExitCodes: [2] },
      );
      if (result.exitCode === 2 || result.stdout === "") return null;
      const [commit] = result.stdout.split(/\s+/u);
      return assertCommit(commit, "remote branch commit");
    },
    async push({ root, pushTarget, branch }) {
      const target = validatePushTarget(pushTarget);
      validateGitRef(branch, "branch");
      await runGit(
        ["-C", root, "push", "--porcelain", "--no-verify", target, `HEAD:refs/heads/${branch}`],
        { env },
      );
    },
  });
}

export { validatePushTarget };
