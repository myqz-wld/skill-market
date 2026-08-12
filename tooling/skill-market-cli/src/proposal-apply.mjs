import { lstat, realpath, rm } from "node:fs/promises";
import path from "node:path";

import { loadCatalog, validateCatalog } from "./catalog.mjs";
import { parsePackageId } from "./contracts.mjs";
import { SkillMarketError } from "./errors.mjs";
import { atomicWriteJson } from "./fs-utils.mjs";
import { writeCatalogViews } from "./generators.mjs";
import { assertPathInside } from "./lifecycle-paths.mjs";
import { copyPackage, validatePackageContent } from "./package-content.mjs";
import {
  canonicalDigest,
  validateProposalAgainstCatalog,
} from "./proposal-contracts.mjs";

function applyError(code, message, details, nextAction) {
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

function isInsideOrEqual(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function canonicalPackageSource(sourcePath, proposalsRoot) {
  const metadata = await metadataIfExists(sourcePath);
  if (!metadata || metadata.isSymbolicLink() || !metadata.isDirectory()) {
    throw applyError(
      "invalid-proposal-source",
      `Proposal source must be a real existing directory: ${sourcePath}.`,
      { sourcePath },
      "Select the exact real package directory and create a new proposal plan.",
    );
  }
  const canonical = await realpath(sourcePath);
  if (isInsideOrEqual(proposalsRoot, canonical)) {
    throw applyError(
      "unsafe-proposal-source",
      "Proposal package sources cannot come from managed proposal workspaces.",
      { sourcePath, canonical, proposalsRoot },
      "Copy the intended source package outside the proposal state root and re-plan.",
    );
  }
  return canonical;
}

export async function enrichProposalSources({ spec, catalog, proposalsRoot }) {
  const planned = validateProposalAgainstCatalog(spec, catalog);
  const byId = new Map(planned.map((item) => [item.target.id, item]));
  const targets = [];
  for (const target of spec.targets) {
    if (target.sourcePath === undefined) {
      targets.push({ ...target });
      continue;
    }
    const sourcePath = await canonicalPackageSource(target.sourcePath, proposalsRoot);
    const sourceDigest = await validatePackageContent(byId.get(target.id).next, sourcePath);
    targets.push({ ...target, sourcePath, sourceDigest });
  }
  return {
    ...spec,
    targets,
  };
}

export async function verifyProposalSources({ spec, catalog, proposalsRoot }) {
  const enriched = await enrichProposalSources({ spec, catalog, proposalsRoot });
  for (const [index, target] of spec.targets.entries()) {
    if (target.sourceDigest !== undefined && target.sourceDigest !== enriched.targets[index].sourceDigest) {
      throw applyError(
        "proposal-source-changed",
        `Proposal source content changed after plan for ${target.id}.`,
        {
          id: target.id,
          sourcePath: target.sourcePath,
          plannedDigest: target.sourceDigest,
          actualDigest: enriched.targets[index].sourceDigest,
        },
        "Inspect the source changes and create a new proposal plan from the intended final content.",
      );
    }
  }
  return enriched;
}

function packageTarget(root, entry) {
  const target = path.join(root, ...entry.path.split("/"));
  return assertPathInside(root, target, "proposal package path");
}

async function requireCatalogPackage(root, entry) {
  const target = packageTarget(root, entry);
  const metadata = await metadataIfExists(target);
  if (!metadata) {
    throw applyError(
      "proposal-package-missing",
      `Catalog package ${entry.id} is missing from its recorded path.`,
      { id: entry.id, path: entry.path, target },
      "Repair the base repository package/catalog consistency, then create a new proposal plan.",
    );
  }
  await validatePackageContent(entry, target);
  return target;
}

async function validateCopiedPackage(change, target) {
  const copiedDigest = await validatePackageContent(change.next, target);
  if (copiedDigest !== change.target.sourceDigest) {
    throw applyError(
      "proposal-copy-digest-mismatch",
      `Copied proposal content does not match the planned source digest for ${change.next.id}.`,
      {
        id: change.next.id,
        sourcePath: change.target.sourcePath,
        target,
        plannedDigest: change.target.sourceDigest,
        copiedDigest,
      },
      "Stop preparation and inspect source changes or filesystem interference before creating a new proposal plan.",
    );
  }
}

function updatedCatalog(catalog, changes) {
  const nextById = new Map(catalog.packages.map((entry) => [entry.id, entry]));
  for (const change of changes) nextById.set(change.next.id, change.next);
  return validateCatalog({
    ...catalog,
    packages: [...nextById.values()].sort((left, right) => left.id.localeCompare(right.id)),
  });
}

function allowedPathPrefixes(changes, generatedPaths) {
  const prefixes = new Set(["catalog/entries.json", ...generatedPaths]);
  for (const change of changes) {
    if (["add", "update", "remove"].includes(change.action)) {
      prefixes.add(change.next.path);
    }
  }
  return [...prefixes].sort((left, right) => left.localeCompare(right));
}

export function assertExpectedProposalChanges(changedPaths, allowedPrefixes) {
  const unexpected = changedPaths.filter(
    (changed) =>
      !allowedPrefixes.some(
        (allowed) => changed === allowed || changed.startsWith(`${allowed}/`),
      ),
  );
  if (unexpected.length > 0) {
    throw applyError(
      "unexpected-proposal-change",
      "Proposal preparation changed paths outside its explicit targets and generated catalog views.",
      { changedPaths, allowedPrefixes, unexpected },
      "Inspect the source package and base repository, then remove the unexpected paths before re-planning.",
    );
  }
  if (changedPaths.length === 0) {
    throw applyError(
      "proposal-action-noop",
      "Proposal preparation produced no repository changes.",
      { allowedPrefixes },
      "Correct the action, version, metadata, or source content and create a new proposal plan.",
    );
  }
}

export async function applyProposalToWorktree({ state, worktreePath, proposalsRoot }) {
  const catalogPath = path.join(worktreePath, "catalog", "entries.json");
  const catalog = await loadCatalog(catalogPath);
  const actualCatalogDigest = canonicalDigest(catalog);
  if (actualCatalogDigest !== state.source.catalogDigest) {
    throw applyError(
      "proposal-base-catalog-mismatch",
      "Proposal worktree catalog does not match the catalog captured by proposal plan.",
      {
        expectedDigest: state.source.catalogDigest,
        actualDigest: actualCatalogDigest,
        catalogPath,
      },
      "Abort this workspace and create a new proposal plan from the intended base commit.",
    );
  }
  const planned = validateProposalAgainstCatalog(state.spec, catalog).map((change) => ({
    ...change,
    action: state.spec.action,
  }));

  await verifyProposalSources({
    spec: state.spec,
    catalog,
    proposalsRoot,
  });

  for (const change of planned) {
    if (state.spec.action === "add") {
      const target = packageTarget(worktreePath, change.next);
      if (await metadataIfExists(target)) {
        throw applyError(
          "proposal-package-path-collision",
          `Add target path already exists outside the catalog: ${change.next.path}.`,
          { id: change.next.id, path: change.next.path },
          "Choose a new package id or reconcile the unlisted repository path before re-planning.",
        );
      }
      await copyPackage(change.target.sourcePath, target);
      await validateCopiedPackage(change, target);
      continue;
    }
    const currentTarget = await requireCatalogPackage(worktreePath, change.current);
    if (state.spec.action === "update") {
      await rm(currentTarget, { recursive: true, force: false });
      await copyPackage(change.target.sourcePath, currentTarget);
      await validateCopiedPackage(change, currentTarget);
    } else if (state.spec.action === "remove") {
      await rm(currentTarget, { recursive: true, force: false });
    }
  }

  const nextCatalog = updatedCatalog(catalog, planned);
  await atomicWriteJson(catalogPath, nextCatalog, { mode: 0o644 });
  const generatedPaths = await writeCatalogViews({ root: worktreePath, catalog: nextCatalog });
  await writeCatalogViews({ root: worktreePath, catalog: nextCatalog, check: true });

  for (const change of planned) {
    if (["add", "update", "retire"].includes(state.spec.action)) {
      await validatePackageContent(change.next, packageTarget(worktreePath, change.next));
    }
  }
  return {
    catalog: nextCatalog,
    changes: planned.map((change) => ({
      id: change.next.id,
      action: state.spec.action,
      beforeVersion: change.current?.version ?? null,
      afterVersion: change.next.version,
      beforeStatus: change.current?.status ?? null,
      afterStatus: change.next.status,
      path: change.next.path,
    })),
    allowedPrefixes: allowedPathPrefixes(planned, generatedPaths),
  };
}

export function proposalCommitMessage(spec) {
  const first = parsePackageId(spec.targets[0].id);
  const subject =
    spec.targets.length === 1
      ? `${first.adapter} ${first.kind} ${first.name}`
      : `${spec.targets.length} packages`;
  return `market: ${spec.action} ${subject}`;
}
