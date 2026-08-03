import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { SkillMarketError } from "./errors.mjs";

const execFileAsync = promisify(execFile);

async function runGit(args, { env = process.env } = {}) {
  try {
    const result = await execFileAsync("git", args, {
      env,
      encoding: "utf8",
      timeout: 60000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
  } catch (error) {
    throw new SkillMarketError({
      code: "git-command-failed",
      message: `Git command failed during cache synchronization: git ${args.join(" ")}.`,
      retryable: true,
      details: {
        args,
        exitCode: error.code,
        stdout: error.stdout?.trim() ?? "",
        stderr: error.stderr?.trim() ?? "",
      },
      nextAction: "Check repository access and Git authentication, then retry.",
      cause: error,
    });
  }
}

export function createGitClient({ env = process.env } = {}) {
  return Object.freeze({
    async clone({ repoUrl, baseRef, destination }) {
      await runGit(
        ["clone", "--depth", "1", "--single-branch", "--branch", baseRef, repoUrl, destination],
        { env },
      );
    },
    async remoteUrl(root) {
      return (await runGit(["-C", root, "remote", "get-url", "origin"], { env })).stdout;
    },
    async refresh({ root, baseRef }) {
      await runGit(["-C", root, "fetch", "--depth", "1", "origin", baseRef], { env });
      await runGit(["-C", root, "checkout", "--detach", "FETCH_HEAD"], { env });
    },
    async head(root) {
      return (await runGit(["-C", root, "rev-parse", "HEAD"], { env })).stdout;
    },
  });
}
