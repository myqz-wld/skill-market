#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateRepositoryPlugins } from "../src/build/plugin-validation.mjs";

try {
  const args = process.argv.slice(2);
  if (args.length !== 0 && !(args.length === 2 && args[0] === "--root" && args[1])) {
    throw new TypeError("Usage: validate-plugins.mjs [--root <repo-root>]");
  }
  const root = path.resolve(args[1] ?? fileURLToPath(new URL("../../../", import.meta.url)));
  const results = await validateRepositoryPlugins({ root });
  process.stdout.write(`checked ${results.length} plugin manifests and their skill entry paths\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
