import { CLI_VERSION } from "./version.mjs";
import { lifecycleHelpContract } from "./lifecycle-help.mjs";
import { proposalHelpContract } from "./proposal-help.mjs";
import { commandOptionHelp, optionHelp, GLOBAL_OPTION_NAMES, SOURCE_OPTION_NAMES } from "./registry.mjs";

export function helpContract() {
  const lifecycle = lifecycleHelpContract();
  const proposal = proposalHelpContract();
  return {
    contractVersion: 1,
    version: CLI_VERSION,
    output: {
      format: "one JSON object on stdout; --pretty adds indentation only",
      success: {
        schemaVersion: "1",
        ok: "true",
        status: "ok | noop",
        command: "string",
        summary: "string",
        data: "command-specific object | null",
      },
      failure: {
        schemaVersion: "1",
        ok: "false",
        status: "needs_confirmation | blocked | unsupported | error",
        command: "string",
        error: {
          code: "stable kebab-case string",
          message: "self-contained failure message",
          retryable: "boolean",
          nextAction: "string | null",
          details: "object | null",
        },
      },
    },
    globalOptions: optionHelp(GLOBAL_OPTION_NAMES),
    commands: {
      list: {
        purpose: "List local Skill Market native plugins and managed standalone skills without network refresh.",
        positionals: { type: "none", required: false },
        options: commandOptionHelp("list"),
        sideEffects: "Runs adapter-native plugin list commands and reads managed state. It never clones, fetches, or writes config/cache/package state.",
        idempotent: true,
      },
      discover: {
        purpose: "Browse or search the canonical catalog; exact, prefix, token, then description ranking.",
        positionals: { name: "query", type: "string", required: false, default: "" },
        options: commandOptionHelp("discover"),
        constraints: ["--latest and --offline are mutually exclusive"],
        sideEffects: "May clone or refresh only the configured catalog cache and its marker. It reads local inventory annotations but never changes installed packages.",
        stalePolicy: "Refresh failure may return the existing cache with freshness=stale and a warning; source/ref mismatches always block.",
        idempotent: true,
      },
      ...lifecycle.commands,
      proposal: proposal.command,
      config: {
        purpose: "Inspect or explicitly change Skill Market configuration.",
        actions: {
          show: { positionals: [], writes: false },
          set: { positionals: ["key", "value"], writes: "atomically replaces that explicit config field" },
          unset: { positionals: ["key"], writes: "atomically removes that explicit config field" },
        },
        keys: ["readRepoUrl", "baseRef", "cachePath", "cacheTtlSeconds", "repoPath"],
        precedence: "command override > environment > config file > in-memory default",
        idempotent: true,
      },
    },
    lifecycle: lifecycle.contract,
    proposal: proposal.contract,
    sourceOptions: optionHelp(SOURCE_OPTION_NAMES),
    environment: {
      SKILL_MARKET_HOME: "absolute or ~/ state root",
      SKILL_MARKET_CONFIG: "absolute or ~/ config JSON path",
      SKILL_MARKET_READ_REPO_URL: "readRepoUrl override",
      SKILL_MARKET_BASE_REF: "baseRef override",
      SKILL_MARKET_CACHE_PATH: "cachePath override",
      SKILL_MARKET_CACHE_TTL_SECONDS: "cacheTtlSeconds override",
      SKILL_MARKET_REPO_PATH: "repoPath override",
    },
    exitCodes: { ok: 0, error: 1, needsConfirmation: 2, blocked: 3, unsupported: 4 },
  };
}
