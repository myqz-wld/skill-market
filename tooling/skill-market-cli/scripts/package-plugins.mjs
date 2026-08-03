#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { writePluginCliBundles } from "../src/packaging.mjs";

function usage() {
  return [
    "Usage: package-plugins.mjs [--check] [--root <repo-root>]",
    "",
    "Copy the canonical Skill Market CLI into the Codex, Claude, and Grok bootstrap plugins.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { check: false, root: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") {
      args.check = true;
    } else if (arg === "--root") {
      const value = argv[index + 1];
      if (!value) throw new TypeError("--root requires a value");
      args.root = value;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new TypeError(`unknown argument: ${arg}`);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const defaultRoot = fileURLToPath(new URL("../../../", import.meta.url));
const root = path.resolve(args.root ?? defaultRoot);
const result = await writePluginCliBundles({ root, check: args.check });
process.stdout.write(
  `${args.check ? "checked" : "generated"} ${result.bundleRoots.length} plugin CLI bundles (${result.fileCount} files each)\n`,
);
