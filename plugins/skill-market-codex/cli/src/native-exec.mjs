import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { SkillMarketError } from "./errors.mjs";

const execFileAsync = promisify(execFile);

export async function executeNative(command, args, env) {
  try {
    const result = await execFileAsync(command, args, {
      env,
      encoding: "utf8",
      timeout: 60000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return result.stdout;
  } catch (error) {
    throw new SkillMarketError({
      code: "native-mutation-failed",
      message: `${command} ${args.join(" ")} failed.`,
      retryable: true,
      details: {
        command,
        args,
        exitCode: error.code,
        stdout: error.stdout?.trim() ?? "",
        stderr: error.stderr?.trim() ?? "",
      },
      nextAction: `Run ${command} with the same arguments, resolve its reported error, and retry.`,
      cause: error,
    });
  }
}
