import path from "node:path";
import { randomUUID } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";

import { ADAPTERS, isKebabCase } from "./contracts.mjs";
import { SkillMarketError } from "./errors.mjs";

const ADAPTER_DIRECTORIES = Object.freeze({
  claude: ".claude",
  codex: ".codex",
  grok: ".grok",
});

function assertSafeHome(home) {
  if (!path.isAbsolute(home) || path.parse(home).root === path.normalize(home)) {
    throw new SkillMarketError({
      code: "unsafe-home-path",
      message: "Lifecycle operations require an absolute HOME below the filesystem root.",
      status: "blocked",
      details: { home },
      nextAction: "Set HOME to the intended user profile directory before retrying.",
    });
  }
}

export function assertPathInside(root, target, field = "path") {
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new SkillMarketError({
      code: "unsafe-target-path",
      message: `${field} must be a child of its managed root.`,
      status: "blocked",
      details: { field, root, target },
      nextAction: "Use the canonical adapter package path derived from HOME and package identity.",
    });
  }
  return target;
}

export function resolveStandalonePaths({ adapter, name, home, marketHome }) {
  if (!ADAPTERS.includes(adapter) || !isKebabCase(name)) {
    throw new SkillMarketError({
      code: "invalid-package-identity",
      message: "Standalone paths require a supported adapter and kebab-case package name.",
      details: { adapter, name },
      nextAction: "Use the canonical <adapter>:standalone:<name> package id.",
    });
  }
  assertSafeHome(home);
  const adapterRoot = path.join(home, ADAPTER_DIRECTORIES[adapter]);
  const activeRoot = path.join(adapterRoot, "skills");
  const disabledRoot = path.join(adapterRoot, "skills.disabled");
  const activePath = assertPathInside(activeRoot, path.join(activeRoot, name), "activePath");
  const disabledPath = assertPathInside(
    disabledRoot,
    path.join(disabledRoot, name),
    "disabledPath",
  );
  return Object.freeze({
    home,
    marketHome,
    adapterRoot,
    activeRoot,
    disabledRoot,
    activePath,
    disabledPath,
    transactionRoot: path.join(
      adapterRoot,
      ".skill-market-transactions",
      `${name}-${randomUUID()}`,
    ),
    lifecycleLock: path.join(marketHome, "locks", "lifecycle.lock"),
  });
}

async function metadataIfExists(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function unsafeTopology(label, target, issue) {
  return new SkillMarketError({
    code: "unsafe-path-topology",
    message: `${label} has unsafe filesystem topology at ${target}: ${issue}.`,
    status: "blocked",
    details: { label, target, issue },
    nextAction: "Replace the symlink or non-directory ancestor with the intended real managed directory, then retry.",
  });
}

async function assertNearestExistingDirectory(target, label) {
  let current = target;
  while (true) {
    const metadata = await metadataIfExists(current);
    if (metadata) {
      if (metadata.isSymbolicLink()) {
        throw unsafeTopology(label, current, "nearest existing ancestor is a symbolic link");
      }
      if (!metadata.isDirectory()) {
        throw unsafeTopology(label, current, "nearest existing ancestor is not a directory");
      }
      return;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw unsafeTopology(label, target, "no existing directory ancestor was found");
    }
    current = parent;
  }
}

async function assertDirectoryChain(root, target, label, { rootRequired = false } = {}) {
  if (
    !path.isAbsolute(root) ||
    path.normalize(root) === path.parse(path.normalize(root)).root
  ) {
    throw unsafeTopology(label, root, "managed root must be an absolute path below filesystem root");
  }
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw unsafeTopology(label, target, "target is outside its managed root");
  }
  const segments = relative === "" ? [] : relative.split(path.sep);
  if (!(await metadataIfExists(root)) && !rootRequired) {
    await assertNearestExistingDirectory(root, label);
  }
  let current = root;
  for (let index = -1; index < segments.length; index += 1) {
    if (index >= 0) current = path.join(current, segments[index]);
    const metadata = await metadataIfExists(current);
    if (!metadata) {
      if (current === root && rootRequired) {
        throw unsafeTopology(label, current, "required managed root does not exist");
      }
      break;
    }
    if (metadata.isSymbolicLink()) {
      throw unsafeTopology(label, current, "symbolic-link ancestors are not allowed");
    }
    if (!metadata.isDirectory()) {
      throw unsafeTopology(label, current, "managed ancestors must be directories");
    }
  }
}

async function assertManagedFile(filePath, label) {
  const metadata = await metadataIfExists(filePath);
  if (!metadata) return;
  if (metadata.isSymbolicLink() || !metadata.isFile()) {
    throw unsafeTopology(label, filePath, "existing managed file must be a regular file");
  }
}

async function resolveAdapterTopologyRoot(paths) {
  const metadata = await metadataIfExists(paths.adapterRoot);
  if (!metadata?.isSymbolicLink()) {
    await assertDirectoryChain(paths.home, paths.adapterRoot, "adapterRoot");
    return paths.adapterRoot;
  }

  // The adapter-owned root is the one supported relocation boundary. Descendants
  // are validated against its resolved directory and must remain real directories.
  let resolvedRoot;
  try {
    resolvedRoot = await realpath(paths.adapterRoot);
  } catch {
    throw unsafeTopology(
      "adapterRoot",
      paths.adapterRoot,
      "symbolic-link adapter root does not resolve to an existing directory",
    );
  }
  await assertDirectoryChain(resolvedRoot, resolvedRoot, "adapterRoot", {
    rootRequired: true,
  });
  return resolvedRoot;
}

export async function assertStandalonePathTopology(paths, statePath) {
  await assertDirectoryChain(paths.home, paths.home, "HOME", { rootRequired: true });
  const topologyRoot = await resolveAdapterTopologyRoot(paths);
  for (const target of [
    paths.activeRoot,
    paths.disabledRoot,
    path.dirname(paths.transactionRoot),
  ]) {
    const relative = path.relative(paths.adapterRoot, target);
    const topologyTarget = path.join(topologyRoot, relative);
    await assertDirectoryChain(topologyRoot, topologyTarget, "adapterRoot");
  }
  await assertManagedStatePathTopology({
    marketHome: paths.marketHome,
    statePath,
  });
  for (const target of [path.dirname(paths.lifecycleLock)]) {
    await assertDirectoryChain(paths.marketHome, target, "marketHome");
  }
}

export async function assertManagedStatePathTopology({ marketHome, statePath }) {
  await assertDirectoryChain(marketHome, marketHome, "marketHome");
  await assertDirectoryChain(marketHome, path.dirname(statePath), "marketHome");
  await assertManagedFile(statePath, "managedState");
}

export async function assertDownloadPathTopology({ marketHome, downloadsRoot, destinationPath }) {
  await assertDirectoryChain(marketHome, marketHome, "marketHome");
  await assertDirectoryChain(marketHome, downloadsRoot, "downloadsRoot");
  await assertDirectoryChain(downloadsRoot, path.dirname(destinationPath), "downloadDestination");
}

export function assertManagedRecordPaths(record, expected) {
  if (
    path.normalize(record.activePath) !== path.normalize(expected.activePath) ||
    path.normalize(record.disabledPath) !== path.normalize(expected.disabledPath)
  ) {
    throw new SkillMarketError({
      code: "unsafe-managed-state-path",
      message: "Managed-state paths do not match the canonical adapter roots.",
      status: "blocked",
      details: {
        id: `${record.adapter}:standalone:${record.name}`,
        recorded: { activePath: record.activePath, disabledPath: record.disabledPath },
        expected: { activePath: expected.activePath, disabledPath: expected.disabledPath },
      },
      nextAction: "Repair managed-state paths from a verified backup before retrying mutations.",
    });
  }
}

export function defaultDownloadPath({ downloadsRoot, entry }) {
  const kindRoot = path.join(downloadsRoot, entry.adapter, entry.kind, entry.name);
  return assertPathInside(kindRoot, path.join(kindRoot, entry.version), "downloadPath");
}
