import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ADAPTERS = Object.freeze(["codex", "claude", "grok"]);
const SOURCE_DIRECTORIES = Object.freeze(["bin", "src"]);
const BUILD_ONLY_FILES = new Set(["src/packaging.mjs"]);

export class PluginBundleDriftError extends Error {
  constructor(paths) {
    super(`plugin CLI bundles are missing or stale: ${paths.join(", ")}`);
    this.name = "PluginBundleDriftError";
    this.paths = paths;
  }
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function collectFiles(root, relative = "") {
  const directory = path.join(root, relative);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) {
      throw new TypeError(`plugin bundle source cannot contain symlinks: ${child}`);
    }
    if (entry.isDirectory()) {
      files.push(...await collectFiles(root, child));
    } else if (entry.isFile()) {
      files.push(child);
    }
  }
  return files;
}

async function sourceBundle(root) {
  const sourceRoot = path.join(root, "tooling/skill-market-cli");
  const files = [];
  for (const directory of SOURCE_DIRECTORIES) {
    for (const relativePath of await collectFiles(path.join(sourceRoot, directory))) {
      const bundlePath = path.posix.join(directory, relativePath.split(path.sep).join(path.posix.sep));
      if (BUILD_ONLY_FILES.has(bundlePath)) continue;
      const sourcePath = path.join(sourceRoot, directory, relativePath);
      const content = await readFile(sourcePath);
      files.push({ bundlePath, sourcePath, content, sha256: sha256(content) });
    }
  }
  files.sort((left, right) => left.bundlePath.localeCompare(right.bundlePath));
  if (!files.some((file) => file.bundlePath === "bin/skill-market.mjs")) {
    throw new TypeError("plugin bundle source is missing bin/skill-market.mjs");
  }
  return files;
}

function manifest(files) {
  return `${JSON.stringify({
    schemaVersion: 1,
    generatedFrom: "tooling/skill-market-cli",
    files: files.map((file) => ({ path: file.bundlePath, sha256: file.sha256 })),
  }, null, 2)}\n`;
}

async function currentBundleFiles(bundleRoot) {
  return (await collectFiles(bundleRoot))
    .map((file) => file.split(path.sep).join(path.posix.sep))
    .sort();
}

async function checkBundle(bundleRoot, files, manifestContent) {
  const expected = new Map(files.map((file) => [file.bundlePath, file.content]));
  expected.set("manifest.json", Buffer.from(manifestContent));
  const drift = [];
  const current = await currentBundleFiles(bundleRoot);
  for (const relativePath of new Set([...expected.keys(), ...current])) {
    const expectedContent = expected.get(relativePath);
    if (expectedContent === undefined) {
      drift.push(path.join(bundleRoot, relativePath));
      continue;
    }
    let actual = null;
    try {
      actual = await readFile(path.join(bundleRoot, relativePath));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (actual === null || !actual.equals(expectedContent)) {
      drift.push(path.join(bundleRoot, relativePath));
    }
  }
  return drift;
}

async function writeBundle(bundleRoot, files, manifestContent) {
  await rm(bundleRoot, { recursive: true, force: true });
  for (const file of files) {
    const outputPath = path.join(bundleRoot, file.bundlePath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await copyFile(file.sourcePath, outputPath);
  }
  await writeFile(path.join(bundleRoot, "manifest.json"), manifestContent, "utf8");
}

export async function writePluginCliBundles({ root, check = false }) {
  const files = await sourceBundle(root);
  const manifestContent = manifest(files);
  const bundleRoots = ADAPTERS.map((adapter) =>
    path.join(root, "plugins", `skill-market-${adapter}`, "cli")
  );
  if (check) {
    const drift = [];
    for (const bundleRoot of bundleRoots) {
      drift.push(...await checkBundle(bundleRoot, files, manifestContent));
    }
    if (drift.length > 0) throw new PluginBundleDriftError(drift.sort());
  } else {
    for (const bundleRoot of bundleRoots) {
      await writeBundle(bundleRoot, files, manifestContent);
    }
  }
  return {
    bundleRoots,
    fileCount: files.length + 1,
    manifest: JSON.parse(manifestContent),
  };
}
