import { lstat, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { SkillMarketError } from "./errors.mjs";
import { atomicWriteJson } from "./fs-utils.mjs";
import { withFileLock } from "./lock.mjs";
import { resolveStatePaths } from "./paths.mjs";
import {
  PROPOSAL_STATUSES,
  assertProposalId,
  canonicalDigest,
} from "./proposal-contracts.mjs";

const DIGEST = /^[0-9a-f]{64}$/u;
const COMMIT = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/u;

function stateError(code, message, details, nextAction) {
  return new SkillMarketError({
    code,
    message,
    status: "blocked",
    details,
    nextAction,
  });
}

async function metadataIfExists(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function assertDirectoryChain(root, target) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw stateError(
      "unsafe-proposal-path",
      "Proposal storage must stay below the configured Skill Market home.",
      { root, target },
      "Set SKILL_MARKET_HOME to a safe user-owned directory and retry.",
    );
  }
  let current = root;
  const segments = relative === "" ? [] : relative.split(path.sep);
  for (let index = -1; index < segments.length; index += 1) {
    if (index >= 0) current = path.join(current, segments[index]);
    const metadata = await metadataIfExists(current);
    if (!metadata) break;
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
      throw stateError(
        "unsafe-proposal-path",
        `Proposal storage has unsafe topology at ${current}.`,
        { root, target, current },
        "Replace symbolic-link or non-directory ancestors with real directories and retry.",
      );
    }
  }
}

async function assertNearestExistingDirectory(target) {
  let current = target;
  while (true) {
    const metadata = await metadataIfExists(current);
    if (metadata) {
      if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
        throw stateError(
          "unsafe-proposal-path",
          `Nearest existing proposal-state ancestor is unsafe at ${current}.`,
          { target, current },
          "Use a real directory path without symbolic-link or file ancestors.",
        );
      }
      return;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw stateError(
        "unsafe-proposal-path",
        "Proposal state has no usable existing directory ancestor.",
        { target },
        "Set SKILL_MARKET_HOME to an exact user-owned directory below the filesystem root.",
      );
    }
    current = parent;
  }
}

export function resolveProposalPaths(env, id) {
  assertProposalId(id);
  const statePaths = resolveStatePaths(env);
  const proposalDir = path.join(statePaths.proposalsRoot, id);
  return Object.freeze({
    ...statePaths,
    proposalDir,
    statePath: path.join(proposalDir, "proposal.json"),
    barePath: path.join(proposalDir, "repository.git"),
    worktreePath: path.join(proposalDir, "worktree"),
    bodyPath: path.join(proposalDir, "pull-request.md"),
    lockPath: path.join(statePaths.locksRoot, `${id}.lock`),
  });
}

export async function assertProposalTopology(paths) {
  if (
    path.normalize(paths.home) === path.parse(path.normalize(paths.home)).root ||
    path.normalize(paths.marketHome) === path.parse(path.normalize(paths.marketHome)).root
  ) {
    throw stateError(
      "unsafe-proposal-path",
      "Proposal HOME and Skill Market home must both be below the filesystem root.",
      { home: paths.home, marketHome: paths.marketHome },
      "Set HOME and SKILL_MARKET_HOME to exact user-owned directories before retrying.",
    );
  }
  const homeMetadata = await metadataIfExists(paths.home);
  if (!homeMetadata || homeMetadata.isSymbolicLink() || !homeMetadata.isDirectory()) {
    throw stateError(
      "unsafe-proposal-path",
      "Proposal operations require HOME to be a real existing directory.",
      { home: paths.home },
      "Set HOME to the intended real user profile directory and retry.",
    );
  }
  const relativeMarketHome = path.relative(paths.home, paths.marketHome);
  if (!relativeMarketHome.startsWith("..") && !path.isAbsolute(relativeMarketHome)) {
    await assertDirectoryChain(paths.home, paths.marketHome);
  } else {
    await assertNearestExistingDirectory(paths.marketHome);
  }
  await assertDirectoryChain(paths.marketHome, paths.proposalsRoot);
  await assertDirectoryChain(paths.proposalsRoot, paths.proposalDir);
  await assertDirectoryChain(paths.marketHome, paths.locksRoot);
  const managedEntries = [
    [paths.statePath, "file"],
    [paths.bodyPath, "file"],
    [paths.barePath, "directory"],
    [paths.worktreePath, "directory"],
  ];
  for (const [target, kind] of managedEntries) {
    const metadata = await metadataIfExists(target);
    if (
      metadata &&
      (metadata.isSymbolicLink() ||
        (kind === "file" ? !metadata.isFile() : !metadata.isDirectory()))
    ) {
      throw stateError(
        "unsafe-proposal-path",
        `Managed proposal ${kind} has unsafe topology at ${target}.`,
        { target, kind },
        "Restore the canonical real file/directory topology before retrying proposal operations.",
      );
    }
  }
}

function withoutIntegrity(state) {
  const { integrityHash: _integrityHash, ...payload } = state;
  return payload;
}

export function sealProposalState(state) {
  const payload = withoutIntegrity(state);
  return Object.freeze({
    ...payload,
    integrityHash: canonicalDigest(payload),
  });
}

function assertExactWorkspacePaths(state, paths) {
  if (!state.workspace) return;
  const expected = {
    barePath: paths.barePath,
    worktreePath: paths.worktreePath,
    bodyPath: paths.bodyPath,
  };
  for (const [field, expectedPath] of Object.entries(expected)) {
    if (path.normalize(state.workspace[field]) !== path.normalize(expectedPath)) {
      throw stateError(
        "unsafe-proposal-state",
        `Proposal workspace ${field} does not match its canonical managed path.`,
        { id: state.id, field, recorded: state.workspace[field], expected: expectedPath },
        "Restore proposal.json from a trusted backup or abort this proposal manually.",
      );
    }
  }
}

export function validateProposalState(state, { id, paths }) {
  const issues = [];
  if (state === null || typeof state !== "object" || Array.isArray(state)) {
    issues.push("state must be an object");
  } else {
    if (state.schemaVersion !== 1) issues.push("schemaVersion must equal 1");
    if (state.id !== id) issues.push(`id must equal ${id}`);
    if (!Number.isInteger(state.revision) || state.revision < 1) issues.push("revision must be positive");
    if (!PROPOSAL_STATUSES.includes(state.status)) issues.push("status is invalid");
    if (!DIGEST.test(state.planHash ?? "")) issues.push("planHash must be a sha256 digest");
    if (!COMMIT.test(state.source?.baseCommit ?? "")) issues.push("source.baseCommit is invalid");
    if (!DIGEST.test(state.source?.catalogDigest ?? "")) issues.push("source.catalogDigest is invalid");
    if (!Array.isArray(state.spec?.targets) || state.spec.targets.length === 0) {
      issues.push("spec.targets must be a non-empty array");
    }
    if (!Array.isArray(state.history) || state.history.length === 0) {
      issues.push("history must be a non-empty array");
    }
    if (!DIGEST.test(state.integrityHash ?? "")) issues.push("integrityHash must be a sha256 digest");
  }
  if (issues.length > 0) {
    throw stateError(
      "invalid-proposal-state",
      `Proposal state is invalid: ${issues.join("; ")}.`,
      { id, statePath: paths.statePath, issues },
      "Restore proposal.json from a trusted backup or create a new proposal plan.",
    );
  }
  const expectedIntegrity = canonicalDigest(withoutIntegrity(state));
  if (state.integrityHash !== expectedIntegrity) {
    throw stateError(
      "proposal-state-integrity-mismatch",
      "Proposal state was modified outside the Skill Market CLI.",
      { id, statePath: paths.statePath, expectedIntegrity, actualIntegrity: state.integrityHash },
      "Restore proposal.json from a trusted backup or create a new proposal; do not hand-edit proposal state.",
    );
  }
  assertExactWorkspacePaths(state, paths);
  return state;
}

export async function readProposalState(paths) {
  let raw;
  try {
    raw = await readFile(paths.statePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw stateError(
        "proposal-not-found",
        `Proposal ${path.basename(paths.proposalDir)} does not exist.`,
        { statePath: paths.statePath },
        "Run proposal plan first or use the exact proposal id it returned.",
      );
    }
    throw error;
  }
  let state;
  try {
    state = JSON.parse(raw);
  } catch (error) {
    throw stateError(
      "invalid-proposal-state",
      "Proposal state is not valid JSON.",
      { statePath: paths.statePath },
      "Restore proposal.json from a trusted backup or create a new proposal.",
    );
  }
  return validateProposalState(state, { id: path.basename(paths.proposalDir), paths });
}

export async function writeProposalState(paths, state) {
  const sealed = sealProposalState(state);
  validateProposalState(sealed, { id: state.id, paths });
  await atomicWriteJson(paths.statePath, sealed, { mode: 0o600 });
  return sealed;
}

export function evolveProposalState(state, { status = state.status, patch = {}, event, now }) {
  const timestamp = new Date(typeof now === "function" ? now() : now).toISOString();
  return sealProposalState({
    ...withoutIntegrity(state),
    ...patch,
    status,
    revision: state.revision + 1,
    updatedAt: timestamp,
    history: [
      ...state.history,
      {
        revision: state.revision + 1,
        at: timestamp,
        type: event,
        status,
      },
    ],
  });
}

export function initialProposalState({ id, planHash, spec, source, now }) {
  const timestamp = new Date(typeof now === "function" ? now() : now).toISOString();
  return sealProposalState({
    schemaVersion: 1,
    id,
    revision: 1,
    status: "planned",
    planHash,
    createdAt: timestamp,
    updatedAt: timestamp,
    spec,
    source,
    workspace: null,
    submission: null,
    history: [{ revision: 1, at: timestamp, type: "planned", status: "planned" }],
  });
}

export async function withProposalLock(paths, callback) {
  await assertProposalTopology(paths);
  return withFileLock(paths.lockPath, async () => {
    await assertProposalTopology(paths);
    await mkdir(paths.proposalsRoot, { recursive: true });
    return callback();
  });
}

export function proposalStateView(state) {
  return {
    id: state.id,
    revision: state.revision,
    status: state.status,
    action: state.spec.action,
    summary: state.spec.summary,
    targets: state.spec.targets.map((target) => ({
      id: target.id,
      version: target.version ?? null,
      sourceDigest: target.sourceDigest ?? null,
    })),
    source: {
      repoIdentity: state.source.repoIdentity,
      baseRef: state.source.baseRef,
      baseCommit: state.source.baseCommit,
      freshness: state.source.freshness,
    },
    workspace: state.workspace
      ? {
          branch: state.workspace.branchName,
          preparedCommit: state.workspace.preparedCommit,
          diffHash: state.workspace.diffHash,
          worktreePath: state.workspace.worktreePath,
        }
      : null,
    submission: state.submission,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
}
