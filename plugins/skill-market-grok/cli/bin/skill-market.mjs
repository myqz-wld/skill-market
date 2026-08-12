#!/usr/bin/env node

import { runCli } from "../src/cli.mjs";

const result = await runCli(process.argv.slice(2));
const pretty = process.argv.includes("--pretty");
process.stdout.write(`${JSON.stringify(result, null, pretty ? 2 : 0)}\n`);
const exitCodes = {
  needs_confirmation: 2,
  blocked: 3,
  unsupported: 4,
  error: 1,
};
process.exitCode = result.ok ? 0 : (exitCodes[result.status] ?? 1);
