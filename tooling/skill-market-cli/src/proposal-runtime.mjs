import { lstat, readFile, realpath, rm } from "node:fs/promises";
import path from "node:path";

import { loadCatalog } from "./catalog.mjs";
import { loadCatalogSnapshot } from "./cache.mjs";
import { loadEffectiveConfig } from "./config.mjs";
import { SkillMarketError } from "./errors.mjs";
import { verifyProposalSources } from "./proposal-apply.mjs";
import { canonicalDigest, normalizeProposalSpec } from "./proposal-contracts.mjs";
import { createProposalGitClient, digestBytes } from "./proposal-git.mjs";
import { createGitHubClient } from "./proposal-host.mjs";
import { proposalStateView } from "./proposal-store.mjs";
import { canonicalRepositoryIdentity } from "./source-identity.mjs";

const CACHE_MARKER_STATUS = "?? .skill-market-cache.json";

export function proposalError(code, message, details, nextAction, options = {}) {
  return new SkillMarketError({
    code,
    message,
    status: options.status ?? "blocked",
    retryable: options.retryable ?? false,
    details,
    nextAction,
    cause: options.cause,
  });
}

export async function metadataIfExists(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function resolveInputPath(value, home, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw proposalError(
      "invalid-proposal-spec-path",
      `${field} must be a non-empty path.`,
      { field, value },
      "Pass --spec with the proposal JSON file path.",
    );
  }
  if (value === "~") return home;
  if (value.startsWith("~/")) return path.join(home, value.slice(2));
  return path.resolve(value);
}

export async function readProposalSpec(specPath, home) {
  const resolved = resolveInputPath(specPath, home, "specPath");
  const metadata = await metadataIfExists(resolved);
  if (!metadata || metadata.isSymbolicLink() || !metadata.isFile()) {
    throw proposalError(
      "invalid-proposal-spec-path",
      "Proposal spec must be a real existing JSON file.",
      { specPath: resolved },
      "Write the proposal input spec to a regular file and retry proposal plan.",
    );
  }
  let input;
  try {
    input = JSON.parse(await readFile(resolved, "utf8"));
  } catch (error) {
    throw proposalError(
      "invalid-proposal-spec",
      "Proposal spec must contain valid JSON.",
      { specPath: resolved },
      "Fix the JSON syntax and retry proposal plan.",
      { cause: error },
    );
  }
  return {
    specPath: resolved,
    spec: normalizeProposalSpec(input, { specPath: resolved, home }),
  };
}

export function proposalSourceOverrides(options) {
  return Object.fromEntries(
    ["readRepoUrl", "baseRef", "cachePath", "cacheTtlSeconds", "repoPath"]
      .filter((key) => options?.[key] !== undefined)
      .map((key) => [key, options[key]]),
  );
}

function statusLines(status) {
  return status === "" ? [] : status.split("\n").filter(Boolean);
}

function assertCleanProposalBase({ status, mode, root }) {
  const lines = statusLines(status);
  const unexpected = mode === "cache" ? lines.filter((line) => line !== CACHE_MARKER_STATUS) : lines;
  if (unexpected.length > 0) {
    throw proposalError(
      "dirty-proposal-base",
      "Proposal base repository contains changes outside its verified catalog snapshot.",
      { root, mode, status: lines, unexpected },
      "Commit, stash, or remove the local changes, then create a new proposal plan.",
    );
  }
}

export async function validateSnapshotBase({ snapshot, config, git }) {
  const root = await realpath(snapshot.root);
  const topLevel = await realpath(await git.topLevel(root));
  if (topLevel !== root) {
    throw proposalError(
      "invalid-proposal-base",
      "Proposal catalog root must be the top level of its Git repository.",
      { root, topLevel },
      "Set repoPath or cachePath to the repository root and create a new proposal plan.",
    );
  }
  const configuredIdentity = canonicalRepositoryIdentity(config.readRepoUrl);
  const catalogIdentity = canonicalRepositoryIdentity(snapshot.catalog.defaults.readRepoUrl);
  if (configuredIdentity !== catalogIdentity) {
    throw proposalError(
      "proposal-source-mismatch",
      "Effective repository and catalog defaults identify different proposal repositories.",
      { configuredIdentity, catalogIdentity },
      "Select the intended repository source and create a new proposal plan.",
    );
  }
  const head = await git.head(root);
  if (snapshot.source.mode === "local") {
    const baseHead = await git.resolveRef(root, config.baseRef);
    if (baseHead !== head) {
      throw proposalError(
        "proposal-base-ref-mismatch",
        "Local proposal checkout HEAD does not equal the configured base ref.",
        { root, baseRef: config.baseRef, head, baseHead },
        "Check out the configured base ref at a clean HEAD, then create a new proposal plan.",
      );
    }
  } else if (snapshot.source.head !== head) {
    throw proposalError(
      "proposal-cache-head-mismatch",
      "Proposal cache marker and actual Git HEAD differ.",
      { root, markerHead: snapshot.source.head, actualHead: head },
      "Repair or refresh the configured cache, then create a new proposal plan.",
    );
  }
  assertCleanProposalBase({ status: await git.status(root), mode: snapshot.source.mode, root });
  return {
    root,
    mode: snapshot.source.mode,
    readRepoUrl: config.readRepoUrl,
    repoIdentity: configuredIdentity,
    baseRef: config.baseRef,
    baseCommit: head,
    catalogDigest: canonicalDigest(snapshot.catalog),
    freshness: snapshot.freshness,
  };
}

export function branchFor(state) {
  const suffix = state.id.slice("proposal-".length, "proposal-".length + 8);
  if (state.spec.targets.length > 1) return `market/${state.spec.action}/batch-${suffix}`;
  const [adapter, kind, name] = state.spec.targets[0].id.split(":");
  return `market/${state.spec.action}/${adapter}/${kind}-${name.slice(0, 64)}-${suffix}`;
}

export async function ensureSourceStillExact(state, git, proposalsRoot) {
  let root;
  try {
    root = await realpath(state.source.root);
  } catch (error) {
    throw proposalError(
      "proposal-base-missing",
      "Proposal base repository is no longer available.",
      { root: state.source.root },
      "Restore the exact source checkout/cache or create a new proposal plan.",
      { cause: error },
    );
  }
  if (root !== state.source.root || (await realpath(await git.topLevel(root))) !== root) {
    throw proposalError(
      "proposal-base-changed",
      "Proposal base repository path or Git root changed after planning.",
      { recordedRoot: state.source.root, actualRoot: root },
      "Restore the original repository topology or create a new proposal plan.",
    );
  }
  const head = await git.head(root);
  if (head !== state.source.baseCommit) {
    throw proposalError(
      "proposal-base-changed",
      "Proposal base repository HEAD changed after planning.",
      { root, plannedHead: state.source.baseCommit, actualHead: head },
      "Create a new proposal plan from the current base repository.",
    );
  }
  assertCleanProposalBase({ status: await git.status(root), mode: state.source.mode, root });
  const catalog = await loadCatalog(path.join(root, "catalog", "entries.json"));
  const digest = canonicalDigest(catalog);
  if (digest !== state.source.catalogDigest) {
    throw proposalError(
      "proposal-base-catalog-mismatch",
      "Proposal base catalog changed after planning.",
      { expectedDigest: state.source.catalogDigest, actualDigest: digest },
      "Create a new proposal plan from the current catalog.",
    );
  }
  await verifyProposalSources({ spec: state.spec, catalog, proposalsRoot });
  return { root, catalog };
}

export async function safeManagedMetadata(target, proposalDir, label) {
  const relative = path.relative(proposalDir, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw proposalError(
      "unsafe-proposal-path",
      `${label} must be an exact child of its proposal directory.`,
      { proposalDir, target, label },
      "Restore canonical proposal state before cleanup.",
    );
  }
  const metadata = await metadataIfExists(target);
  if (metadata?.isSymbolicLink()) {
    throw proposalError(
      "unsafe-proposal-path",
      `${label} cannot be a symbolic link.`,
      { target, label },
      "Remove the unsafe symlink manually after verifying its target; do not retry automatic cleanup.",
    );
  }
  return metadata;
}

export async function cleanupWorkspace(paths, git, { force }) {
  const worktree = await safeManagedMetadata(paths.worktreePath, paths.proposalDir, "worktree");
  const bare = await safeManagedMetadata(paths.barePath, paths.proposalDir, "bare repository");
  await safeManagedMetadata(paths.bodyPath, paths.proposalDir, "pull-request body");
  if (worktree && bare) {
    try {
      await git.removeWorktree({ barePath: paths.barePath, destination: paths.worktreePath, force });
    } catch (error) {
      if (!force) throw error;
      await rm(paths.worktreePath, { recursive: true, force: true });
    }
  } else if (worktree) {
    if (!force) {
      throw proposalError(
        "proposal-workspace-recovery-required",
        "Proposal worktree exists without its owning bare repository.",
        { worktreePath: paths.worktreePath, barePath: paths.barePath },
        "Inspect the managed worktree and retry abort with --confirm-discard only if it can be deleted.",
      );
    }
    await rm(paths.worktreePath, { recursive: true, force: true });
  }
  await rm(paths.barePath, { recursive: true, force: true });
  await rm(paths.bodyPath, { force: true });
}

export function proposalBody(state, workspace) {
  const rows = workspace.changes.map(
    (change) =>
      `| \`${change.id}\` | ${change.action} | ${change.beforeVersion ?? "—"} | ${change.afterVersion} | ${change.beforeStatus ?? "—"} | ${change.afterStatus} |`,
  );
  return [
    `# ${state.spec.summary}`,
    "",
    `Prepared by Skill Market proposal \`${state.id}\`.`,
    "",
    "## Targets",
    "",
    "| Package | Action | Before version | After version | Before status | After status |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
    "## Provenance",
    "",
    `- Base: \`${state.source.baseRef}\` at \`${state.source.baseCommit}\``,
    `- Prepared commit: \`${workspace.preparedCommit}\``,
    `- Diff SHA-256: \`${workspace.diffHash}\``,
    "- Catalog and all generated marketplace views were regenerated and checked.",
    "- Package manifests/content and the explicit changed-path allowlist were validated.",
    "",
  ].join("\n");
}

export async function verifyPreparedWorkspace(state, paths, git) {
  const workspace = state.workspace;
  if (!workspace?.preparedCommit || !workspace.diffHash || !workspace.treeHash || !workspace.bodyDigest) {
    throw proposalError(
      "invalid-proposal-state",
      "Prepared proposal state is missing commit, tree, diff, or PR-body provenance.",
      { id: state.id, workspace },
      "Abort the local proposal if safe, then create and prepare a new proposal.",
    );
  }
  const worktreeMetadata = await safeManagedMetadata(paths.worktreePath, paths.proposalDir, "worktree");
  const bareMetadata = await safeManagedMetadata(paths.barePath, paths.proposalDir, "bare repository");
  if (!worktreeMetadata?.isDirectory() || !bareMetadata?.isDirectory()) {
    throw proposalError(
      "proposal-workspace-missing",
      "Prepared proposal workspace is missing.",
      { worktreePath: paths.worktreePath, barePath: paths.barePath },
      "Restore the exact proposal workspace or create a new proposal; do not recreate state by hand.",
    );
  }
  const head = await git.head(paths.worktreePath);
  const status = await git.status(paths.worktreePath);
  if (head !== workspace.preparedCommit || status !== "") {
    throw proposalError(
      "proposal-workspace-drift",
      "Prepared proposal worktree no longer matches its recorded clean commit.",
      { expectedHead: workspace.preparedCommit, actualHead: head, status },
      "Inspect the local worktree; abort with explicit discard or create a new proposal instead of submitting drifted content.",
    );
  }
  const [treeHash, diffBytes, bodyBytes] = await Promise.all([
    git.tree(paths.worktreePath),
    git.diffBytes(paths.worktreePath, state.source.baseCommit, workspace.preparedCommit),
    readFile(paths.bodyPath),
  ]);
  const diffHash = digestBytes(diffBytes);
  const bodyDigest = digestBytes(bodyBytes);
  if (treeHash !== workspace.treeHash || diffHash !== workspace.diffHash || bodyDigest !== workspace.bodyDigest) {
    throw proposalError(
      "proposal-workspace-integrity-mismatch",
      "Prepared proposal tree, diff, or PR body differs from durable state.",
      {
        expected: { treeHash: workspace.treeHash, diffHash: workspace.diffHash, bodyDigest: workspace.bodyDigest },
        actual: { treeHash, diffHash, bodyDigest },
      },
      "Do not submit; inspect the proposal artifacts and create a new plan if content changed.",
    );
  }
  await git.diffCheck(paths.worktreePath, state.source.baseCommit);
  return workspace;
}

export function publicProposalResult(status, summary, state, extra = {}) {
  return {
    status,
    summary,
    data: { proposal: proposalStateView(state), ...extra },
  };
}

export function proposalServices({ env, dependencies = {} }) {
  return {
    loadEffectiveConfig,
    loadCatalogSnapshot,
    git: createProposalGitClient({ env }),
    github: createGitHubClient({ env }),
    now: () => Date.now(),
    ...dependencies,
  };
}
