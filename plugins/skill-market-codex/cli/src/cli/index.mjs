import { parseOptions, requirePositionals } from "./arguments.mjs";
import { failureResult, successResult } from "../shared/contracts.mjs";
import { asSkillMarketError, SkillMarketError } from "../shared/errors.mjs";
import { optionsFor, COMMAND_NAMES, LIFECYCLE_COMMANDS, PROPOSAL_PHASES } from "./registry.mjs";
import { servicesWithDefaults } from "./services.mjs";
import { runList, runDiscover, runLifecycle, runProposal, runConfig } from "./handlers.mjs";
import { helpContract } from "./help.mjs";
import { CLI_VERSION } from "./version.mjs";

export { helpContract, CLI_VERSION };

export async function runCli(argv, { env = process.env, ...dependencies } = {}) {
  const command = argv[0] ?? "help";
  const services = servicesWithDefaults(dependencies);
  try {
    if (command === "help" || command === "--help" || command === "-h") {
      return successResult({
        command: "help",
        summary: "Skill Market CLI command contract.",
        data: helpContract(),
      });
    }
    if (command === "--version") {
      return successResult({ command: "version", summary: CLI_VERSION, data: { version: CLI_VERSION } });
    }
    if (command === "list") {
      const parsed = parseOptions(argv.slice(1), optionsFor("list"));
      requirePositionals(parsed.positionals, { min: 0, usage: "list [options]" });
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runList(parsed.options, services, env);
    }
    if (command === "discover") {
      const parsed = parseOptions(argv.slice(1), optionsFor("discover"));
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runDiscover(parsed.options, parsed.positionals, services, env);
    }
    if (LIFECYCLE_COMMANDS.includes(command)) {
      const parsed = parseOptions(argv.slice(1), optionsFor(command));
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runLifecycle(command, parsed.options, parsed.positionals, services, env);
    }
    if (command === "proposal") {
      const action = argv[1];
      if (action === undefined || action === "--help" || action === "help") {
        return runCli(["help"], { env, ...dependencies });
      }
      if (!PROPOSAL_PHASES.includes(action)) {
        throw new SkillMarketError({
          code: "unknown-proposal-action",
          message: `Unknown proposal action: ${action}.`,
          details: { action, allowed: PROPOSAL_PHASES },
          nextAction: "Use proposal plan, prepare, submit, status, or abort.",
        });
      }
      const parsed = parseOptions(argv.slice(2), optionsFor("proposal", action));
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runProposal(action, parsed.options, parsed.positionals, services, env);
    }
    if (command === "config") {
      const parsed = parseOptions(argv.slice(1), optionsFor("config"));
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runConfig(parsed.positionals, services, env);
    }
    throw new SkillMarketError({
      code: "unknown-command",
      message: `Unknown Skill Market command: ${command}.`,
      details: {
        command,
        allowed: [...COMMAND_NAMES, "help"],
      },
      nextAction: "Run skill-market help and choose a canonical command.",
    });
  } catch (error) {
    const failure = asSkillMarketError(error);
    return failureResult({
      command,
      code: failure.code,
      message: failure.message,
      status: failure.status,
      retryable: failure.retryable,
      nextAction: failure.nextAction,
      details: failure.details,
    });
  }
}
