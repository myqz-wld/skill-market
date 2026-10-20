import path from "node:path";

import { SkillMarketError } from "./errors.mjs";

const SAFE_REF = /^(?!-)(?!.*(?:\.\.|@\{|\\|\s))[A-Za-z0-9][A-Za-z0-9._/-]*$/u;

export function validateGitRef(value, field = "baseRef") {
  if (typeof value !== "string" || !SAFE_REF.test(value)) {
    throw new SkillMarketError({
      code: "invalid-git-ref",
      message: `${field} must be a safe, non-empty Git ref.`,
      details: { field, value },
      nextAction: `Set ${field} to a branch, tag, or immutable ref that does not begin with '-'.`,
    });
  }
  return value;
}

export function validateReadRepoUrl(value, field = "readRepoUrl") {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new SkillMarketError({
      code: "invalid-repository-url",
      message: `${field} must be an absolute HTTPS Git URL.`,
      details: { field, value },
      nextAction: `Set ${field} to an HTTPS repository URL and use repoPath for a local checkout.`,
    });
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new SkillMarketError({
      code: "invalid-repository-url",
      message: `${field} must use HTTPS without embedded credentials.`,
      details: { field, value },
      nextAction: `Set ${field} to an HTTPS repository URL without credentials.`,
    });
  }
  return url.toString();
}

export function canonicalRepositoryIdentity(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    const scp = /^(?:[^@\s]+@)?([^:\s]+):(.+)$/u.exec(value);
    if (!scp) {
      throw new SkillMarketError({
        code: "invalid-repository-url",
        message: "Repository identity requires an HTTPS, SSH, or scp-style Git URL.",
        details: { value },
        nextAction: "Configure a canonical Git repository URL before retrying.",
      });
    }
    return `${scp[1].toLowerCase()}/${normalizeRepoPath(scp[2])}`;
  }
  if (!["https:", "ssh:"].includes(url.protocol)) {
    throw new SkillMarketError({
      code: "invalid-repository-url",
      message: "Repository identity supports only HTTPS and SSH transport URLs.",
      details: { value, protocol: url.protocol },
      nextAction: "Use an HTTPS read URL or an SSH push URL.",
    });
  }
  return `${url.hostname.toLowerCase()}/${normalizeRepoPath(url.pathname)}`;
}

function normalizeRepoPath(value) {
  const normalized = value.replace(/^\/+|\/+$/gu, "").replace(/\.git$/u, "");
  if (!normalized || normalized.split("/").some((segment) => segment === "..")) {
    throw new SkillMarketError({
      code: "invalid-repository-url",
      message: "Repository URL must identify a non-empty repository path.",
      details: { value },
      nextAction: "Configure a repository URL containing its owner and repository name.",
    });
  }
  return normalized;
}

export function localRepositoryIdentity(repoPath) {
  if (!path.isAbsolute(repoPath)) {
    throw new SkillMarketError({
      code: "invalid-path",
      message: "repoPath must be absolute before deriving local source identity.",
      details: { repoPath },
      nextAction: "Resolve repoPath against HOME before retrying.",
    });
  }
  return `local:${path.normalize(repoPath)}`;
}
