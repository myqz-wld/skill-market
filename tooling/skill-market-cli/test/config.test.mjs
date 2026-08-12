import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_BASE_REF,
  DEFAULT_CACHE_TTL_SECONDS,
  DEFAULT_READ_REPO_URL,
  loadEffectiveConfig,
  writeConfig,
} from "../src/config.mjs";
import { SkillMarketError } from "../src/errors.mjs";
import {
  canonicalRepositoryIdentity,
  localRepositoryIdentity,
} from "../src/source-identity.mjs";
import { withTemporaryHome } from "./helpers/temp-env.mjs";

test("in-memory defaults match the canonical catalog without creating config", async () => {
  await withTemporaryHome(async (home) => {
    const effective = await loadEffectiveConfig({ env: { HOME: home } });
    const catalog = JSON.parse(await readFile("catalog/entries.json", "utf8"));
    assert.deepEqual(effective.values, {
      readRepoUrl: DEFAULT_READ_REPO_URL,
      baseRef: DEFAULT_BASE_REF,
      cachePath: path.join(home, ".skill-market/cache/skill-market"),
      cacheTtlSeconds: DEFAULT_CACHE_TTL_SECONDS,
      repoPath: null,
    });
    assert.equal(effective.values.readRepoUrl, catalog.defaults.readRepoUrl);
    assert.equal(effective.values.baseRef, catalog.defaults.baseRef);
    assert.equal(effective.values.cacheTtlSeconds, catalog.defaults.cacheTtlSeconds);
    await assert.rejects(access(effective.paths.configPath), { code: "ENOENT" });
  });
});

test("explicit config writes persist only requested fields and environment wins", async () => {
  await withTemporaryHome(async (home) => {
    const env = { HOME: home };
    const localRepo = path.join(home, "repo");
    const write = await writeConfig({
      env,
      values: { cacheTtlSeconds: 60, repoPath: localRepo },
    });
    assert.deepEqual(JSON.parse(await readFile(write.configPath, "utf8")), {
      schemaVersion: 1,
      cacheTtlSeconds: 60,
      repoPath: localRepo,
    });
    const effective = await loadEffectiveConfig({
      env: { ...env, SKILL_MARKET_CACHE_TTL_SECONDS: "120" },
    });
    assert.equal(effective.values.cacheTtlSeconds, 120);
    assert.equal(effective.sources.cacheTtlSeconds, "env:SKILL_MARKET_CACHE_TTL_SECONDS");
    assert.equal(effective.values.repoPath, localRepo);
  });
});

test("invalid and unknown config values return actionable typed errors", async () => {
  await withTemporaryHome(async (home) => {
    const configPath = path.join(home, "explicit.json");
    await writeConfig({ env: { HOME: home, SKILL_MARKET_CONFIG: configPath }, values: {} });
    const raw = JSON.parse(await readFile(configPath, "utf8"));
    raw.unknown = true;
    const { writeFile } = await import("node:fs/promises");
    await writeFile(configPath, JSON.stringify(raw), "utf8");
    await assert.rejects(
      loadEffectiveConfig({ env: { HOME: home, SKILL_MARKET_CONFIG: configPath } }),
      (error) =>
        error instanceof SkillMarketError &&
        error.code === "invalid-config" &&
        error.details.issues.includes("unknown config fields: unknown"),
    );
  });
});

test("repository identity is transport-independent but local identity is explicit", () => {
  assert.equal(
    canonicalRepositoryIdentity("https://github.com/myqz-wld/skill-market.git"),
    canonicalRepositoryIdentity("git@github.com:myqz-wld/skill-market.git"),
  );
  assert.equal(localRepositoryIdentity("/tmp/skill-market"), "local:/tmp/skill-market");
});
