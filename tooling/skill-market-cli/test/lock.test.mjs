import assert from "node:assert/strict";
import { access, mkdir, utimes, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { SkillMarketError } from "../src/errors.mjs";
import { withFileLock } from "../src/lock.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

test("owned locks are released even when the protected operation fails", async () => {
  await withTemporaryHome(async (home) => {
    const lockPath = path.join(home, "locks/cache.lock");
    await assert.rejects(
      withFileLock(lockPath, async () => {
        throw new Error("fixture failure");
      }),
      /fixture failure/u,
    );
    await assert.rejects(access(lockPath), { code: "ENOENT" });
  });
});

test("active locks time out with a retryable typed error", async () => {
  await withTemporaryHome(async (home) => {
    const lockPath = path.join(home, "locks/cache.lock");
    await mkdir(lockPath, { recursive: true });
    await writeFile(path.join(lockPath, "owner.json"), "{}", "utf8");
    await assert.rejects(
      withFileLock(lockPath, async () => {}, {
        timeoutMs: 30,
        retryMs: 5,
        staleMs: 60_000,
      }),
      (error) =>
        error instanceof SkillMarketError &&
        error.code === "lock-timeout" &&
        error.retryable === true,
    );
  });
});

test("stale locks are quarantined before a new owner proceeds", async () => {
  await withTemporaryHome(async (home) => {
    const lockPath = path.join(home, "locks/cache.lock");
    await mkdir(lockPath, { recursive: true });
    await writeFile(path.join(lockPath, "owner.json"), "{}", "utf8");
    const old = new Date(Date.now() - 120_000);
    await utimes(lockPath, old, old);
    let entered = false;
    await withFileLock(
      lockPath,
      async () => {
        entered = true;
      },
      { staleMs: 1000 },
    );
    assert.equal(entered, true);
    await assert.rejects(access(lockPath), { code: "ENOENT" });
  });
});

test("an old lock owned by a live process is not stolen", async () => {
  await withTemporaryHome(async (home) => {
    const lockPath = path.join(home, "locks/cache.lock");
    await mkdir(lockPath, { recursive: true });
    await writeFile(
      path.join(lockPath, "owner.json"),
      JSON.stringify({ pid: process.pid }),
      "utf8",
    );
    const old = new Date(Date.now() - 120_000);
    await utimes(lockPath, old, old);
    await assert.rejects(
      withFileLock(lockPath, async () => {}, {
        timeoutMs: 20,
        retryMs: 5,
        staleMs: 1,
      }),
      (error) => error.code === "lock-timeout",
    );
  });
});
