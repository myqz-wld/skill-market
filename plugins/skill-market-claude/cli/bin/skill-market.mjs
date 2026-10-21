#!/usr/bin/env node

import { runCli } from "../src/cli/index.mjs";

const argv = process.argv.slice(2);
const result = await runCli(argv);
const terminator = argv.indexOf("--");
const pretty = argv.slice(0, terminator < 0 ? undefined : terminator).includes("--pretty");
process.stdout.write(`${JSON.stringify(result, null, pretty ? 2 : 0)}\n`);
const exitCodes = {
  needs_confirmation: 2,
  blocked: 3,
  unsupported: 4,
  error: 1,
};
process.exitCode = result.ok ? 0 : (exitCodes[result.status] ?? 1);
