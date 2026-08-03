import path from "node:path";

import { SkillMarketError } from "./errors.mjs";

function requiredAbsolutePath(value, field) {
  if (typeof value !== "string" || value.trim() === "" || !path.isAbsolute(value)) {
    throw new SkillMarketError({
      code: "invalid-path",
      message: `${field} must be an absolute path.`,
      details: { field, value },
      nextAction: `Set ${field} to an absolute filesystem path.`,
    });
  }
  return path.normalize(value);
}

export function expandHomePath(value, home, field = "path") {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SkillMarketError({
      code: "invalid-path",
      message: `${field} must be a non-empty path.`,
      details: { field, value },
      nextAction: `Set ${field} to an absolute path or a path beginning with ~/.`,
    });
  }
  if (value === "~") {
    return home;
  }
  if (value.startsWith("~/")) {
    return path.join(home, value.slice(2));
  }
  return requiredAbsolutePath(value, field);
}

export function resolveStatePaths(env = process.env) {
  const home = requiredAbsolutePath(env.HOME, "HOME");
  const marketHome = env.SKILL_MARKET_HOME
    ? expandHomePath(env.SKILL_MARKET_HOME, home, "SKILL_MARKET_HOME")
    : path.join(home, ".skill-market");
  const configPath = env.SKILL_MARKET_CONFIG
    ? expandHomePath(env.SKILL_MARKET_CONFIG, home, "SKILL_MARKET_CONFIG")
    : path.join(marketHome, "config.json");
  return Object.freeze({
    home,
    marketHome,
    configPath,
    managedStatePath: path.join(marketHome, "managed-state.json"),
    defaultCachePath: path.join(marketHome, "cache", "skill-market"),
    downloadsRoot: path.join(marketHome, "downloads"),
    locksRoot: path.join(marketHome, "locks"),
  });
}
