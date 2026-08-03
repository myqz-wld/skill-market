import { realpath } from "node:fs/promises";
import path from "node:path";

import { SkillMarketError } from "./errors.mjs";
import { createGitClient } from "./git-client.mjs";
import { executeNative } from "./native-exec.mjs";
import { canonicalRepositoryIdentity } from "./source-identity.mjs";

function marketplaceCommand(adapter) {
  return [adapter, ["plugin", "marketplace", "list", "--json"]];
}

function parseMarketplacePayload(adapter, raw) {
  let payload;
  try {
    payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    throw marketplaceError(adapter, "output is not valid JSON", error);
  }
  const entries = adapter === "codex" ? payload?.marketplaces : payload;
  if (!Array.isArray(entries)) {
    throw marketplaceError(adapter, "output is not an array of marketplace records");
  }
  return entries;
}

function marketplaceError(adapter, issue, cause) {
  return new SkillMarketError({
    code: "invalid-native-output",
    message: `${adapter} marketplace list returned an unsupported JSON shape: ${issue}.`,
    status: "blocked",
    details: { adapter, issue },
    nextAction: `Check the installed ${adapter} CLI version and update its marketplace parser fixture.`,
    cause,
  });
}

function marketplaceSource(adapter, entry) {
  if (adapter === "codex") {
    return entry.marketplaceSource?.source ?? entry.root ?? null;
  }
  if (adapter === "claude") {
    if (entry.path) return entry.path;
    if (entry.repo) return `https://github.com/${entry.repo}.git`;
    return entry.url ?? null;
  }
  return entry.source?.url ?? entry.path ?? null;
}

async function identityForSource(source, git) {
  if (typeof source !== "string" || source.trim() === "") return null;
  if (path.isAbsolute(source)) {
    let localPath = path.normalize(source);
    try {
      localPath = await realpath(source);
    } catch {
      return { localPath, repoIdentity: null, unavailable: true };
    }
    let repoIdentity = null;
    try {
      repoIdentity = canonicalRepositoryIdentity(await git.remoteUrl(localPath));
    } catch {
      // A local native marketplace may be a generated directory rather than a Git checkout.
    }
    return { localPath, repoIdentity };
  }
  try {
    return { localPath: null, repoIdentity: canonicalRepositoryIdentity(source) };
  } catch {
    return { localPath: null, repoIdentity: null, invalidSource: source };
  }
}

async function sourceExpectation({ snapshot, repository, entry = null, git }) {
  if (snapshot?.source.mode === "local") {
    const localPath = await realpath(snapshot.root);
    let repoIdentity = null;
    try {
      repoIdentity = canonicalRepositoryIdentity(await git.remoteUrl(localPath));
    } catch {
      // Exact local path equality remains a valid explicit development source identity.
    }
    return {
      localPath,
      packagePath: entry?.path ? await realpath(path.join(snapshot.root, entry.path)) : null,
      repoIdentity,
    };
  }
  if (snapshot) {
    return {
      localPath: null,
      packagePath: entry?.path ? await realpath(path.join(snapshot.root, entry.path)) : null,
      repoIdentity: snapshot.source.repoIdentity,
    };
  }
  if (!repository) {
    throw new SkillMarketError({
      code: "source-expectation-missing",
      message: "Native mutation is missing its effective Skill Market source expectation.",
      status: "blocked",
      nextAction: "Load the effective Skill Market configuration and retry the operation.",
    });
  }
  let localPath = null;
  if (repository.repoPath) {
    try {
      localPath = await realpath(repository.repoPath);
    } catch {
      localPath = path.normalize(repository.repoPath);
    }
  }
  const packageRoot = localPath ?? repository.cachePath ?? null;
  let packagePath = entry?.path && packageRoot
    ? path.join(packageRoot, entry.path)
    : null;
  if (packagePath) {
    try {
      packagePath = await realpath(packagePath);
    } catch {
      packagePath = path.normalize(packagePath);
    }
  }
  return {
    localPath,
    packagePath,
    repoIdentity: canonicalRepositoryIdentity(repository.readRepoUrl),
  };
}

function sourcesMatch(expected, actual) {
  return Boolean(
    (expected.repoIdentity && actual.repoIdentity === expected.repoIdentity) ||
      (expected.localPath && actual.localPath === expected.localPath) ||
      (expected.packagePath && actual.localPath === expected.packagePath),
  );
}

export async function verifyNativeMarketplace({
  adapter,
  snapshot = null,
  repository = null,
  marketplaceName = "skill-market",
  execute = executeNative,
  git = createGitClient(),
  env = process.env,
}) {
  const [command, args] = marketplaceCommand(adapter);
  const entries = parseMarketplacePayload(adapter, await execute(command, args, env));
  const entry = entries.find((candidate) => candidate.name === marketplaceName);
  if (!entry) {
    throw new SkillMarketError({
      code: "native-marketplace-missing",
      message: `${adapter} marketplace ${marketplaceName} is not configured.`,
      status: "blocked",
      details: { adapter, marketplaceName },
      nextAction: `Register the verified Skill Market repository with ${adapter}, then retry.`,
    });
  }
  const source = marketplaceSource(adapter, entry);
  const [expected, actual] = await Promise.all([
    sourceExpectation({ snapshot, repository, git }),
    identityForSource(source, git),
  ]);
  if (!actual || !sourcesMatch(expected, actual)) {
    throw new SkillMarketError({
      code: "native-marketplace-source-mismatch",
      message: `${adapter} marketplace ${marketplaceName} does not match the loaded catalog source.`,
      status: "blocked",
      details: { adapter, marketplaceName, source, expected, actual },
      nextAction: "Register the intended repository under a distinct marketplace name or correct this marketplace source.",
    });
  }
  return { entry, source, identity: actual };
}

export async function verifyGrokInstalledSource({
  entry,
  installed,
  snapshot,
  repository,
  git,
  confirmSourceChange,
}) {
  const rawSource = installed.native.source;
  const source =
    typeof rawSource === "string"
      ? rawSource
      : rawSource?.url ?? rawSource?.path ?? rawSource?.source ?? null;
  let matches = false;
  let expected = null;
  if (source) {
    const resolved = await Promise.all([
      sourceExpectation({ snapshot, repository, entry, git }),
      identityForSource(source, git),
    ]);
    [expected] = resolved;
    const actual = resolved[1];
    matches = Boolean(actual && sourcesMatch(expected, actual));
  }
  if (!matches && !confirmSourceChange) {
    throw new SkillMarketError({
      code: "native-source-confirmation",
      message: "Installed Grok plugin source is missing or differs from the loaded catalog source.",
      status: "needs_confirmation",
      details: {
        installedSource: rawSource ?? null,
        expectedSource: expected,
        catalogSource: snapshot?.source ?? null,
      },
      nextAction: "Verify the installed plugin provenance, then retry with --confirm-source-change.",
    });
  }
}
