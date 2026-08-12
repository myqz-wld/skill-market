import { access, mkdir } from "node:fs/promises";
import path from "node:path";

import { SkillMarketError } from "./errors.mjs";
import { stateSource } from "./lifecycle-source.mjs";
import {
  contentDigest,
  copyPackage,
  validatePackageContent,
} from "./package-content.mjs";
import { runManagedTransaction } from "./transactions.mjs";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export function confirmation({ code, message, details, nextAction }) {
  return new SkillMarketError({
    code,
    message,
    status: "needs_confirmation",
    details,
    nextAction,
  });
}

export async function inspectStandalonePaths(paths) {
  const [activeExists, disabledExists] = await Promise.all([
    exists(paths.activePath),
    exists(paths.disabledPath),
  ]);
  return { activeExists, disabledExists };
}

export function brokenInstallation(record, issue) {
  return new SkillMarketError({
    code: "broken-installation",
    message: `Managed package ${record.adapter}:standalone:${record.name} is inconsistent: ${issue}.`,
    status: "blocked",
    details: { id: `${record.adapter}:standalone:${record.name}`, issue },
    nextAction: "Reconcile the canonical active/disabled paths and managed-state record before retrying.",
  });
}

export function actualActivation(record, presence) {
  if (presence.activeExists && presence.disabledExists) {
    throw brokenInstallation(record, "active and disabled paths both exist");
  }
  if (!presence.activeExists && !presence.disabledExists) {
    throw brokenInstallation(record, "neither active nor disabled path exists");
  }
  const actual = presence.activeExists ? "active" : "disabled";
  if (record.activation !== actual) {
    throw brokenInstallation(
      record,
      `managed state says ${record.activation} but ${actual} path exists`,
    );
  }
  return actual;
}

export function locationFor(paths, activation) {
  return activation === "active" ? paths.activePath : paths.disabledPath;
}

export function ensureSourceIdentity(record, snapshot, confirmSourceChange) {
  const nextSource = stateSource(snapshot);
  if (record.source.repoIdentity !== nextSource.repoIdentity && !confirmSourceChange) {
    throw confirmation({
      code: "source-change-confirmation",
      message: "The effective catalog source differs from the package's installed source.",
      details: {
        installedSource: record.source.repoIdentity,
        effectiveSource: nextSource.repoIdentity,
      },
      nextAction: "Verify the new source identity, then retry with --confirm-source-change.",
    });
  }
  return nextSource;
}

export async function requireMatchingDigest(record, location, confirmDrift) {
  const actualDigest = await contentDigest(location);
  if (actualDigest !== record.contentDigest && !confirmDrift) {
    throw confirmation({
      code: "local-drift-confirmation",
      message: "Local package content differs from its recorded installed digest.",
      details: {
        id: `${record.adapter}:standalone:${record.name}`,
        location,
        recordedDigest: record.contentDigest,
        actualDigest,
      },
      nextAction: "Inspect the local changes, back them up if needed, then retry with --confirm-drift.",
    });
  }
  return actualDigest;
}

export function createManagedRecord({
  entry,
  paths,
  digest,
  activation,
  ownership,
  snapshot,
  timestamp,
}) {
  return {
    adapter: entry.adapter,
    kind: "standalone",
    name: entry.name,
    installedVersion: entry.version,
    ownership,
    catalogPath: entry.path,
    activePath: paths.activePath,
    disabledPath: paths.disabledPath,
    contentDigest: digest,
    activation,
    installedAt: timestamp,
    updatedAt: timestamp,
    uninstalledAt: null,
    source: stateSource(snapshot),
  };
}

export async function stageStandalonePackage({ entry, snapshot, paths, hooks }) {
  const sourcePath = path.join(snapshot.root, entry.path);
  const sourceDigest = await validatePackageContent(entry, sourcePath);
  const stagePath = path.join(paths.transactionRoot, "stage");
  await mkdir(paths.transactionRoot, { recursive: true });
  await copyPackage(sourcePath, stagePath);
  const stagedDigest = await contentDigest(stagePath);
  if (stagedDigest !== sourceDigest) {
    throw new SkillMarketError({
      code: "staging-digest-mismatch",
      message: "Staged package digest differs from the validated catalog package.",
      status: "blocked",
      details: { sourceDigest, stagedDigest, sourcePath, stagePath },
      nextAction: "Stop the operation and inspect filesystem or copy-tool interference before retrying.",
    });
  }
  await hooks.afterStage?.({ stagePath, digest: stagedDigest });
  return { stagePath, digest: stagedDigest };
}

export async function replaceStandaloneTarget({
  operation,
  statePath,
  previousState,
  previousStateExists,
  nextState,
  paths,
  stagePath,
  targetPath,
  targetExists,
  hooks,
}) {
  const backupPath = path.join(paths.transactionRoot, "backup");
  return runManagedTransaction({
    operation,
    statePath,
    previousState,
    previousStateExists,
    nextState,
    hooks,
    work: async (transaction) => {
      if (targetExists) {
        await transaction.move(targetPath, backupPath);
        await hooks.afterBackup?.({ backupPath });
      }
      await transaction.move(stagePath, targetPath);
      await hooks.afterSwap?.({ targetPath });
    },
  });
}
