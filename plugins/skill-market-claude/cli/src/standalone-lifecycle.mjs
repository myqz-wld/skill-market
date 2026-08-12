import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import { SkillMarketError } from "./errors.mjs";
import {
  assertManagedRecordPaths,
  assertStandalonePathTopology,
  resolveStandalonePaths,
} from "./lifecycle-paths.mjs";
import { withFileLock } from "./lock.mjs";
import { validatePackageContent } from "./package-content.mjs";
import { loadManagedStateSnapshot } from "./state-store.mjs";
import {
  actualActivation,
  brokenInstallation,
  confirmation,
  createManagedRecord,
  ensureSourceIdentity,
  inspectStandalonePaths,
  locationFor,
  replaceStandaloneTarget,
  requireMatchingDigest,
  stageStandalonePackage,
} from "./standalone-support.mjs";
import { runManagedTransaction } from "./transactions.mjs";

export async function installStandalone({
  entry,
  snapshot,
  statePath,
  home,
  marketHome,
  adopt = false,
  hooks = {},
  now = () => Date.now(),
}) {
  const paths = resolveStandalonePaths({
    adapter: entry.adapter,
    name: entry.name,
    home,
    marketHome,
  });
  await assertStandalonePathTopology(paths, statePath);
  return withFileLock(paths.lifecycleLock, async () => {
    const stateSnapshot = await loadManagedStateSnapshot(statePath);
    const previousState = stateSnapshot.state;
    const record = previousState.packages[entry.id] ?? null;
    const presence = await inspectStandalonePaths(paths);
    if (record) {
      assertManagedRecordPaths(record, paths);
      if (record.uninstalledAt !== null) {
        if (presence.activeExists || presence.disabledExists) {
          throw brokenInstallation(record, "uninstalled history has a package path");
        }
      } else {
        const activation = actualActivation(record, presence);
        const location = locationFor(paths, activation);
        const actualDigest = await requireMatchingDigest(record, location, false);
        const sourcePath = path.join(snapshot.root, entry.path);
        const sourceDigest = await validatePackageContent(entry, sourcePath);
        if (record.installedVersion === entry.version && actualDigest === sourceDigest) {
          return {
            status: "noop",
            summary: `${entry.id} is already installed with matching content.`,
            data: { id: entry.id, activation, installedVersion: record.installedVersion },
            warnings: [],
          };
        }
        throw new SkillMarketError({
          code: "package-already-managed",
          message: `${entry.id} is already managed and install will not overwrite it.`,
          status: "blocked",
          details: {
            id: entry.id,
            installedVersion: record.installedVersion,
            catalogVersion: entry.version,
          },
          nextAction: "Use update for a managed package, with explicit drift/source confirmation when reported.",
        });
      }
    }
    if (presence.activeExists && presence.disabledExists) {
      throw new SkillMarketError({
        code: "unmanaged-path-collision",
        message: `${entry.id} has both unmanaged active and disabled paths.`,
        status: "blocked",
        details: { activePath: paths.activePath, disabledPath: paths.disabledPath },
        nextAction: "Resolve the duplicate local directories manually, then retry install.",
      });
    }
    const collision = presence.activeExists || presence.disabledExists;
    if (collision && !adopt) {
      throw confirmation({
        code: "adoption-confirmation",
        message: `${entry.id} already exists outside Skill Market managed state.`,
        details: {
          id: entry.id,
          existingPath: presence.activeExists ? paths.activePath : paths.disabledPath,
        },
        nextAction: "Inspect and back up the existing directory, then retry with --adopt to replace and manage it.",
      });
    }
    const activation = presence.disabledExists ? "disabled" : "active";
    const targetPath = locationFor(paths, activation);
    try {
      const staged = await stageStandalonePackage({ entry, snapshot, paths, hooks });
      const timestamp = new Date(now()).toISOString();
      const nextState = structuredClone(previousState);
      nextState.packages[entry.id] = createManagedRecord({
        entry,
        paths,
        digest: staged.digest,
        activation,
        ownership: collision ? "adopted" : "skill-market",
        snapshot,
        timestamp,
      });
      const warnings = await replaceStandaloneTarget({
        operation: "install",
        statePath,
        previousState,
        previousStateExists: stateSnapshot.exists,
        nextState,
        paths,
        stagePath: staged.stagePath,
        targetPath,
        targetExists: collision,
        hooks,
      });
      return {
        status: "ok",
        summary: `Installed ${entry.id} in ${activation} state.`,
        data: { id: entry.id, activation, version: entry.version, path: targetPath, digest: staged.digest },
        warnings,
      };
    } finally {
      await rm(paths.transactionRoot, { recursive: true, force: true });
    }
  });
}

export async function updateStandalone({
  entry,
  snapshot,
  statePath,
  home,
  marketHome,
  force = false,
  confirmDrift = false,
  confirmSourceChange = false,
  hooks = {},
  now = () => Date.now(),
}) {
  const paths = resolveStandalonePaths({ adapter: entry.adapter, name: entry.name, home, marketHome });
  await assertStandalonePathTopology(paths, statePath);
  return withFileLock(paths.lifecycleLock, async () => {
    const stateSnapshot = await loadManagedStateSnapshot(statePath);
    const previousState = stateSnapshot.state;
    const record = previousState.packages[entry.id];
    if (!record) {
      throw new SkillMarketError({
        code: "package-not-managed",
        message: `${entry.id} is not managed and cannot be updated.`,
        status: "blocked",
        details: { id: entry.id },
        nextAction: "Use install, adding --adopt only after inspecting any existing local directory.",
      });
    }
    if (record.uninstalledAt !== null) {
      throw new SkillMarketError({
        code: "package-not-installed",
        message: `${entry.id} has uninstall history but no current installation to update.`,
        status: "blocked",
        details: { id: entry.id, uninstalledAt: record.uninstalledAt },
        nextAction: "Use install to create a new managed installation.",
      });
    }
    assertManagedRecordPaths(record, paths);
    const presence = await inspectStandalonePaths(paths);
    const activation = actualActivation(record, presence);
    const targetPath = locationFor(paths, activation);
    const actualDigest = await requireMatchingDigest(record, targetPath, confirmDrift);
    const nextSource = ensureSourceIdentity(record, snapshot, confirmSourceChange);
    try {
      const staged = await stageStandalonePackage({ entry, snapshot, paths, hooks });
      if (!force && record.installedVersion === entry.version && actualDigest === staged.digest) {
        return {
          status: "noop",
          summary: `${entry.id} is already current with matching content.`,
          data: { id: entry.id, activation, installedVersion: record.installedVersion },
          warnings: [],
        };
      }
      const nextState = structuredClone(previousState);
      nextState.packages[entry.id] = {
        ...record,
        installedVersion: entry.version,
        contentDigest: staged.digest,
        updatedAt: new Date(now()).toISOString(),
        source: nextSource,
      };
      const warnings = await replaceStandaloneTarget({
        operation: "update",
        statePath,
        previousState,
        previousStateExists: stateSnapshot.exists,
        nextState,
        paths,
        stagePath: staged.stagePath,
        targetPath,
        targetExists: true,
        hooks,
      });
      return {
        status: "ok",
        summary: `Updated ${entry.id} to ${entry.version} while preserving ${activation} state.`,
        data: { id: entry.id, activation, version: entry.version, path: targetPath, digest: staged.digest },
        warnings,
      };
    } finally {
      await rm(paths.transactionRoot, { recursive: true, force: true });
    }
  });
}

export async function setStandaloneActivation({
  id,
  identity,
  desired,
  statePath,
  home,
  marketHome,
  confirmDrift = false,
  hooks = {},
  now = () => Date.now(),
}) {
  const paths = resolveStandalonePaths({
    adapter: identity.adapter,
    name: identity.name,
    home,
    marketHome,
  });
  await assertStandalonePathTopology(paths, statePath);
  return withFileLock(paths.lifecycleLock, async () => {
    const stateSnapshot = await loadManagedStateSnapshot(statePath);
    const previousState = stateSnapshot.state;
    const record = previousState.packages[id];
    if (!record) {
      throw new SkillMarketError({
        code: "package-not-managed",
        message: `${id} is not managed and cannot be ${desired === "active" ? "enabled" : "disabled"}.`,
        status: "blocked",
        details: { id },
        nextAction: "Install or explicitly adopt the package before changing activation state.",
      });
    }
    if (record.uninstalledAt !== null) {
      throw new SkillMarketError({
        code: "package-not-installed",
        message: `${id} has uninstall history but no current installation to ${desired === "active" ? "enable" : "disable"}.`,
        status: "blocked",
        details: { id, uninstalledAt: record.uninstalledAt },
        nextAction: "Install the package before changing activation state.",
      });
    }
    assertManagedRecordPaths(record, paths);
    const presence = await inspectStandalonePaths(paths);
    const current = actualActivation(record, presence);
    const currentPath = locationFor(paths, current);
    await requireMatchingDigest(record, currentPath, confirmDrift);
    if (current === desired) {
      return {
        status: "noop",
        summary: `${id} is already ${desired}.`,
        data: { id, activation: desired, path: currentPath },
        warnings: [],
      };
    }
    const targetPath = locationFor(paths, desired);
    const nextState = structuredClone(previousState);
    nextState.packages[id] = {
      ...record,
      activation: desired,
      updatedAt: new Date(now()).toISOString(),
    };
    const warnings = await runManagedTransaction({
      operation: desired === "active" ? "enable" : "disable",
      statePath,
      previousState,
      previousStateExists: stateSnapshot.exists,
      nextState,
      hooks,
      work: async (transaction) => {
        await transaction.move(currentPath, targetPath);
        await hooks.afterSwap?.({ targetPath });
      },
    });
    return {
      status: "ok",
      summary: `${desired === "active" ? "Enabled" : "Disabled"} ${id}.`,
      data: { id, activation: desired, path: targetPath },
      warnings,
    };
  });
}

export async function uninstallStandalone({
  id,
  identity,
  statePath,
  home,
  marketHome,
  adopt = false,
  confirmDrift = false,
  hooks = {},
  now = () => Date.now(),
}) {
  const paths = resolveStandalonePaths({ adapter: identity.adapter, name: identity.name, home, marketHome });
  await assertStandalonePathTopology(paths, statePath);
  return withFileLock(paths.lifecycleLock, async () => {
    const stateSnapshot = await loadManagedStateSnapshot(statePath);
    const previousState = stateSnapshot.state;
    const record = previousState.packages[id] ?? null;
    const presence = await inspectStandalonePaths(paths);
    if (record && record.uninstalledAt !== null) {
      if (!presence.activeExists && !presence.disabledExists) {
        return {
          status: "noop",
          summary: `${id} is already uninstalled.`,
          data: { id, localState: "absent", uninstalledAt: record.uninstalledAt },
          warnings: [],
        };
      }
      throw brokenInstallation(record, "uninstalled history has a package path");
    }
    if (!record && !presence.activeExists && !presence.disabledExists) {
      return {
        status: "noop",
        summary: `${id} is not installed.`,
        data: { id, localState: "absent" },
        warnings: [],
      };
    }
    if (presence.activeExists && presence.disabledExists) {
      throw new SkillMarketError({
        code: "broken-installation",
        message: `${id} has both active and disabled paths; uninstall will not guess which data to remove.`,
        status: "blocked",
        details: { activePath: paths.activePath, disabledPath: paths.disabledPath },
        nextAction: "Reconcile the duplicate directories, then retry uninstall.",
      });
    }
    if (!record && !adopt) {
      throw confirmation({
        code: "unmanaged-uninstall-confirmation",
        message: `${id} exists locally but is not managed by Skill Market.`,
        details: { id, path: presence.activeExists ? paths.activePath : paths.disabledPath },
        nextAction: "Inspect and back up the directory, then retry with --adopt to authorize removal.",
      });
    }
    let activation = presence.activeExists ? "active" : "disabled";
    if (record) {
      assertManagedRecordPaths(record, paths);
      activation = actualActivation(record, presence);
      await requireMatchingDigest(record, locationFor(paths, activation), confirmDrift);
    }
    const targetPath = locationFor(paths, activation);
    const backupPath = path.join(paths.transactionRoot, "removed");
    const nextState = structuredClone(previousState);
    if (record) {
      const timestamp = new Date(now()).toISOString();
      nextState.packages[id] = {
        ...record,
        updatedAt: timestamp,
        uninstalledAt: timestamp,
      };
    }
    try {
      await mkdir(paths.transactionRoot, { recursive: true });
      const warnings = await runManagedTransaction({
        operation: "uninstall",
        statePath,
        previousState,
        previousStateExists: stateSnapshot.exists,
        nextState,
        hooks,
        work: async (transaction) => {
          await transaction.removeToBackup(targetPath, backupPath);
          await hooks.afterBackup?.({ backupPath });
        },
      });
      return {
        status: "ok",
        summary: `Uninstalled ${id}.`,
        data: { id, removedPath: targetPath, previousActivation: activation },
        warnings,
      };
    } finally {
      await rm(paths.transactionRoot, { recursive: true, force: true });
    }
  });
}
