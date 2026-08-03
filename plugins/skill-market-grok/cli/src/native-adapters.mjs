import path from "node:path";

import { getAdapterCapabilities } from "./capabilities.mjs";
import { SkillMarketError } from "./errors.mjs";
import { createGitClient } from "./git-client.mjs";
import { executeNative } from "./native-exec.mjs";
import { readNativePlugins } from "./native-inventory.mjs";
import {
  verifyGrokInstalledSource,
  verifyNativeMarketplace,
} from "./native-source.mjs";

export { verifyNativeMarketplace } from "./native-source.mjs";
const CLAUDE_SCOPES = Object.freeze(["user", "project", "local", "managed"]);


async function installedPlugin({ entry, env, readPlugins }) {
  const items = await readPlugins({
    adapter: entry.adapter,
    marketplaceName: "skill-market",
    packageNames: [entry.name],
    env,
  });
  return items.find((item) => item.id === entry.id) ?? null;
}

function unsupported(adapter, operation, detail) {
  return new SkillMarketError({
    code: "unsupported-capability",
    message: `${adapter} does not support native plugin ${operation}.`,
    status: "unsupported",
    details: { adapter, operation, detail },
    nextAction: detail,
  });
}

function claudeScope(operation, installed, requested) {
  if (installed && !installed.native.scope && !requested) {
    throw new SkillMarketError({
      code: "native-scope-unknown",
      message: `Claude did not report the installed scope required for plugin ${operation}.`,
      status: "blocked",
      details: { operation, installedScope: null },
      nextAction: "Inspect the native Claude plugin installation, then retry with its exact --scope.",
    });
  }
  const scope = requested ?? installed?.native.scope ?? "user";
  if (!CLAUDE_SCOPES.includes(scope)) {
    throw new SkillMarketError({
      code: "invalid-native-scope",
      message: `Unsupported Claude plugin scope: ${scope}.`,
      details: { operation, scope, allowed: CLAUDE_SCOPES },
      nextAction: `Choose a Claude scope from: ${CLAUDE_SCOPES.join(", ")}.`,
    });
  }
  if (requested && installed?.native.scope && requested !== installed.native.scope) {
    throw new SkillMarketError({
      code: "native-scope-mismatch",
      message: "Requested Claude scope differs from the installed plugin scope.",
      status: "blocked",
      details: { requested, installed: installed.native.scope },
      nextAction: "Retry without --scope to preserve the detected scope, or target the correct installation explicitly.",
    });
  }
  if (operation === "install" && scope === "managed") {
    throw new SkillMarketError({
      code: "invalid-native-scope",
      message: "Claude plugin install does not accept managed scope.",
      details: { operation, scope, allowed: ["user", "project", "local"] },
      nextAction: "Choose user, project, or local scope for installation.",
    });
  }
  if (["enable", "disable", "uninstall"].includes(operation) && scope === "managed") {
    throw unsupported(
      "claude",
      operation,
      "A managed-scope Claude plugin must be changed by its managing policy.",
    );
  }
  return scope;
}

async function runCodex({
  operation,
  entry,
  installed,
  snapshot,
  repository,
  options,
  execute,
  git,
  env,
}) {
  const selector = `${entry.name}@skill-market`;
  let verifiedMarketplace = null;
  if (["enable", "disable"].includes(operation)) {
    const capability = getAdapterCapabilities("codex").plugin.operations[operation];
    throw unsupported("codex", operation, capability.detail);
  }
  if (["install", "update"].includes(operation)) {
    verifiedMarketplace = await verifyNativeMarketplace({
      adapter: "codex",
      snapshot,
      repository,
      execute,
      git,
      env,
    });
  } else if (installed && operation === "uninstall") {
    await verifyNativeMarketplace({ adapter: "codex", repository, execute, git, env });
  }
  if (operation === "install") {
    if (installed) return nativeAlreadyInstalled(entry, installed);
    await execute("codex", ["plugin", "add", selector, "--json"], env);
  } else if (operation === "update") {
    if (!installed) throw nativeMissing(entry, operation);
    if (!options.force && installed.installedVersion === entry.version) {
      return nativeCurrent(entry, installed);
    }
    if (!options.confirmReinstall) {
      throw new SkillMarketError({
        code: "codex-reinstall-confirmation",
        message: "Codex plugin update requires a remove/reinstall sequence.",
        status: "needs_confirmation",
        details: { id: entry.id, installedVersion: installed.installedVersion, catalogVersion: entry.version },
        nextAction: "Confirm the bounded reinstall risk, then retry with --confirm-reinstall.",
      });
    }
    if (!verifiedMarketplace.identity.localPath) {
      await execute("codex", ["plugin", "marketplace", "upgrade", "skill-market", "--json"], env);
    }
    await execute("codex", ["plugin", "remove", selector, "--json"], env);
    try {
      await execute("codex", ["plugin", "add", selector, "--json"], env);
      return nativeSuccess(operation, entry, [{
        code: "restart-required",
        message: "Start a new Codex session to apply the plugin update.",
      }]);
    } catch (firstError) {
      try {
        await execute("codex", ["plugin", "add", selector, "--json"], env);
        return nativeSuccess(operation, entry, [
          {
            code: "codex-reinstall-retried",
            message: "The first Codex reinstall failed; one bounded retry succeeded.",
          },
          {
            code: "restart-required",
            message: "Start a new Codex session to apply the plugin update.",
          },
        ]);
      } catch (secondError) {
        throw new SkillMarketError({
          code: "codex-reinstall-failed",
          message: "Codex removed the old plugin but both bounded reinstall attempts failed.",
          status: "blocked",
          details: { id: entry.id, firstError: firstError.message, secondError: secondError.message },
          nextAction: `Restore repository access, then run codex plugin add ${selector} --json immediately.`,
          cause: secondError,
        });
      }
    }
  } else if (operation === "uninstall") {
    if (!installed) return nativeAbsent(entry);
    await execute("codex", ["plugin", "remove", selector, "--json"], env);
  }
  return nativeSuccess(operation, entry);
}

async function runClaude({
  operation,
  entry,
  installed,
  snapshot,
  repository,
  options,
  execute,
  git,
  env,
}) {
  const selector = `${entry.name}@skill-market`;
  if (operation === "install" && installed) {
    if (options.scope !== undefined) {
      claudeScope(operation, installed, options.scope);
    }
    await verifyNativeMarketplace({ adapter: "claude", snapshot, repository, execute, git, env });
    return nativeAlreadyInstalled(entry, installed);
  }
  const scope = claudeScope(operation, installed, options.scope);
  if (["install", "update"].includes(operation)) {
    await verifyNativeMarketplace({ adapter: "claude", snapshot, repository, execute, git, env });
  } else if (installed) {
    await verifyNativeMarketplace({ adapter: "claude", repository, execute, git, env });
  }
  if (operation === "install") {
    await execute("claude", ["plugin", "install", selector, "--scope", scope], env);
  } else if (operation === "update") {
    if (!installed) throw nativeMissing(entry, operation);
    if (!options.force && installed.installedVersion === entry.version) return nativeCurrent(entry, installed);
    await execute("claude", ["plugin", "update", selector, "--scope", scope], env);
  } else if (operation === "enable" || operation === "disable") {
    if (!installed) throw nativeMissing(entry, operation);
    const desired = operation === "enable" ? "active" : "disabled";
    if (installed.localState === desired) return nativeActivationCurrent(entry, desired);
    await execute("claude", ["plugin", operation, selector, "--scope", scope], env);
  } else if (operation === "uninstall") {
    if (!installed) return nativeAbsent(entry);
    const args = ["plugin", "uninstall", selector, "--scope", scope];
    if (!options.removeData) args.push("--keep-data");
    await execute("claude", args, env);
  }
  const warnings = operation === "update" ? [{ code: "restart-required", message: "Restart Claude Code to apply the plugin update." }] : [];
  return nativeSuccess(operation, entry, warnings, { scope });
}

function grokInstalledSource(installed) {
  const raw = installed?.native?.source;
  if (typeof raw === "string") return raw;
  return raw?.path ?? raw?.url ?? raw?.source ?? null;
}

async function reinstallLocalGrok({ entry, installed, source, execute, env }) {
  await execute(
    "grok",
    ["plugin", "uninstall", entry.name, "--confirm", "--keep-data"],
    env,
  );
  let retried = false;
  try {
    await execute("grok", ["plugin", "install", source, "--trust"], env);
  } catch (firstError) {
    try {
      await execute("grok", ["plugin", "install", source, "--trust"], env);
      retried = true;
    } catch (secondError) {
      throw new SkillMarketError({
        code: "grok-reinstall-failed",
        message: "Grok removed the old local-source plugin but both bounded reinstall attempts failed.",
        status: "blocked",
        details: {
          id: entry.id,
          source,
          firstError: firstError.message,
          secondError: secondError.message,
        },
        nextAction: `Restore source access, then run grok plugin install ${JSON.stringify(source)} --trust immediately.`,
        cause: secondError,
      });
    }
  }
  if (installed.localState === "disabled") {
    await execute("grok", ["plugin", "disable", entry.name], env);
  }
  const warnings = [
    {
      code: "grok-local-source-reinstalled",
      message: "Grok local-source version metadata was refreshed with a keep-data reinstall.",
    },
  ];
  if (retried) {
    warnings.unshift({
      code: "grok-reinstall-retried",
      message: "The first Grok reinstall failed; one bounded retry succeeded.",
    });
  }
  return nativeSuccess("update", entry, warnings);
}

async function runGrok({
  operation,
  entry,
  installed,
  snapshot,
  repository,
  options,
  execute,
  git,
  env,
}) {
  if (operation === "install") {
    if (installed) {
      await verifyGrokInstalledSource({
        entry,
        installed,
        snapshot,
        repository,
        git,
        confirmSourceChange: options.confirmSourceChange,
      });
      return nativeAlreadyInstalled(entry, installed);
    }
    if (!options.confirmTrust) {
      throw new SkillMarketError({
        code: "grok-trust-confirmation",
        message: "Grok plugin installation requires explicit trust confirmation.",
        status: "needs_confirmation",
        details: { id: entry.id, sourcePath: path.join(snapshot.root, entry.path) },
        nextAction: "Inspect the plugin source, then retry with --confirm-trust.",
      });
    }
    await execute("grok", ["plugin", "install", path.join(snapshot.root, entry.path), "--trust"], env);
  } else if (operation === "update") {
    if (!installed) throw nativeMissing(entry, operation);
    if (!options.force && installed.installedVersion === entry.version) return nativeCurrent(entry, installed);
    await verifyGrokInstalledSource({
      entry,
      installed,
      snapshot,
      repository,
      git,
      confirmSourceChange: options.confirmSourceChange,
    });
    const source = grokInstalledSource(installed);
    if (source && path.isAbsolute(source)) {
      return reinstallLocalGrok({ entry, installed, source, execute, env });
    }
    await execute("grok", ["plugin", "update", entry.name], env);
  } else if (operation === "enable" || operation === "disable") {
    if (!installed) throw nativeMissing(entry, operation);
    await verifyGrokInstalledSource({
      entry,
      installed,
      snapshot,
      repository,
      git,
      confirmSourceChange: options.confirmSourceChange,
    });
    const desired = operation === "enable" ? "active" : "disabled";
    if (installed.localState === desired) return nativeActivationCurrent(entry, desired);
    await execute("grok", ["plugin", operation, entry.name], env);
  } else if (operation === "uninstall") {
    if (!installed) return nativeAbsent(entry);
    await verifyGrokInstalledSource({
      entry,
      installed,
      snapshot,
      repository,
      git,
      confirmSourceChange: options.confirmSourceChange,
    });
    const args = ["plugin", "uninstall", entry.name, "--confirm"];
    if (!options.removeData) args.push("--keep-data");
    await execute("grok", args, env);
  }
  return nativeSuccess(operation, entry);
}

function nativeMissing(entry, operation) {
  return new SkillMarketError({
    code: "native-plugin-missing",
    message: `${entry.id} is not installed and cannot be ${operation}d.`,
    status: "blocked",
    details: { id: entry.id, operation },
    nextAction: "Install the exact catalog plugin first.",
  });
}

function nativeAlreadyInstalled(entry, installed) {
  if (
    installed.installedVersion &&
    entry.version &&
    installed.installedVersion !== entry.version
  ) {
    throw new SkillMarketError({
      code: "native-plugin-update-required",
      message: `${entry.id} is installed at ${installed.installedVersion}, but the catalog provides ${entry.version}.`,
      status: "blocked",
      details: {
        id: entry.id,
        installedVersion: installed.installedVersion,
        catalogVersion: entry.version,
      },
      nextAction: `Run skill-market update ${entry.id} with any adapter-specific confirmation it requests.`,
    });
  }
  return {
    status: "noop",
    summary: `${entry.id} is already installed.`,
    data: { id: entry.id, installedVersion: installed.installedVersion, localState: installed.localState },
    warnings: [],
  };
}

function nativeCurrent(entry, installed) {
  return {
    status: "noop",
    summary: `${entry.id} is already current.`,
    data: { id: entry.id, installedVersion: installed.installedVersion },
    warnings: [],
  };
}

function nativeActivationCurrent(entry, activation) {
  return {
    status: "noop",
    summary: `${entry.id} is already ${activation}.`,
    data: { id: entry.id, localState: activation },
    warnings: [],
  };
}

function nativeAbsent(entry) {
  return {
    status: "noop",
    summary: `${entry.id} is not installed.`,
    data: { id: entry.id, localState: "absent" },
    warnings: [],
  };
}

function nativeSuccess(operation, entry, warnings = [], extra = {}) {
  const verbs = { install: "Installed", update: "Updated", enable: "Enabled", disable: "Disabled", uninstall: "Uninstalled" };
  return {
    status: "ok",
    summary: `${verbs[operation]} ${entry.id}.`,
    data: { id: entry.id, operation, ...extra },
    warnings,
  };
}

export async function runNativePluginLifecycle({
  operation,
  entry,
  snapshot = null,
  options = {},
  env = process.env,
  execute = executeNative,
  readPlugins = readNativePlugins,
  git = createGitClient(),
  repository = null,
}) {
  const capability = getAdapterCapabilities(entry.adapter).plugin.operations[operation];
  if (!capability || capability.level === "unsupported") {
    throw unsupported(entry.adapter, operation, capability?.detail ?? "No native command is available.");
  }
  const installed = await installedPlugin({ entry, env, readPlugins });
  const input = {
    operation,
    entry,
    installed,
    snapshot,
    repository,
    options,
    execute,
    git,
    env,
  };
  if (entry.adapter === "codex") return runCodex(input);
  if (entry.adapter === "claude") return runClaude(input);
  return runGrok(input);
}
