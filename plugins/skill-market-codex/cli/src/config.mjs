import path from "node:path";

import { SkillMarketError } from "./errors.mjs";
import { atomicWriteJson, readJsonIfExists } from "./fs-utils.mjs";
import { expandHomePath, resolveStatePaths } from "./paths.mjs";
import { validateGitRef, validateReadRepoUrl } from "./source-identity.mjs";

export const DEFAULT_READ_REPO_URL = "https://github.com/myqz-wld/skill-market.git";
export const DEFAULT_BASE_REF = "main";
export const DEFAULT_CACHE_TTL_SECONDS = 86400;

export const CONFIG_KEYS = Object.freeze([
  "readRepoUrl",
  "baseRef",
  "cachePath",
  "cacheTtlSeconds",
  "repoPath",
]);

const ENVIRONMENT_KEYS = Object.freeze({
  readRepoUrl: "SKILL_MARKET_READ_REPO_URL",
  baseRef: "SKILL_MARKET_BASE_REF",
  cachePath: "SKILL_MARKET_CACHE_PATH",
  cacheTtlSeconds: "SKILL_MARKET_CACHE_TTL_SECONDS",
  repoPath: "SKILL_MARKET_REPO_PATH",
});

function parseJsonConfig(value, configPath) {
  if (value === null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw invalidConfig(configPath, ["config must be a JSON object"]);
  }
  const unknown = Object.keys(value).filter(
    (key) => key !== "schemaVersion" && !CONFIG_KEYS.includes(key),
  );
  const issues = [];
  if (value.schemaVersion !== undefined && value.schemaVersion !== 1) {
    issues.push("schemaVersion must equal 1");
  }
  if (unknown.length > 0) {
    issues.push(`unknown config fields: ${unknown.join(", ")}`);
  }
  if (issues.length > 0) {
    throw invalidConfig(configPath, issues);
  }
  return Object.fromEntries(CONFIG_KEYS.filter((key) => value[key] !== undefined).map((key) => [key, value[key]]));
}

function invalidConfig(configPath, issues, cause) {
  return new SkillMarketError({
    code: "invalid-config",
    message: `Skill Market config is invalid: ${issues.join("; ")}.`,
    details: { configPath, issues },
    nextAction: `Fix ${configPath}, or remove it to use in-memory defaults.`,
    cause,
  });
}

async function readStoredConfig(paths) {
  let rawConfig;
  try {
    rawConfig = await readJsonIfExists(paths.configPath);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw invalidConfig(paths.configPath, ["config must contain valid JSON"], error);
    }
    throw error;
  }
  return { rawConfig, fileConfig: parseJsonConfig(rawConfig, paths.configPath) };
}

function parseTtl(value, source) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new SkillMarketError({
      code: "invalid-config",
      message: "cacheTtlSeconds must be a non-negative integer.",
      details: { field: "cacheTtlSeconds", value, source },
      nextAction: "Set cacheTtlSeconds to 0 or a positive whole number of seconds.",
    });
  }
  return parsed;
}

function normalizeValue(key, value, { home, source }) {
  if (key === "readRepoUrl") {
    return validateReadRepoUrl(value);
  }
  if (key === "baseRef") {
    return validateGitRef(value);
  }
  if (key === "cachePath" || key === "repoPath") {
    if (value === null && key === "repoPath") {
      return null;
    }
    return expandHomePath(value, home, key);
  }
  if (key === "cacheTtlSeconds") {
    return parseTtl(value, source);
  }
  throw new TypeError(`unsupported config key: ${key}`);
}

export async function loadEffectiveConfig({ env = process.env, overrides = {} } = {}) {
  const paths = resolveStatePaths(env);
  const { rawConfig, fileConfig } = await readStoredConfig(paths);
  const defaults = {
    readRepoUrl: DEFAULT_READ_REPO_URL,
    baseRef: DEFAULT_BASE_REF,
    cachePath: paths.defaultCachePath,
    cacheTtlSeconds: DEFAULT_CACHE_TTL_SECONDS,
    repoPath: null,
  };
  const values = {};
  const sources = {};
  for (const key of CONFIG_KEYS) {
    const environmentName = ENVIRONMENT_KEYS[key];
    const candidates = [
      ["cli", overrides[key]],
      [`env:${environmentName}`, env[environmentName]],
      ["config", fileConfig[key]],
      ["default", defaults[key]],
    ];
    const [source, value] = candidates.find(([, candidate]) => candidate !== undefined);
    values[key] = normalizeValue(key, value, { home: paths.home, source });
    sources[key] = source;
  }
  return Object.freeze({
    schemaVersion: 1,
    configExists: rawConfig !== null,
    paths,
    values: Object.freeze(values),
    sources: Object.freeze(sources),
  });
}

export async function writeConfig({ env = process.env, values }) {
  const paths = resolveStatePaths(env);
  const normalized = {};
  for (const [key, value] of Object.entries(values)) {
    if (!CONFIG_KEYS.includes(key)) {
      throw invalidConfig(paths.configPath, [`unknown config field: ${key}`]);
    }
    normalized[key] = normalizeValue(key, value, {
      home: paths.home,
      source: "config-write",
    });
  }
  const serializable = {
    schemaVersion: 1,
    ...normalized,
  };
  await atomicWriteJson(paths.configPath, serializable);
  return { configPath: paths.configPath, values: serializable };
}

export async function updateConfig({ env = process.env, patch = {}, unset = [] }) {
  const paths = resolveStatePaths(env);
  const { fileConfig } = await readStoredConfig(paths);
  const next = { ...fileConfig };
  for (const key of unset) {
    if (!CONFIG_KEYS.includes(key)) {
      throw invalidConfig(paths.configPath, [`unknown config field: ${key}`]);
    }
    delete next[key];
  }
  for (const [key, value] of Object.entries(patch)) {
    if (!CONFIG_KEYS.includes(key)) {
      throw invalidConfig(paths.configPath, [`unknown config field: ${key}`]);
    }
    next[key] = value;
  }
  const normalized = Object.fromEntries(
    Object.entries(next).map(([key, value]) => [
      key,
      normalizeValue(key, value, { home: paths.home, source: "config-write" }),
    ]),
  );
  const serializable = { schemaVersion: 1, ...normalized };
  await atomicWriteJson(paths.configPath, serializable);
  return { configPath: paths.configPath, values: serializable };
}

export function parseConfigValue(key, value) {
  if (!CONFIG_KEYS.includes(key)) {
    throw new SkillMarketError({
      code: "unknown-config-key",
      message: `Unknown config key: ${key}.`,
      details: { key, allowed: CONFIG_KEYS },
      nextAction: `Choose one of: ${CONFIG_KEYS.join(", ")}.`,
    });
  }
  if (key === "cacheTtlSeconds") {
    return parseTtl(value, "cli");
  }
  if (key === "repoPath" && value === "null") {
    return null;
  }
  return value;
}

export function configFileView(effective) {
  return {
    configPath: effective.paths.configPath,
    configExists: effective.configExists,
    effective: effective.values,
    sources: effective.sources,
    environment: ENVIRONMENT_KEYS,
    cwdIndependent: true,
    cacheMarkerPath: path.join(effective.values.cachePath, ".skill-market-cache.json"),
  };
}
