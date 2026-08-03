import { createHash } from "node:crypto";
import path from "node:path";

import { parsePackageId } from "./contracts.mjs";
import { SkillMarketError } from "./errors.mjs";
import { compareSemver, isSemver } from "./versions.mjs";

export const PROPOSAL_ACTIONS = Object.freeze(["add", "update", "retire", "remove"]);
export const PROPOSAL_STATUSES = Object.freeze([
  "planned",
  "preparing",
  "prepared",
  "pushed",
  "submitted",
  "aborted",
]);

export const PLUGIN_MANIFESTS = Object.freeze({
  claude: ".claude-plugin/plugin.json",
  codex: ".codex-plugin/plugin.json",
  grok: ".grok-plugin/plugin.json",
});

const ROOT_FIELDS = Object.freeze(["schemaVersion", "action", "summary", "targets"]);
const TARGET_FIELDS = Object.freeze([
  "id",
  "sourcePath",
  "version",
  "description",
  "category",
  "keywords",
]);
const SOURCE_ACTIONS = Object.freeze(["add", "update"]);
const BOOTSTRAP_IDS = new Set([
  "claude:plugin:skill-market-claude",
  "codex:plugin:skill-market-codex",
  "grok:plugin:skill-market-grok",
]);
const PROPOSAL_ID = /^proposal-[0-9a-f]{16}$/u;

function proposalError(code, message, details, nextAction) {
  return new SkillMarketError({
    code,
    message,
    status: "blocked",
    details,
    nextAction,
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertKnownFields(value, allowed, field) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field} contains unknown fields: ${unknown.join(", ")}.`,
      { field, unknown, allowed },
      "Remove unknown proposal fields and retry proposal plan.",
    );
  }
}

function requireTrimmedString(value, field, { singleLine = false, max = 4096 } = {}) {
  if (typeof value !== "string" || value.trim() === "") {
    throw proposalError(
      "invalid-proposal-spec",
      `${field} must be a non-empty string.`,
      { field, value },
      "Fix the proposal spec and retry proposal plan.",
    );
  }
  const normalized = value.trim();
  if (normalized.length > max || (singleLine && /[\r\n]/u.test(normalized))) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field} must be ${singleLine ? "a single line and " : ""}at most ${max} characters.`,
      { field, length: normalized.length },
      "Shorten the proposal field and retry proposal plan.",
    );
  }
  return normalized;
}

function normalizeSourcePath(value, { baseDirectory, home, field }) {
  const raw = requireTrimmedString(value, field);
  if (raw === "~") return path.normalize(home);
  if (raw.startsWith("~/")) return path.normalize(path.join(home, raw.slice(2)));
  return path.resolve(baseDirectory, raw);
}

function normalizeKeywords(value, field) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 20) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field} must be an array containing at most 20 strings.`,
      { field, value },
      "Fix the proposal keywords and retry proposal plan.",
    );
  }
  const normalized = value.map((item, index) =>
    requireTrimmedString(item, `${field}[${index}]`, { max: 64 }),
  );
  if (new Set(normalized).size !== normalized.length) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field} must not contain duplicates.`,
      { field, value: normalized },
      "Remove duplicate proposal keywords and retry proposal plan.",
    );
  }
  return normalized;
}

function normalizeTarget(target, index, context) {
  const field = `targets[${index}]`;
  if (!isPlainObject(target)) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field} must be an object.`,
      { field, value: target },
      "Fix the proposal target and retry proposal plan.",
    );
  }
  assertKnownFields(target, TARGET_FIELDS, field);
  let identity;
  try {
    identity = parsePackageId(target.id);
  } catch (error) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field}.id is invalid: ${error.message}.`,
      { field: `${field}.id`, value: target.id },
      "Use a canonical <adapter>:<kind>:<name> target id.",
    );
  }
  if (BOOTSTRAP_IDS.has(identity.id)) {
    throw proposalError(
      "bootstrap-proposal-forbidden",
      `Bootstrap package ${identity.id} cannot be managed through proposal commands.`,
      { id: identity.id },
      "Change bootstrap packages only through the repository's developer workflow.",
    );
  }

  const needsSource = SOURCE_ACTIONS.includes(context.action);
  const mutationFields = ["sourcePath", "version", "description", "category", "keywords"];
  if (needsSource && target.sourcePath === undefined) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field}.sourcePath is required for ${context.action}.`,
      { field: `${field}.sourcePath`, action: context.action },
      "Provide the exact package source directory and retry proposal plan.",
    );
  }
  if (!needsSource) {
    const supplied = mutationFields.filter((key) => target[key] !== undefined);
    if (supplied.length > 0) {
      throw proposalError(
        "invalid-proposal-spec",
        `${field} cannot set package content or metadata for ${context.action}.`,
        { field, action: context.action, supplied },
        "Remove source, version, and metadata fields from retire/remove targets.",
      );
    }
    return Object.freeze({ id: identity.id });
  }

  if (!isSemver(target.version)) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field}.version must be an explicit semantic version.`,
      { field: `${field}.version`, value: target.version },
      "Set the exact proposed version and retry proposal plan.",
    );
  }
  if (context.action === "add" && identity.kind === "standalone" && target.version !== "0.0.1") {
    throw proposalError(
      "invalid-proposal-version",
      `New standalone package ${identity.id} must start at version 0.0.1.`,
      { id: identity.id, version: target.version, required: "0.0.1" },
      "Set version to 0.0.1 and retry proposal plan.",
    );
  }
  if (context.action === "add" && target.description === undefined) {
    throw proposalError(
      "invalid-proposal-spec",
      `${field}.description is required for add.`,
      { field: `${field}.description` },
      "Add a catalog description and retry proposal plan.",
    );
  }

  const normalized = {
    id: identity.id,
    sourcePath: normalizeSourcePath(target.sourcePath, {
      ...context,
      field: `${field}.sourcePath`,
    }),
    version: target.version,
  };
  if (target.description !== undefined) {
    normalized.description = requireTrimmedString(target.description, `${field}.description`);
  }
  if (target.category !== undefined) {
    normalized.category = requireTrimmedString(target.category, `${field}.category`, { max: 128 });
  }
  const keywords = normalizeKeywords(target.keywords, `${field}.keywords`);
  if (keywords !== undefined) normalized.keywords = keywords;
  return Object.freeze(normalized);
}

export function normalizeProposalSpec(input, { specPath, home }) {
  if (!isPlainObject(input)) {
    throw proposalError(
      "invalid-proposal-spec",
      "Proposal spec must be a JSON object.",
      { specPath },
      "Create a schemaVersion 1 proposal spec and retry proposal plan.",
    );
  }
  assertKnownFields(input, ROOT_FIELDS, "proposal");
  if (input.schemaVersion !== 1) {
    throw proposalError(
      "invalid-proposal-spec",
      "Proposal spec schemaVersion must equal 1.",
      { specPath, schemaVersion: input.schemaVersion },
      "Set schemaVersion to 1 and retry proposal plan.",
    );
  }
  if (!PROPOSAL_ACTIONS.includes(input.action)) {
    throw proposalError(
      "invalid-proposal-spec",
      `Proposal action must be one of: ${PROPOSAL_ACTIONS.join(", ")}.`,
      { action: input.action },
      "Choose one canonical proposal action and retry proposal plan.",
    );
  }
  if (!Array.isArray(input.targets) || input.targets.length < 1 || input.targets.length > 50) {
    throw proposalError(
      "invalid-proposal-spec",
      "Proposal targets must contain between 1 and 50 explicit packages.",
      { count: Array.isArray(input.targets) ? input.targets.length : null },
      "Provide a bounded explicit target list and retry proposal plan.",
    );
  }
  const baseDirectory = path.dirname(specPath);
  const context = { action: input.action, baseDirectory, home };
  const targets = input.targets.map((target, index) => normalizeTarget(target, index, context));
  targets.sort((left, right) => left.id.localeCompare(right.id));
  const duplicate = targets.find((target, index) => index > 0 && target.id === targets[index - 1].id);
  if (duplicate) {
    throw proposalError(
      "invalid-proposal-spec",
      `Proposal target ${duplicate.id} is duplicated.`,
      { id: duplicate.id },
      "Keep each canonical package id exactly once in the proposal.",
    );
  }
  return Object.freeze({
    schemaVersion: 1,
    action: input.action,
    summary: requireTrimmedString(input.summary, "summary", { singleLine: true, max: 160 }),
    targets: Object.freeze(targets),
  });
}

export function assertProposalId(value) {
  if (typeof value !== "string" || !PROPOSAL_ID.test(value)) {
    throw proposalError(
      "invalid-proposal-id",
      "Proposal id must use the canonical proposal-<16 lowercase hex> format.",
      { value },
      "Use the id returned by proposal plan or proposal status.",
    );
  }
  return value;
}

function normalizeJson(value) {
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, normalizeJson(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(normalizeJson(value));
}

export function canonicalDigest(value) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

export function proposalIdFor(planIdentity) {
  return `proposal-${canonicalDigest(planIdentity).slice(0, 16)}`;
}

export function catalogEntryForTarget(target, current = null) {
  const identity = parsePackageId(target.id);
  const entry = {
    ...(current ?? {}),
    id: identity.id,
    adapter: identity.adapter,
    kind: identity.kind,
    name: identity.name,
    version: target.version,
    status: current?.status ?? "active",
    path:
      identity.kind === "plugin"
        ? `plugins/${identity.name}`
        : `skills/${identity.adapter}/${identity.name}`,
    description: target.description ?? current?.description,
  };
  if (identity.kind === "plugin") {
    entry.manifestPath = PLUGIN_MANIFESTS[identity.adapter];
    entry.bootstrap = false;
  } else {
    delete entry.manifestPath;
    delete entry.bootstrap;
  }
  for (const field of ["category", "keywords"]) {
    if (target[field] !== undefined) entry[field] = target[field];
  }
  return entry;
}

export function validateProposalAgainstCatalog(spec, catalog) {
  const byId = new Map(catalog.packages.map((entry) => [entry.id, entry]));
  const planned = [];
  for (const target of spec.targets) {
    const current = byId.get(target.id) ?? null;
    if (current?.bootstrap || BOOTSTRAP_IDS.has(target.id)) {
      throw proposalError(
        "bootstrap-proposal-forbidden",
        `Bootstrap package ${target.id} cannot be changed through proposal commands.`,
        { id: target.id },
        "Use the developer-maintained repository workflow for bootstrap changes.",
      );
    }
    if (spec.action === "add") {
      if (current) {
        throw proposalError(
          "proposal-target-exists",
          `Add target ${target.id} already exists in the catalog, including tombstones.`,
          { id: target.id, status: current.status },
          "Use update for an active package or choose a new canonical package id.",
        );
      }
      planned.push({ target, current: null, next: catalogEntryForTarget(target) });
      continue;
    }
    if (!current) {
      throw proposalError(
        "proposal-target-missing",
        `${spec.action} target ${target.id} is absent from the catalog.`,
        { id: target.id, action: spec.action },
        "Use add for a new package or correct the target id.",
      );
    }
    if (spec.action === "update") {
      if (current.status === "removed") {
        throw proposalError(
          "proposal-target-removed",
          `Removed package ${target.id} cannot be updated or reused.`,
          { id: target.id },
          "Choose a new canonical package id for replacement content.",
        );
      }
      if (compareSemver(target.version, current.version) <= 0) {
        throw proposalError(
          "invalid-proposal-version",
          `Update target ${target.id} must increase ${current.version} to a higher semantic version.`,
          { id: target.id, currentVersion: current.version, proposedVersion: target.version },
          "Select an exact higher semantic version and retry proposal plan.",
        );
      }
      planned.push({ target, current, next: catalogEntryForTarget(target, current) });
      continue;
    }
    if (spec.action === "retire") {
      if (current.status !== "active") {
        throw proposalError(
          "proposal-action-noop",
          `Retire target ${target.id} must currently be active, not ${current.status}.`,
          { id: target.id, status: current.status },
          "Choose an active package or use remove for an existing non-removed package.",
        );
      }
      planned.push({ target, current, next: { ...current, status: "deprecated" } });
      continue;
    }
    if (current.status === "removed") {
      throw proposalError(
        "proposal-action-noop",
        `Remove target ${target.id} is already a removed tombstone.`,
        { id: target.id, status: current.status },
        "No new proposal is needed for an already removed package.",
      );
    }
    planned.push({ target, current, next: { ...current, status: "removed" } });
  }
  return planned;
}

export function isBootstrapProposalId(id) {
  return BOOTSTRAP_IDS.has(id);
}
