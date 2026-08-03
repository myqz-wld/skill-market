#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCatalog } from "../src/catalog.mjs";
import { writeCatalogViews } from "../src/generators.mjs";

function usage() {
  return [
    "Usage: generate-catalogs.mjs [--check] [--root <repo-root>] [--catalog <catalog-file>]",
    "",
    "Generate native marketplace catalogs and skills/INDEX.md from catalog/entries.json.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { check: false, root: null, catalog: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") {
      args.check = true;
    } else if (arg === "--root" || arg === "--catalog") {
      const value = argv[index + 1];
      if (!value) {
        throw new TypeError(`${arg} requires a value`);
      }
      args[arg.slice(2)] = value;
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
const catalogPath = path.resolve(args.catalog ?? path.join(root, "catalog/entries.json"));
const catalog = await loadCatalog(catalogPath);
const paths = await writeCatalogViews({ root, catalog, check: args.check });
process.stdout.write(`${args.check ? "checked" : "generated"} ${paths.length} catalog views\n`);
