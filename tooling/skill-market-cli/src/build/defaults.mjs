import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateCatalog } from "../catalog/catalog.mjs";
import { GeneratedFileDriftError } from "../catalog/generators.mjs";
import { validateReadRepoUrl } from "../shared/source-identity.mjs";

export const CLI_DEFAULTS_PATH = "tooling/skill-market-cli/src/shared/defaults.generated.mjs";

function renderCliDefaults(inputCatalog) {
  const { defaults } = validateCatalog(inputCatalog);
  validateReadRepoUrl(defaults.readRepoUrl, "defaults.readRepoUrl");
  return [
    "// Generated from catalog/entries.json defaults. Do not edit.",
    "// Regenerate with: mise exec -- npm run generate",
    "",
    `export const DEFAULT_READ_REPO_URL = ${JSON.stringify(defaults.readRepoUrl)};`,
    `export const DEFAULT_BASE_REF = ${JSON.stringify(defaults.baseRef)};`,
    `export const DEFAULT_CACHE_TTL_SECONDS = ${JSON.stringify(defaults.cacheTtlSeconds)};`,
    "",
  ].join("\n");
}

export async function writeCliDefaults({ root, catalog, check = false }) {
  const outputPath = path.join(root, CLI_DEFAULTS_PATH);
  const content = renderCliDefaults(catalog);
  if (check) {
    let current = null;
    try {
      current = await readFile(outputPath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (current !== content) throw new GeneratedFileDriftError([CLI_DEFAULTS_PATH]);
  } else {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, "utf8");
  }
  return CLI_DEFAULTS_PATH;
}
