import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { loadCatalog } from "../catalog/catalog.mjs";
import { isKebabCase } from "../shared/contracts.mjs";
import { isSemver } from "../shared/versions.mjs";

// Repository-owned skill-plugin profiles, not copies of the full native schemas.
const COMMON = ["name", "version", "description", "author", "license", "keywords"];
const PROFILES = Object.freeze({
  claude: { manifest: ".claude-plugin/plugin.json", fields: COMMON },
  codex: { manifest: ".codex-plugin/plugin.json", fields: [...COMMON, "skills", "interface"] },
  grok: { manifest: ".grok-plugin/plugin.json", fields: COMMON },
});
const INTERFACE_STRINGS = [
  "displayName", "shortDescription", "longDescription", "developerName", "category",
];

function requireCondition(condition, location, message) {
  if (!condition) throw new TypeError(`${location}: ${message}`);
}

function object(value, location, fields) {
  requireCondition(value !== null && typeof value === "object" && !Array.isArray(value),
    location, "must be an object");
  for (const key of Object.keys(value)) {
    requireCondition(fields.includes(key), `${location}.${key}`,
      "unsupported field; extend the repository profile and its tests before use");
  }
}

function string(value, location) {
  requireCondition(typeof value === "string" && value.trim() !== "", location,
    "must be a non-empty string");
}

function strings(value, location) {
  requireCondition(Array.isArray(value) && value.length > 0, location,
    "must be a non-empty array of strings");
  value.forEach((item, index) => string(item, `${location}[${index}]`));
  requireCondition(new Set(value).size === value.length, location, "must not contain duplicates");
}

function relativeParts(value, location) {
  string(value, location);
  requireCondition(!path.isAbsolute(value) && !/[:\\\0]/u.test(value), location,
    "must be a package-relative path");
  const parts = value.replace(/^\.\//u, "").replace(/\/$/u, "").split("/");
  requireCondition(parts.every((part) => part !== "" && part !== "." && part !== ".."),
    location, "must not contain empty, dot or parent segments");
  return parts;
}

async function requiredPath(root, relative, kind, location = relative) {
  const parts = relativeParts(relative, location);
  let target = root;
  for (const [index, part] of parts.entries()) {
    target = path.join(target, part);
    let metadata;
    try {
      metadata = await lstat(target);
    } catch (error) {
      throw new TypeError(`${location}: cannot read required ${kind} (${error.code})`);
    }
    requireCondition(!metadata.isSymbolicLink(), location, "symbolic links are not allowed");
    const directory = index < parts.length - 1 || kind === "directory";
    requireCondition(directory ? metadata.isDirectory() : metadata.isFile(), location,
      `must resolve through directories to a regular ${kind}`);
  }
  return target;
}

function validateFields(manifest, entry, profile, location) {
  object(manifest, location, profile.fields);
  for (const field of ["name", "version", "description"]) {
    string(manifest[field], `${location}.${field}`);
  }
  requireCondition(isKebabCase(manifest.name), `${location}.name`, "must be kebab-case");
  requireCondition(isSemver(manifest.version), `${location}.version`, "must be semver");
  requireCondition(manifest.name === entry.name && manifest.version === entry.version,
    location, `identity must equal ${entry.name}@${entry.version}`);
  if (manifest.author !== undefined) {
    object(manifest.author, `${location}.author`, ["name", "email", "url"]);
    string(manifest.author.name, `${location}.author.name`);
    for (const field of ["email", "url"]) {
      if (manifest.author[field] !== undefined) {
        string(manifest.author[field], `${location}.author.${field}`);
      }
    }
  }
  if (manifest.license !== undefined) string(manifest.license, `${location}.license`);
  if (manifest.keywords !== undefined) strings(manifest.keywords, `${location}.keywords`);
  if (entry.adapter === "codex") {
    string(manifest.skills, `${location}.skills`);
    object(manifest.interface, `${location}.interface`,
      [...INTERFACE_STRINGS, "capabilities", "defaultPrompt", "brandColor"]);
    for (const field of INTERFACE_STRINGS) {
      string(manifest.interface[field], `${location}.interface.${field}`);
    }
    for (const field of ["capabilities", "defaultPrompt"]) {
      strings(manifest.interface[field], `${location}.interface.${field}`);
    }
    requireCondition(typeof manifest.interface.brandColor === "string" &&
      /^#[0-9a-f]{6}$/iu.test(manifest.interface.brandColor),
    `${location}.interface.brandColor`, "must be a six-digit hex color");
  }
}

export async function validatePluginManifest({ root, entry }) {
  const profile = PROFILES[entry.adapter];
  requireCondition(entry.kind === "plugin" && profile, entry.id, "unsupported plugin adapter");
  requireCondition(entry.manifestPath === profile.manifest, entry.id,
    `manifestPath must equal ${profile.manifest}`);
  const packageRoot = await requiredPath(root, entry.path, "directory");
  const location = `${entry.path}/${entry.manifestPath}`;
  const manifestPath = await requiredPath(packageRoot, entry.manifestPath, "file", location);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    throw new TypeError(`${location}: must contain valid JSON`);
  }
  validateFields(manifest, entry, profile, location);
  const skills = entry.adapter === "codex" ? manifest.skills : "./skills/";
  const skillsRoot = await requiredPath(packageRoot, skills, "directory", `${location}.skills`);
  const directories = await readdir(skillsRoot, { withFileTypes: true });
  let count = 0;
  for (const skill of directories) {
    requireCondition(!skill.isSymbolicLink(), `${entry.path}/${skills}/${skill.name}`,
      "symbolic links are not allowed");
    if (!skill.isDirectory()) continue;
    await requiredPath(skillsRoot, `${skill.name}/SKILL.md`, "file",
      `${entry.path}/${skills}/${skill.name}/SKILL.md`);
    count += 1;
  }
  requireCondition(count > 0, `${location}.skills`, "must contain at least one skill with SKILL.md");
  return { id: entry.id, skills: count };
}

export async function validateRepositoryPlugins({ root }) {
  const catalog = await loadCatalog(path.join(root, "catalog/entries.json"));
  const results = [];
  for (const entry of catalog.packages) {
    if (entry.kind === "plugin" && entry.status !== "removed") {
      results.push(await validatePluginManifest({ root, entry }));
    }
  }
  return results;
}
