import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

import { SkillMarketError } from "./errors.mjs";
import { writeManagedState } from "./state-store.mjs";

async function runReverse(actions) {
  const failures = [];
  for (const action of [...actions].reverse()) {
    try {
      await action();
    } catch (error) {
      failures.push(error.message);
    }
  }
  return failures;
}

export async function runManagedTransaction({
  operation,
  statePath,
  previousState,
  previousStateExists = true,
  nextState,
  work,
  hooks = {},
}) {
  const rollback = [];
  const cleanup = [];
  let stateWritten = false;
  const context = {
    onRollback(action) {
      rollback.push(action);
    },
    onCleanup(action) {
      cleanup.push(action);
    },
    async move(from, to) {
      await mkdir(path.dirname(to), { recursive: true });
      await rename(from, to);
      rollback.push(async () => {
        await mkdir(path.dirname(from), { recursive: true });
        await rename(to, from);
      });
    },
    async replaceFromStage(stagePath, targetPath, backupPath, targetExists) {
      if (targetExists) {
        await mkdir(path.dirname(backupPath), { recursive: true });
        await rename(targetPath, backupPath);
        rollback.push(async () => rename(backupPath, targetPath));
        cleanup.push(async () => rm(backupPath, { recursive: true, force: true }));
      }
      await mkdir(path.dirname(targetPath), { recursive: true });
      await rename(stagePath, targetPath);
      rollback.push(async () => rm(targetPath, { recursive: true, force: true }));
    },
    async removeToBackup(targetPath, backupPath) {
      await mkdir(path.dirname(backupPath), { recursive: true });
      await rename(targetPath, backupPath);
      rollback.push(async () => rename(backupPath, targetPath));
      cleanup.push(async () => rm(backupPath, { recursive: true, force: true }));
    },
  };

  try {
    await work(context);
    await hooks.beforeStateWrite?.();
    await writeManagedState(statePath, nextState);
    stateWritten = true;
    await hooks.afterStateWrite?.();
  } catch (error) {
    const failures = [];
    if (stateWritten) {
      try {
        if (previousStateExists) {
          await writeManagedState(statePath, previousState);
        } else {
          await rm(statePath, { force: true });
        }
      } catch (rollbackError) {
        failures.push(`state: ${rollbackError.message}`);
      }
    }
    failures.push(...(await runReverse(rollback)));
    if (failures.length > 0) {
      throw new SkillMarketError({
        code: "rollback-failed",
        message: `${operation} failed and automatic rollback was incomplete.`,
        status: "blocked",
        details: { operation, originalError: error.message, rollbackFailures: failures },
        nextAction: "Stop package mutations and reconcile the recorded paths against managed-state before retrying.",
        cause: error,
      });
    }
    throw new SkillMarketError({
      code: "transaction-rolled-back",
      message: `${operation} failed; filesystem and managed state were restored.`,
      retryable: true,
      details: { operation, originalCode: error.code ?? null, originalError: error.message },
      nextAction: "Resolve the reported operation failure, then retry the same command.",
      cause: error,
    });
  }

  const cleanupFailures = [];
  for (const action of cleanup) {
    try {
      await action();
    } catch (error) {
      cleanupFailures.push(error.message);
    }
  }
  return cleanupFailures.map((message) => ({
    code: "transaction-cleanup-failed",
    message,
  }));
}
