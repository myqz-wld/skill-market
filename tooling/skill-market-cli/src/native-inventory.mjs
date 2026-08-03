import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { ADAPTERS, isKebabCase, makePackageId } from "./contracts.mjs";
import { SkillMarketError } from "./errors.mjs";

const execFileAsync = promisify(execFile);

function commandFor(adapter, marketplaceName) {
  if (adapter === "codex") {
    return ["codex", ["plugin", "list", "--marketplace", marketplaceName, "--json"]];
  }
  return [adapter, ["plugin", "list", "--json"]];
}

async function executeNative(command, args, env) {
  try {
    const result = await execFileAsync(command, args, {
      env,
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return result.stdout;
  } catch (error) {
    throw new SkillMarketError({
      code: error.code === "ENOENT" ? "native-cli-unavailable" : "native-list-failed",
      message:
        error.code === "ENOENT"
          ? `The ${command} CLI is not available.`
          : `${command} plugin list failed.`,
      retryable: error.code !== "ENOENT",
      details: {
        adapter: command,
        args,
        exitCode: error.code,
        stderr: error.stderr?.trim() ?? "",
      },
      nextAction:
        error.code === "ENOENT"
          ? `Install ${command} or filter list to another adapter.`
          : `Run ${command} plugin list --json directly, resolve its error, and retry.`,
      cause: error,
    });
  }
}

function splitPluginId(value) {
  if (typeof value !== "string") return {};
  const separator = value.lastIndexOf("@");
  if (separator <= 0 || separator === value.length - 1) return { name: value };
  return { name: value.slice(0, separator), marketplaceName: value.slice(separator + 1) };
}

function rawEntries(adapter, payload) {
  if (adapter === "codex") {
    return Array.isArray(payload?.installed) ? payload.installed : null;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return Array.isArray(payload?.installed) ? payload.installed : null;
}

export function parseNativePluginList(
  adapter,
  raw,
  { marketplaceName = "skill-market", packageNames = [] } = {},
) {
  if (!ADAPTERS.includes(adapter)) {
    throw new TypeError(`unsupported adapter: ${adapter}`);
  }
  let payload;
  try {
    payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    throw invalidNativeOutput(adapter, "output is not valid JSON", error);
  }
  const entries = rawEntries(adapter, payload);
  if (!entries) {
    throw invalidNativeOutput(adapter, "output does not contain an installed plugin array");
  }
  const normalized = [];
  for (const [index, entry] of entries.entries()) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw invalidNativeOutput(adapter, `installed[${index}] must be an object`);
    }
    const split = splitPluginId(entry.pluginId ?? entry.id);
    const name = entry.name ?? split.name;
    const market = entry.marketplaceName ?? split.marketplaceName;
    const belongsToMarket =
      market === marketplaceName ||
      (adapter === "grok" && market === undefined && packageNames.includes(name));
    if (!belongsToMarket || entry.installed === false) {
      continue;
    }
    if (!isKebabCase(name)) {
      throw invalidNativeOutput(adapter, `installed[${index}] has an invalid plugin name`);
    }
    normalized.push({
      id: makePackageId(adapter, "plugin", name),
      adapter,
      kind: "plugin",
      name,
      installedVersion: typeof entry.version === "string" ? entry.version : null,
      localState: entry.enabled === false ? "disabled" : "active",
      drifted: null,
      ownership: "native",
      location: entry.source?.path ?? entry.installPath ?? null,
      native: {
        marketplaceName: market,
        pluginId: entry.pluginId ?? entry.id ?? `${name}@${market}`,
        scope: entry.scope ?? null,
        marketplaceSource: entry.marketplaceSource ?? null,
        source: entry.source ?? entry.repository ?? null,
      },
    });
  }
  return normalized.sort((left, right) => left.id.localeCompare(right.id));
}

function invalidNativeOutput(adapter, issue, cause) {
  return new SkillMarketError({
    code: "invalid-native-output",
    message: `${adapter} plugin list returned an unsupported JSON shape: ${issue}.`,
    status: "blocked",
    details: { adapter, issue },
    nextAction: `Check the installed ${adapter} CLI version and update the Skill Market adapter fixture before retrying.`,
    cause,
  });
}

export async function readNativePlugins({
  adapter,
  marketplaceName = "skill-market",
  packageNames = adapter === "grok" ? ["skill-market-grok"] : [],
  env = process.env,
  execute = executeNative,
} = {}) {
  const [command, args] = commandFor(adapter, marketplaceName);
  const raw = await execute(command, args, env);
  return parseNativePluginList(adapter, raw, { marketplaceName, packageNames });
}
