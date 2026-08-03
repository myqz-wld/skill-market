import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, lstat, mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { SkillMarketError } from "./errors.mjs";

async function walk(root, relative = "") {
  const absolute = path.join(root, relative);
  const metadata = await lstat(absolute);
  if (metadata.isSymbolicLink()) {
    throw packageError(root, relative || ".", "symbolic links are not allowed");
  }
  if (metadata.isFile()) {
    return [{ relative, absolute, mode: metadata.mode & 0o777, size: metadata.size }];
  }
  if (!metadata.isDirectory()) {
    throw packageError(root, relative || ".", "only regular files and directories are allowed");
  }
  const children = (await readdir(absolute)).sort((left, right) => left.localeCompare(right));
  const nested = await Promise.all(
    children.map((child) => walk(root, path.join(relative, child))),
  );
  return nested.flat();
}

function packageError(root, relativePath, issue, cause) {
  return new SkillMarketError({
    code: "invalid-package-content",
    message: `Package content is invalid at ${relativePath}: ${issue}.`,
    status: "blocked",
    details: { root, relativePath, issue },
    nextAction: "Fix the catalog package in its source repository and refresh before retrying.",
    cause,
  });
}

export async function validatePackageContent(entry, sourcePath) {
  let metadata;
  try {
    metadata = await lstat(sourcePath);
  } catch (error) {
    throw packageError(sourcePath, ".", "package directory is missing", error);
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw packageError(sourcePath, ".", "package root must be a real directory");
  }
  const requiredPath =
    entry.kind === "standalone"
      ? path.join(sourcePath, "SKILL.md")
      : path.join(sourcePath, entry.manifestPath);
  let requiredMetadata;
  try {
    requiredMetadata = await lstat(requiredPath);
  } catch (error) {
    throw packageError(sourcePath, path.relative(sourcePath, requiredPath), "required file is missing", error);
  }
  if (!requiredMetadata.isFile() || requiredMetadata.isSymbolicLink()) {
    throw packageError(sourcePath, path.relative(sourcePath, requiredPath), "required file must be regular");
  }
  if (entry.kind === "plugin") {
    let manifest;
    try {
      manifest = JSON.parse(await readFile(requiredPath, "utf8"));
    } catch (error) {
      throw packageError(sourcePath, entry.manifestPath, "plugin manifest must be valid JSON", error);
    }
    if (manifest.name !== entry.name || manifest.version !== entry.version) {
      throw packageError(
        sourcePath,
        entry.manifestPath,
        `manifest identity must equal ${entry.name}@${entry.version}`,
      );
    }
  }
  return contentDigest(sourcePath);
}

export async function contentDigest(root) {
  const files = await walk(root);
  const hash = createHash("sha256");
  for (const file of files) {
    const portablePath = file.relative.split(path.sep).join("/");
    hash.update(`${portablePath}\0${file.mode.toString(8)}\0${file.size}\0`, "utf8");
    let bytesRead = 0;
    for await (const chunk of createReadStream(file.absolute)) {
      bytesRead += chunk.length;
      hash.update(chunk);
    }
    if (bytesRead !== file.size) {
      throw packageError(root, file.relative, "file size changed while hashing");
    }
    hash.update("\0", "utf8");
  }
  return hash.digest("hex");
}

export async function copyPackage(sourcePath, destinationPath) {
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await cp(sourcePath, destinationPath, {
    recursive: true,
    errorOnExist: true,
    force: false,
    preserveTimestamps: true,
  });
}
