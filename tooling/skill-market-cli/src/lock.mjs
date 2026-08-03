import { mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { SkillMarketError } from "./errors.mjs";
import { atomicWriteJson } from "./fs-utils.mjs";

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function removeStaleLock(lockPath, staleMs, now) {
  let metadata;
  try {
    metadata = await stat(lockPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return true;
    }
    throw error;
  }
  if (now() - metadata.mtimeMs < staleMs) {
    return false;
  }
  const stalePath = `${lockPath}.stale-${randomUUID()}`;
  try {
    await rename(lockPath, stalePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return true;
    }
    return false;
  }
  await rm(stalePath, { recursive: true, force: true });
  return true;
}

async function releaseOwnedLock(lockPath, token) {
  try {
    const owner = JSON.parse(await readFile(path.join(lockPath, "owner.json"), "utf8"));
    if (owner.token === token) {
      await rm(lockPath, { recursive: true, force: true });
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function withFileLock(
  lockPath,
  callback,
  {
    timeoutMs = 5000,
    retryMs = 25,
    staleMs = 30000,
    now = () => Date.now(),
  } = {},
) {
  await mkdir(path.dirname(lockPath), { recursive: true });
  const token = randomUUID();
  const startedAt = now();
  while (true) {
    try {
      await mkdir(lockPath);
      await atomicWriteJson(path.join(lockPath, "owner.json"), {
        schemaVersion: 1,
        token,
        pid: process.pid,
        acquiredAt: new Date(now()).toISOString(),
      });
      break;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
      if (await removeStaleLock(lockPath, staleMs, now)) {
        continue;
      }
      if (now() - startedAt >= timeoutMs) {
        throw new SkillMarketError({
          code: "lock-timeout",
          message: `Timed out waiting for lock ${lockPath}.`,
          status: "blocked",
          retryable: true,
          details: { lockPath, timeoutMs },
          nextAction: "Wait for the active Skill Market operation to finish, then retry.",
        });
      }
      await pause(retryMs);
    }
  }

  try {
    return await callback();
  } finally {
    await releaseOwnedLock(lockPath, token);
  }
}
