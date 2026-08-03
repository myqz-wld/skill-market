import { access, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { SkillMarketError } from "./errors.mjs";
import {
  assertDownloadPathTopology,
  assertPathInside,
  defaultDownloadPath,
} from "./lifecycle-paths.mjs";
import { withFileLock } from "./lock.mjs";
import {
  contentDigest,
  copyPackage,
  validatePackageContent,
} from "./package-content.mjs";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function downloadPackage({
  entry,
  snapshot,
  downloadsRoot,
  marketHome,
  destination = null,
  force = false,
  hooks = {},
}) {
  const destinationPath = destination
    ? assertPathInside(downloadsRoot, destination, "downloadDestination")
    : defaultDownloadPath({ downloadsRoot, entry });
  await assertDownloadPathTopology({ marketHome, downloadsRoot, destinationPath });
  const lockPath = path.join(marketHome, "locks", "downloads.lock");
  return withFileLock(lockPath, async () => {
    const sourcePath = path.join(snapshot.root, entry.path);
    const sourceDigest = await validatePackageContent(entry, sourcePath);
    const destinationExists = await exists(destinationPath);
    if (destinationExists) {
      const currentDigest = await contentDigest(destinationPath);
      if (currentDigest === sourceDigest) {
        return {
          status: "noop",
          summary: `${entry.id} is already downloaded with matching content.`,
          data: { id: entry.id, version: entry.version, path: destinationPath, digest: sourceDigest },
          warnings: [],
        };
      }
      if (!force) {
        throw new SkillMarketError({
          code: "download-overwrite-confirmation",
          message: "Download destination exists with different content.",
          status: "needs_confirmation",
          details: {
            id: entry.id,
            destinationPath,
            existingDigest: currentDigest,
            catalogDigest: sourceDigest,
          },
          nextAction: "Inspect or move the existing download, then retry with --force to replace it.",
        });
      }
    }

    const suffix = `${process.pid}-${randomUUID()}`;
    const stagingPath = `${destinationPath}.staging-${suffix}`;
    const backupPath = `${destinationPath}.backup-${suffix}`;
    let backupCreated = false;
    let installed = false;
    try {
      await mkdir(path.dirname(destinationPath), { recursive: true });
      await copyPackage(sourcePath, stagingPath);
      const stagedDigest = await contentDigest(stagingPath);
      if (stagedDigest !== sourceDigest) {
        throw new SkillMarketError({
          code: "staging-digest-mismatch",
          message: "Downloaded staging content does not match the catalog package digest.",
          status: "blocked",
          details: { sourceDigest, stagedDigest, stagingPath },
          nextAction: "Stop and inspect filesystem or copy-tool interference before retrying.",
        });
      }
      await hooks.afterStage?.({ stagingPath, digest: stagedDigest });
      if (destinationExists) {
        await rename(destinationPath, backupPath);
        backupCreated = true;
        await hooks.afterBackup?.({ backupPath });
      }
      await rename(stagingPath, destinationPath);
      installed = true;
      await hooks.afterSwap?.({ destinationPath });
      if (backupCreated) {
        await rm(backupPath, { recursive: true, force: true });
        backupCreated = false;
      }
      return {
        status: "ok",
        summary: `Downloaded ${entry.id}@${entry.version}.`,
        data: { id: entry.id, version: entry.version, path: destinationPath, digest: stagedDigest },
        warnings: [],
      };
    } catch (error) {
      const destinationChanged = installed || backupCreated;
      const rollbackFailures = [];
      if (installed) {
        try {
          await rm(destinationPath, { recursive: true, force: true });
        } catch (rollbackError) {
          rollbackFailures.push(rollbackError.message);
        }
      }
      if (backupCreated) {
        try {
          await rename(backupPath, destinationPath);
        } catch (rollbackError) {
          rollbackFailures.push(rollbackError.message);
        }
      }
      if (rollbackFailures.length > 0) {
        throw new SkillMarketError({
          code: "rollback-failed",
          message: "Download failed and destination rollback was incomplete.",
          status: "blocked",
          details: { destinationPath, originalError: error.message, rollbackFailures },
          nextAction: "Stop downloads and reconcile the destination and backup paths before retrying.",
          cause: error,
        });
      }
      if (destinationChanged) {
        throw new SkillMarketError({
          code: "transaction-rolled-back",
          message: "Download failed after changing the destination; the prior destination was restored.",
          retryable: true,
          details: {
            operation: "download",
            destinationPath,
            originalCode: error.code ?? null,
            originalError: error.message,
          },
          nextAction: "Resolve the reported download failure, then retry the same command.",
          cause: error,
        });
      }
      if (error instanceof SkillMarketError) throw error;
      throw new SkillMarketError({
        code: "download-failed",
        message: "Download failed before changing the destination.",
        retryable: true,
        details: { destinationPath, originalError: error.message },
        nextAction: "Resolve the filesystem or staging failure, then retry the same command.",
        cause: error,
      });
    } finally {
      await rm(stagingPath, { recursive: true, force: true });
      if (!backupCreated) {
        await rm(backupPath, { recursive: true, force: true });
      }
    }
  });
}
