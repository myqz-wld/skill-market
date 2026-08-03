import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { SkillMarketError } from "./errors.mjs";

const execFileAsync = promisify(execFile);
const WRITE_PERMISSIONS = new Set(["ADMIN", "MAINTAIN", "WRITE"]);
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/u;

function hostError(code, message, details, nextAction, options = {}) {
  return new SkillMarketError({
    code,
    message,
    status: "blocked",
    details,
    nextAction,
    retryable: options.retryable ?? false,
    cause: options.cause,
  });
}

function commandError(args, error) {
  return hostError(
    "github-command-failed",
    `GitHub CLI failed during proposal submission: gh ${args.join(" ")}.`,
    {
      args,
      exitCode: error.code,
      stdout: error.stdout?.trim() ?? "",
      stderr: error.stderr?.trim() ?? "",
    },
    "Resolve the GitHub CLI error without changing proposal state, then retry proposal submit.",
    { retryable: true, cause: error },
  );
}

async function runGh(
  executable,
  args,
  { env, allowedExitCodes = [] } = {},
) {
  const commandEnv = {
    ...env,
    GH_PROMPT_DISABLED: "1",
    GIT_TERMINAL_PROMPT: "0",
  };
  try {
    const result = await execFileAsync(executable, args, {
      env: commandEnv,
      encoding: "utf8",
      timeout: 120000,
      maxBuffer: 8 * 1024 * 1024,
    });
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim(), exitCode: 0 };
  } catch (error) {
    if (allowedExitCodes.includes(error.code)) {
      return {
        stdout: error.stdout?.trim() ?? "",
        stderr: error.stderr?.trim() ?? "",
        exitCode: error.code,
      };
    }
    throw commandError(args, error);
  }
}

function parseJson(stdout, command) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw hostError(
      "invalid-github-output",
      `GitHub CLI returned invalid JSON for ${command}.`,
      { command, stdout },
      "Update or repair gh, then retry proposal submit without modifying the proposal state.",
      { cause: error },
    );
  }
}

export function githubRepositoryFromIdentity(identity) {
  if (typeof identity !== "string" || !identity.startsWith("github.com/")) {
    throw hostError(
      "unsupported-proposal-host",
      "Pull-request submission currently requires a github.com catalog repository.",
      { identity },
      "Use a github.com read repository or keep the proposal prepared for manual submission.",
    );
  }
  const segments = identity.slice("github.com/".length).split("/");
  if (segments.length !== 2 || segments.some((segment) => segment === "")) {
    throw hostError(
      "unsupported-proposal-host",
      "GitHub repository identity must be github.com/<owner>/<repository>.",
      { identity },
      "Configure the canonical GitHub repository and create a new proposal plan.",
    );
  }
  return `${segments[0]}/${segments[1]}`;
}

function validateLogin(value, field = "login") {
  if (typeof value !== "string" || !LOGIN.test(value)) {
    throw hostError(
      "invalid-github-output",
      `GitHub ${field} is invalid.`,
      { field, value },
      "Verify the authenticated GitHub account and retry proposal submit.",
    );
  }
  return value;
}

function normalizeRepositoryInfo(info, expectedOwner, expectedName, baseRepository) {
  const issues = [];
  if (info?.nameWithOwner !== `${expectedOwner}/${expectedName}`) issues.push("nameWithOwner mismatch");
  if (typeof info?.sshUrl !== "string" || info.sshUrl.trim() === "") issues.push("sshUrl missing");
  if (info?.isFork !== true) issues.push("repository is not a fork");
  if (info?.parent?.nameWithOwner !== baseRepository) issues.push("fork parent mismatch");
  if (issues.length > 0) {
    throw hostError(
      "fork-repository-collision",
      `Existing repository ${expectedOwner}/${expectedName} is not the expected fork.`,
      { repository: info, baseRepository, issues },
      "Choose the correct authenticated account or resolve the same-name repository collision before retrying.",
    );
  }
  return {
    nameWithOwner: info.nameWithOwner,
    sshUrl: info.sshUrl,
    owner: expectedOwner,
  };
}

function ownerLogin(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.login === "string") return value.login;
  return null;
}

function normalizePullRequest(value) {
  if (
    !value ||
    !Number.isInteger(value.number) ||
    typeof value.url !== "string" ||
    typeof value.state !== "string"
  ) {
    throw hostError(
      "invalid-github-output",
      "GitHub CLI returned an invalid pull-request record.",
      { value },
      "Update or repair gh, then retry proposal submit.",
    );
  }
  return {
    number: value.number,
    url: value.url,
    state: value.state.toLowerCase(),
    headRefOid: value.headRefOid ?? null,
  };
}

export function createGitHubClient({ env = process.env, executable = "gh" } = {}) {
  async function repositoryInfo(repository, { allowMissing = false } = {}) {
    const result = await runGh(
      executable,
      [
        "repo",
        "view",
        repository,
        "--json",
        "nameWithOwner,sshUrl,isFork,parent",
      ],
      { env, allowedExitCodes: allowMissing ? [1] : [] },
    );
    return result.exitCode === 1 ? null : parseJson(result.stdout, "repo view");
  }

  return Object.freeze({
    async assertAuthenticated() {
      const result = await runGh(
        executable,
        ["auth", "status", "--hostname", "github.com"],
        { env, allowedExitCodes: [1, 4] },
      );
      if (result.exitCode !== 0) {
        throw hostError(
          "github-auth-required",
          "GitHub CLI is not authenticated for github.com.",
          { stderr: result.stderr },
          "Run gh auth login, verify the intended account, then retry proposal submit.",
          { retryable: true },
        );
      }
    },
    async currentLogin() {
      const result = await runGh(executable, ["api", "user", "--jq", ".login"], { env });
      return validateLogin(result.stdout, "login");
    },
    async viewerPermission(repository) {
      const result = await runGh(
        executable,
        ["repo", "view", repository, "--json", "viewerPermission", "--jq", ".viewerPermission"],
        { env },
      );
      return result.stdout.toUpperCase();
    },
    canPushDirect(permission) {
      return WRITE_PERMISSIONS.has(String(permission).toUpperCase());
    },
    async ensureFork({ baseRepository, login }) {
      validateLogin(login);
      const [, repositoryName] = baseRepository.split("/");
      const forkRepository = `${login}/${repositoryName}`;
      let info = await repositoryInfo(forkRepository, { allowMissing: true });
      if (!info) {
        await runGh(
          executable,
          ["repo", "fork", baseRepository, "--clone=false", "--remote=false"],
          { env },
        );
        info = await repositoryInfo(forkRepository);
      }
      return normalizeRepositoryInfo(info, login, repositoryName, baseRepository);
    },
    async findPullRequest({ baseRepository, headOwner, branch, commit }) {
      validateLogin(headOwner, "head owner");
      const result = await runGh(
        executable,
        [
          "pr",
          "list",
          "--repo",
          baseRepository,
          "--head",
          branch,
          "--state",
          "all",
          "--limit",
          "100",
          "--json",
          "number,url,state,headRefName,headRefOid,headRepositoryOwner,headRepository",
        ],
        { env },
      );
      const records = parseJson(result.stdout, "pr list");
      if (!Array.isArray(records)) {
        throw hostError(
          "invalid-github-output",
          "GitHub CLI pull-request listing must return an array.",
          { records },
          "Update or repair gh, then retry proposal submit.",
        );
      }
      const candidates = records.filter((record) => {
        const owner = ownerLogin(record.headRepositoryOwner) ??
          record.headRepository?.nameWithOwner?.split("/")[0] ?? null;
        return record.headRefName === branch && owner?.toLowerCase() === headOwner.toLowerCase();
      });
      const exact = candidates.filter((record) => record.headRefOid === commit);
      if (exact.length > 1 || (exact.length === 0 && candidates.length > 0)) {
        throw hostError(
          "pull-request-branch-collision",
          "An existing pull request uses the proposal head but does not identify the exact prepared commit.",
          { baseRepository, headOwner, branch, commit, candidates },
          "Inspect the existing pull request and remote branch; do not overwrite either automatically.",
        );
      }
      return exact.length === 1 ? normalizePullRequest(exact[0]) : null;
    },
    async createPullRequest({
      baseRepository,
      baseRef,
      headOwner,
      branch,
      title,
      bodyPath,
      draft = false,
    }) {
      const args = [
        "pr",
        "create",
        "--repo",
        baseRepository,
        "--base",
        baseRef,
        "--head",
        `${headOwner}:${branch}`,
        "--title",
        title,
        "--body-file",
        bodyPath,
      ];
      if (draft) args.push("--draft");
      const created = await runGh(executable, args, { env });
      const url = created.stdout.split(/\r?\n/u).at(-1);
      if (!/^https:\/\/github\.com\//u.test(url ?? "")) {
        throw hostError(
          "invalid-github-output",
          "GitHub CLI did not return the created pull-request URL.",
          { stdout: created.stdout },
          "Inspect GitHub for a possibly-created PR before retrying; proposal submit will search idempotently first.",
        );
      }
      const viewed = await runGh(
        executable,
        ["pr", "view", url, "--repo", baseRepository, "--json", "number,url,state,headRefOid"],
        { env },
      );
      return normalizePullRequest(parseJson(viewed.stdout, "pr view"));
    },
  });
}

export function resolveSubmissionStrategy({
  pushMode,
  permission,
  baseRepository,
  login,
  pushUrl,
  forkPushUrl,
  headOwner,
  fork,
  canPushDirect,
}) {
  const mode = pushMode ?? "auto";
  if (!["auto", "direct", "fork"].includes(mode)) {
    throw hostError(
      "invalid-submit-strategy",
      "pushMode must be auto, direct, or fork.",
      { pushMode },
      "Choose one documented proposal submit strategy.",
    );
  }
  const [baseOwner] = baseRepository.split("/");
  const directAllowed = canPushDirect(permission);
  const selected = mode === "auto" ? (directAllowed ? "direct" : "fork") : mode;
  if (selected === "direct") {
    if (!directAllowed) {
      throw hostError(
        "direct-push-not-authorized",
        "The authenticated GitHub account does not have direct write permission for the base repository.",
        { baseRepository, permission },
        "Retry with --push-mode fork or obtain repository write permission.",
      );
    }
    if (!pushUrl) {
      throw hostError(
        "push-target-required",
        "Direct proposal submission requires an explicit --push-url.",
        { baseRepository },
        "Set the separately-configured credential-free push URL and retry proposal submit.",
      );
    }
    return {
      strategy: "direct",
      pushTarget: pushUrl,
      headOwner: baseOwner,
      headRepository: baseRepository,
    };
  }
  const resolvedOwner = headOwner ?? login;
  validateLogin(resolvedOwner, "head owner");
  if (forkPushUrl) {
    return {
      strategy: "fork",
      pushTarget: forkPushUrl,
      headOwner: resolvedOwner,
      headRepository: `${resolvedOwner}/${baseRepository.split("/")[1]}`,
    };
  }
  if (!fork) {
    throw hostError(
      "fork-target-required",
      "Fork submission could not resolve a verified fork push target.",
      { baseRepository, resolvedOwner },
      "Allow the CLI to create/verify the fork or provide --fork-push-url and --head-owner.",
    );
  }
  return {
    strategy: "fork",
    pushTarget: fork.sshUrl,
    headOwner: fork.owner,
    headRepository: fork.nameWithOwner,
  };
}
