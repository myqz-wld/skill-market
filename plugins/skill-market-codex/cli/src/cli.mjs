import { parseOptions, requirePositionals } from "./arguments.mjs";
import {
  configFileView,
  loadEffectiveConfig,
  parseConfigValue,
  updateConfig,
} from "./config.mjs";
import { failureResult, successResult } from "./contracts.mjs";
import { asSkillMarketError, SkillMarketError } from "./errors.mjs";
import {
  loadCatalogSnapshot,
  loadOptionalCatalogSnapshot,
} from "./cache.mjs";
import { collectLocalInventory } from "./inventory.mjs";
import { executeLifecycle } from "./lifecycle.mjs";
import {
  abortProposal,
  planProposal,
  prepareProposal,
  statusProposal,
  submitProposal,
} from "./proposal.mjs";
import { discoverCatalog, listInventory } from "./query.mjs";

export const CLI_VERSION = "0.1.3";

const GLOBAL_OPTIONS = {
  pretty: { key: "pretty", type: "boolean" },
  json: { key: "json", type: "boolean" },
  help: { key: "help", type: "boolean" },
};

const SOURCE_OPTIONS = {
  "read-repo-url": { key: "readRepoUrl", type: "value" },
  "base-ref": { key: "baseRef", type: "value" },
  "cache-path": { key: "cachePath", type: "value" },
  "cache-ttl-seconds": { key: "cacheTtlSeconds", type: "value" },
  "repo-path": { key: "repoPath", type: "value" },
};

const LIST_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...SOURCE_OPTIONS,
  adapter: { key: "adapters", type: "list" },
  kind: { key: "kinds", type: "list" },
  "local-state": { key: "localStates", type: "list" },
  ownership: { key: "ownership", type: "list" },
  "update-state": { key: "updateStates", type: "list" },
  history: { key: "history", type: "boolean" },
  offset: { key: "offset", type: "value" },
  limit: { key: "limit", type: "value" },
};

const DISCOVER_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...SOURCE_OPTIONS,
  adapter: { key: "adapters", type: "list" },
  kind: { key: "kinds", type: "list" },
  status: { key: "statuses", type: "list" },
  offset: { key: "offset", type: "value" },
  limit: { key: "limit", type: "value" },
  latest: { key: "latest", type: "boolean" },
  offline: { key: "offline", type: "boolean" },
};

const CONFIG_OPTIONS = { ...GLOBAL_OPTIONS };

const PROPOSAL_PLAN_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...SOURCE_OPTIONS,
  spec: { key: "specPath", type: "value" },
};

const PROPOSAL_PREPARE_OPTIONS = { ...GLOBAL_OPTIONS };
const PROPOSAL_STATUS_OPTIONS = { ...GLOBAL_OPTIONS };

const PROPOSAL_SUBMIT_OPTIONS = {
  ...GLOBAL_OPTIONS,
  "confirm-external-effects": { key: "confirmExternalEffects", type: "boolean" },
  "push-mode": { key: "pushMode", type: "value" },
  "push-url": { key: "pushUrl", type: "value" },
  "fork-push-url": { key: "forkPushUrl", type: "value" },
  "head-owner": { key: "headOwner", type: "value" },
  draft: { key: "draft", type: "boolean" },
};

const PROPOSAL_ABORT_OPTIONS = {
  ...GLOBAL_OPTIONS,
  "confirm-discard": { key: "confirmDiscard", type: "boolean" },
};

const PROPOSAL_ACTION_OPTIONS = Object.freeze({
  plan: PROPOSAL_PLAN_OPTIONS,
  prepare: PROPOSAL_PREPARE_OPTIONS,
  submit: PROPOSAL_SUBMIT_OPTIONS,
  status: PROPOSAL_STATUS_OPTIONS,
  abort: PROPOSAL_ABORT_OPTIONS,
});

const CATALOG_MUTATION_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...SOURCE_OPTIONS,
  "allow-stale-head": { key: "allowStaleHead", type: "value" },
};

const DOWNLOAD_OPTIONS = {
  ...CATALOG_MUTATION_OPTIONS,
  "allow-deprecated": { key: "allowDeprecated", type: "boolean" },
  destination: { key: "destination", type: "value" },
  force: { key: "force", type: "boolean" },
};

const INSTALL_OPTIONS = {
  ...CATALOG_MUTATION_OPTIONS,
  "allow-deprecated": { key: "allowDeprecated", type: "boolean" },
  adopt: { key: "adopt", type: "boolean" },
  "confirm-source-change": { key: "confirmSourceChange", type: "boolean" },
  "confirm-trust": { key: "confirmTrust", type: "boolean" },
  scope: { key: "scope", type: "value" },
};

const UPDATE_OPTIONS = {
  ...CATALOG_MUTATION_OPTIONS,
  force: { key: "force", type: "boolean" },
  "confirm-drift": { key: "confirmDrift", type: "boolean" },
  "confirm-source-change": { key: "confirmSourceChange", type: "boolean" },
  "confirm-reinstall": { key: "confirmReinstall", type: "boolean" },
  scope: { key: "scope", type: "value" },
};

const LOCAL_PROVENANCE_OPTIONS = {
  "read-repo-url": SOURCE_OPTIONS["read-repo-url"],
  "cache-path": SOURCE_OPTIONS["cache-path"],
  "repo-path": SOURCE_OPTIONS["repo-path"],
};

const ACTIVATION_OPTIONS = {
  ...GLOBAL_OPTIONS,
  ...LOCAL_PROVENANCE_OPTIONS,
  "confirm-drift": { key: "confirmDrift", type: "boolean" },
  "confirm-source-change": { key: "confirmSourceChange", type: "boolean" },
  scope: { key: "scope", type: "value" },
};

const UNINSTALL_OPTIONS = {
  ...ACTIVATION_OPTIONS,
  adopt: { key: "adopt", type: "boolean" },
  "remove-data": { key: "removeData", type: "boolean" },
};

const LIFECYCLE_DEFINITIONS = Object.freeze({
  download: DOWNLOAD_OPTIONS,
  install: INSTALL_OPTIONS,
  update: UPDATE_OPTIONS,
  enable: ACTIVATION_OPTIONS,
  disable: ACTIVATION_OPTIONS,
  uninstall: UNINSTALL_OPTIONS,
});

const LIFECYCLE_OPTION_KEYS = Object.freeze([
  "allowStaleHead",
  "allowDeprecated",
  "destination",
  "force",
  "adopt",
  "confirmDrift",
  "confirmSourceChange",
  "confirmTrust",
  "confirmReinstall",
  "scope",
  "removeData",
]);

function lifecycleHelpContract() {
  const stableId = {
    name: "id",
    type: "canonical package id",
    format: "<adapter>:<kind>:<kebab-case-name>",
    adapters: ["claude", "codex", "grok"],
    kinds: ["plugin", "standalone"],
    required: true,
  };
  const catalogMutation = [
    "--read-repo-url",
    "--base-ref",
    "--cache-path",
    "--cache-ttl-seconds",
    "--repo-path",
    "--allow-stale-head",
  ];
  const localSource = [
    "--read-repo-url",
    "--cache-path",
    "--repo-path",
  ];
  return {
    contract: {
      identity: stableId,
      localProvenanceOptions: "--read-repo-url, --cache-path, and --repo-path apply only to native plugin enable/disable/uninstall source verification; standalone local operations reject source overrides",
      catalogPolicy: {
        default: "download/install/update request the latest catalog and reject refresh failure; no automatic stale fallback",
        explicitStale: "--allow-stale-head pins the exact already-cached commit and forces offline mode; marker head, actual Git HEAD, and a clean cache worktree must agree",
        active: "eligible for download, install, and update",
        deprecated: "update is allowed; new download/install requires --allow-deprecated",
        disabled: "download/install/update are blocked",
        removed: "download/install/update are blocked; local disable/enable/uninstall remains available",
      },
      options: {
        "--allow-stale-head": {
          type: "lowercase commit id",
          format: "exactly 40 or 64 hexadecimal characters",
          default: null,
          appliesTo: ["download", "install", "update"],
          effect: "read the matching configured cache offline; reject any head mismatch",
        },
        "--allow-deprecated": {
          type: "boolean",
          default: false,
          appliesTo: ["download", "install"],
          effect: "accept a deprecated catalog entry for a new copy or installation",
        },
        "--destination": {
          type: "absolute path or ~/ path",
          default: "~/.skill-market/downloads/<adapter>/<kind>/<name>/<version>",
          appliesTo: ["download"],
          constraint: "must remain below ~/.skill-market/downloads (or the configured SKILL_MARKET_HOME downloads root)",
        },
        "--force": {
          type: "boolean",
          default: false,
          appliesTo: ["download", "update"],
          effect: "replace differing download content or reinstall an already-current package",
        },
        "--adopt": {
          type: "boolean",
          default: false,
          appliesTo: ["standalone install", "standalone uninstall"],
          effect: "authorize replacing or removing an exact unmanaged canonical package path after inspection",
        },
        "--confirm-drift": {
          type: "boolean",
          default: false,
          appliesTo: ["standalone update", "standalone enable", "standalone disable", "standalone uninstall"],
          effect: "authorize overwrite, move, or deletion after the local digest differs from managed state",
        },
        "--confirm-source-change": {
          type: "boolean",
          default: false,
          appliesTo: ["standalone update", "Grok plugin install/update/enable/disable/uninstall"],
          effect: "accept a verified source-identity change or missing/mismatched Grok provenance",
        },
        "--confirm-trust": {
          type: "boolean",
          default: false,
          appliesTo: ["Grok plugin install"],
          effect: "pass Grok --trust only after the caller inspected the exact catalog package",
        },
        "--confirm-reinstall": {
          type: "boolean",
          default: false,
          appliesTo: ["Codex plugin update"],
          effect: "authorize a Git-marketplace refresh when applicable, followed by remove/add and at most one add retry",
        },
        "--scope": {
          type: "enum",
          values: ["user", "project", "local", "managed"],
          default: "detected installed scope, otherwise user for a new install; missing installed scope blocks until --scope is explicit",
          appliesTo: ["Claude plugin install/update/enable/disable/uninstall"],
          constraints: [
            "install accepts user, project, or local",
            "managed is update-only; managed enable/disable/uninstall is controlled by policy",
            "an explicit scope cannot differ from a detected installed scope",
          ],
        },
        "--remove-data": {
          type: "boolean",
          default: false,
          appliesTo: ["Claude plugin uninstall", "Grok plugin uninstall"],
          effect: "omit the native --keep-data flag and allow native persistent plugin data removal",
        },
      },
      adapters: {
        codex: {
          pluginUpdate: "optional Git-marketplace refresh plus confirmed remove/add with one bounded add retry",
          pluginEnableDisable: "unsupported; uninstall is never substituted",
        },
        claude: {
          scope: "detect and preserve user/project/local/managed scope within native capability limits",
          persistentData: "kept by default on uninstall",
          updateWarning: "restart Claude Code to apply an updated plugin",
        },
        grok: {
          trust: "plugin install requires --confirm-trust",
          provenance: "installed source must match the effective repository or require --confirm-source-change",
          pluginUpdate: "native for remote sources; verified local sources use a keep-data reinstall and restore disabled state",
          persistentData: "kept by default on uninstall",
        },
      },
      recovery: {
        "needs_confirmation": "inspect the exact details and retry only with the nextAction flag named by the error",
        blocked: "do not retry unchanged; repair source, catalog status, path topology, state, or rollback condition named by nextAction",
        unsupported: "choose the documented native alternative; do not emulate disable with uninstall",
        error: "retry only when error.retryable is true after completing error.nextAction",
        transaction: "successful rollback returns transaction-rolled-back; incomplete rollback returns rollback-failed and blocks further mutation",
      },
    },
    commands: {
      download: {
        purpose: "Copy one exact catalog package into the managed downloads area without installing it.",
        positionals: stableId,
        options: [...catalogMutation, "--allow-deprecated", "--destination", "--force"],
        sideEffects: "May refresh the catalog cache and atomically create or replace only the resolved download destination; never changes installed package state.",
        idempotent: "matching content is noop; different content requires --force",
      },
      install: {
        purpose: "Install one exact catalog plugin or standalone skill with adapter-specific safety gates.",
        positionals: stableId,
        options: [...catalogMutation, "--allow-deprecated", "--adopt", "--confirm-source-change", "--confirm-trust", "--scope"],
        sideEffects: "May refresh the catalog cache; invokes the selected native plugin CLI or atomically writes one canonical standalone path plus managed state.",
        idempotent: "matching existing installation is noop; version/content mismatch routes to update",
      },
      update: {
        purpose: "Update one installed package from an eligible catalog entry while preserving activation and native scope.",
        positionals: stableId,
        options: [...catalogMutation, "--force", "--confirm-drift", "--confirm-source-change", "--confirm-reinstall", "--scope"],
        sideEffects: "Refreshes or pins the catalog, then invokes the selected native updater or atomically swaps standalone content and managed state.",
        idempotent: "current matching content is noop unless --force",
      },
      enable: {
        purpose: "Enable one installed package without fetching catalog content.",
        positionals: stableId,
        options: [...localSource, "--confirm-drift", "--confirm-source-change", "--scope"],
        sideEffects: "Moves one managed standalone directory or invokes the native adapter; Codex plugins return unsupported.",
        idempotent: "already active is noop",
      },
      disable: {
        purpose: "Disable one installed package while preserving its files and persistent data.",
        positionals: stableId,
        options: [...localSource, "--confirm-drift", "--confirm-source-change", "--scope"],
        sideEffects: "Moves one managed standalone directory or invokes the native adapter; Codex plugins return unsupported.",
        idempotent: "already disabled is noop",
      },
      uninstall: {
        purpose: "Remove one installed package while retaining standalone history and native persistent data by default.",
        positionals: stableId,
        options: [...localSource, "--adopt", "--confirm-drift", "--confirm-source-change", "--scope", "--remove-data"],
        sideEffects: "Atomically removes an exact standalone path and records absent history, or invokes native uninstall; --remove-data expands native deletion for Claude/Grok.",
        idempotent: "already absent is noop",
      },
    },
  };
}

function proposalHelpContract() {
  const proposalId = {
    name: "proposal-id",
    type: "string",
    format: "proposal-<16 lowercase hexadecimal characters>",
    required: true,
    source: "use the exact id returned by proposal plan",
  };
  return {
    contract: {
      purpose: "Turn explicit package content and catalog actions into a validated local commit, then optionally push that exact commit and open one pull request.",
      state: {
        path: "~/.skill-market/proposals/<proposal-id>/proposal.json (or the equivalent configured SKILL_MARKET_HOME)",
        ownership: "CLI-owned durable JSON with an integrity digest; callers must not edit it",
        statuses: ["planned", "preparing", "prepared", "pushed", "submitted", "aborted"],
        transitions: [
          "planned -> preparing -> prepared",
          "prepared -> pushed -> submitted",
          "planned/preparing/prepared -> aborted",
          "aborted -> planned only by re-running the identical proposal plan",
        ],
      },
      spec: {
        format: "UTF-8 JSON file",
        schemaVersion: { type: "integer", required: true, value: 1 },
        action: { type: "enum", required: true, values: ["add", "update", "retire", "remove"] },
        summary: { type: "single-line string", required: true, range: "1..160 trimmed characters", use: "commit/PR summary" },
        targets: {
          type: "array",
          required: true,
          range: "1..50 unique targets, sorted canonically by the CLI",
          item: {
            id: { type: "canonical package id", required: true, format: "<claude|codex|grok>:<plugin|standalone>:<kebab-case-name>" },
            sourcePath: { type: "path", requiredFor: ["add", "update"], forbiddenFor: ["retire", "remove"], resolution: "absolute, ~/ relative to HOME, or relative to the spec file" },
            version: { type: "semver string", requiredFor: ["add", "update"], forbiddenFor: ["retire", "remove"], constraints: ["update must be greater than catalog version", "new standalone must equal 0.0.1", "plugin manifest must match name/version"] },
            description: { type: "non-empty string", requiredFor: ["add"], optionalFor: ["update"], forbiddenFor: ["retire", "remove"] },
            category: { type: "non-empty string", required: false, appliesTo: ["add", "update"] },
            keywords: { type: "unique string array", required: false, range: "0..20 items; each 1..64 trimmed characters", appliesTo: ["add", "update"] },
          },
        },
        unknownFields: "rejected at the root and target level",
        pairing: "every adapter variant is a separate explicit target; no cross-adapter translation or implicit expansion",
        bootstrap: "skill-market-codex, skill-market-claude, and skill-market-grok self-proposals are blocked",
        removeSemantics: "delete exact package content in the isolated worktree and retain the catalog entry as status=removed tombstone",
        retireSemantics: "retain package content and set an active catalog entry to status=deprecated",
      },
      result: {
        proposal: {
          id: "proposal id",
          revision: "positive integer",
          status: "proposal status enum",
          action: "proposal action enum",
          summary: "string",
          targets: "array of id, proposed version or null, and captured source digest or null",
          source: "repository identity, base ref, immutable base commit, and freshness",
          workspace: "null or branch, prepared commit, diff hash, and managed worktree path",
          submission: "null or strategy, base/head repository, branch, pushed commit, and PR record",
          createdAt: "ISO timestamp",
          updatedAt: "ISO timestamp",
        },
      },
      safety: {
        localBase: "proposal plan requires catalog source identity agreement, exact base-ref HEAD, and a clean local checkout; a cache may contain only its managed marker",
        sourceContent: "plan captures each package digest; prepare rejects content or topology changes and nested .git metadata",
        worktree: "prepare uses a proposal-owned bare repository and isolated worktree; the source checkout is never edited",
        changedPaths: "only explicit package targets, catalog/entries.json, and the four generated catalog views may change",
        remoteBranch: "an existing remote branch must already equal the prepared commit; force-push is unsupported",
        externalEffects: "only submit with --confirm-external-effects may authenticate, create/verify a fork, push, or create a PR",
      },
      recovery: {
        "proposal-source-changed | proposal-base-changed": "inspect current content and create a new plan; do not edit durable state",
        "proposal-submit-confirmation": "verify preparedCommit and diffHash, then retry submit with --confirm-external-effects",
        "github-auth-required": "run gh auth login for the intended account, then retry the same submit",
        "proposal-branch-collision | pull-request-branch-collision": "inspect the existing remote object and create a new proposal; never force-push automatically",
        pushed: "retry submit with confirmation; the CLI verifies the exact remote commit and discovers an existing PR before creating one",
        "proposal-abort-confirmation": "inspect and preserve any wanted commits or changes in the exact managed worktree, then retry abort with --confirm-discard only to delete them",
        "proposal-workspace-recovery-required": "stop proposal mutations and reconcile only the canonical proposal directory named by the error",
      },
    },
    command: {
      purpose: "Manage a durable pull-request proposal through explicit local and external phases.",
      actions: {
        plan: {
          syntax: "proposal plan --spec <json-file> [source options]",
          positionals: [],
          requiredOptions: ["--spec"],
          options: ["--spec", "--read-repo-url", "--base-ref", "--cache-path", "--cache-ttl-seconds", "--repo-path"],
          sideEffects: "May strictly refresh the configured read cache and writes durable local proposal state; creates no branch, commit, fork, push, or PR.",
          idempotent: "the same normalized spec, source digests, base commit, and catalog digest return the same proposal id and noop; an identical aborted proposal is reactivated",
        },
        prepare: {
          syntax: "proposal prepare <proposal-id>",
          positionals: proposalId,
          options: [],
          sideEffects: "Creates only proposal-managed local bare/worktree/body artifacts and one validated commit; no network write occurs.",
          idempotent: "an exact prepared/pushed/submitted workspace returns noop; incomplete preparing state is cleaned and resumed only inside its managed directory",
        },
        submit: {
          syntax: "proposal submit <proposal-id> --confirm-external-effects [submit options]",
          positionals: proposalId,
          options: {
            "--confirm-external-effects": { type: "boolean", default: false, effect: "authorize fork creation when required, exact branch push, and PR creation" },
            "--push-mode": { type: "enum", values: ["auto", "direct", "fork"], default: "auto", effect: "auto chooses direct for write permission and fork otherwise" },
            "--push-url": { type: "credential-free Git target", requiredWhen: "selected strategy is direct", appliesTo: ["auto", "direct"] },
            "--fork-push-url": { type: "credential-free Git target", required: false, appliesTo: ["auto", "fork"], effect: "use an already-configured fork instead of creating/verifying one" },
            "--head-owner": { type: "GitHub login", required: false, dependency: "allowed only with --fork-push-url; defaults to authenticated login" },
            "--draft": { type: "boolean", default: false, effect: "mark only a newly-created PR as draft" },
          },
          sideEffects: "After confirmation, reads GitHub auth/permission, may create a personal fork, pushes the exact prepared commit to a non-conflicting branch, then discovers or creates one PR.",
          idempotent: "submitted returns noop without remote calls; pushed resumes PR discovery; exact existing branch/PR is reused",
        },
        status: {
          syntax: "proposal status <proposal-id>",
          positionals: proposalId,
          options: [],
          sideEffects: "Reads durable state and local worktree health only; no network or state write.",
          idempotent: true,
        },
        abort: {
          syntax: "proposal abort <proposal-id> [--confirm-discard]",
          positionals: proposalId,
          options: {
            "--confirm-discard": { type: "boolean", default: false, effect: "delete extra commits or uncommitted drift only inside the exact proposal-managed worktree" },
          },
          sideEffects: "Removes only this proposal's local Git workspace/body and records aborted; pushed/submitted proposals are blocked and external objects are never undone.",
          idempotent: "already aborted is noop",
        },
      },
    },
  };
}

export function helpContract() {
  const lifecycle = lifecycleHelpContract();
  const proposal = proposalHelpContract();
  return {
    contractVersion: 1,
    version: CLI_VERSION,
    output: {
      format: "one JSON object on stdout; --pretty adds indentation only",
      success: {
        schemaVersion: "1",
        ok: "true",
        status: "ok | noop",
        command: "string",
        summary: "string",
        data: "command-specific object | null",
      },
      failure: {
        schemaVersion: "1",
        ok: "false",
        status: "needs_confirmation | blocked | unsupported | error",
        command: "string",
        error: {
          code: "stable kebab-case string",
          message: "self-contained failure message",
          retryable: "boolean",
          nextAction: "string | null",
          details: "object | null",
        },
      },
    },
    globalOptions: {
      "--json": { type: "boolean", default: true, effect: "accepted for explicitness; output is always JSON" },
      "--pretty": { type: "boolean", default: false, effect: "indent JSON by two spaces" },
      "--help": { type: "boolean", default: false, effect: "return this contract" },
    },
    commands: {
      list: {
        purpose: "List local Skill Market native plugins and managed standalone skills without network refresh.",
        positionals: { type: "none", required: false },
        options: {
          "--adapter": { type: "comma-separated enum", values: ["claude", "codex", "grok", "all"], default: "all" },
          "--kind": { type: "comma-separated enum", values: ["plugin", "standalone", "all"], default: "all" },
          "--local-state": { type: "comma-separated enum", values: ["active", "disabled", "absent", "broken", "all"], default: "active,disabled,broken" },
          "--ownership": { type: "comma-separated enum", values: ["native", "skill-market", "adopted", "all"], default: "all" },
          "--update-state": { type: "comma-separated enum", values: ["current", "update_available", "ahead", "unknown", "catalog_missing", "all"], default: "all" },
          "--offset": { type: "integer", range: ">= 0", default: 0 },
          "--limit": { type: "integer", range: "1..100", default: 20 },
          "--history": { type: "boolean", default: false, effect: "include expected absent standalone uninstall records; required when --local-state explicitly selects absent" },
        },
        sideEffects: "Runs adapter-native plugin list commands and reads managed state. It never clones, fetches, or writes config/cache/package state.",
        idempotent: true,
      },
      discover: {
        purpose: "Browse or search the canonical catalog; exact, prefix, token, then description ranking.",
        positionals: { name: "query", type: "string", required: false, default: "" },
        options: {
          "--adapter": { type: "comma-separated enum", values: ["claude", "codex", "grok", "all"], default: "all" },
          "--kind": { type: "comma-separated enum", values: ["plugin", "standalone", "all"], default: "all" },
          "--status": { type: "comma-separated enum", values: ["active", "deprecated", "disabled", "removed", "all"], default: "active" },
          "--latest": { type: "boolean", default: false },
          "--offline": { type: "boolean", default: false },
          "--offset": { type: "integer", range: ">= 0", default: 0 },
          "--limit": { type: "integer", range: "1..100", default: 20 },
        },
        constraints: ["--latest and --offline are mutually exclusive"],
        sideEffects: "May clone or refresh only the configured catalog cache and its marker. It reads local inventory annotations but never changes installed packages.",
        stalePolicy: "Refresh failure may return the existing cache with freshness=stale and a warning; source/ref mismatches always block.",
        idempotent: true,
      },
      ...lifecycle.commands,
      proposal: proposal.command,
      config: {
        purpose: "Inspect or explicitly change Skill Market configuration.",
        actions: {
          show: { positionals: [], writes: false },
          set: { positionals: ["key", "value"], writes: "atomically replaces that explicit config field" },
          unset: { positionals: ["key"], writes: "atomically removes that explicit config field" },
        },
        keys: ["readRepoUrl", "baseRef", "cachePath", "cacheTtlSeconds", "repoPath"],
        precedence: "command override > environment > config file > in-memory default",
        idempotent: true,
      },
    },
    lifecycle: lifecycle.contract,
    proposal: proposal.contract,
    sourceOptions: {
      "--read-repo-url": { type: "HTTPS URL without embedded credentials", default: "https://github.com/myqz-wld/skill-market.git" },
      "--base-ref": { type: "safe Git ref", default: "main" },
      "--cache-path": { type: "absolute path or ~/ path", default: "~/.skill-market/cache/skill-market" },
      "--cache-ttl-seconds": { type: "non-negative integer", default: 86400, zero: "disable automatic refresh and report cached data as stale" },
      "--repo-path": { type: "absolute path or ~/ path | null", default: null, effect: "read this checkout directly and skip cache/network behavior" },
    },
    environment: {
      SKILL_MARKET_HOME: "absolute or ~/ state root",
      SKILL_MARKET_CONFIG: "absolute or ~/ config JSON path",
      SKILL_MARKET_READ_REPO_URL: "readRepoUrl override",
      SKILL_MARKET_BASE_REF: "baseRef override",
      SKILL_MARKET_CACHE_PATH: "cachePath override",
      SKILL_MARKET_CACHE_TTL_SECONDS: "cacheTtlSeconds override",
      SKILL_MARKET_REPO_PATH: "repoPath override",
    },
    exitCodes: { ok: 0, error: 1, needsConfirmation: 2, blocked: 3, unsupported: 4 },
  };
}

function sourceOverrides(options) {
  return Object.fromEntries(
    ["readRepoUrl", "baseRef", "cachePath", "cacheTtlSeconds", "repoPath"]
      .filter((key) => options[key] !== undefined)
      .map((key) => [key, options[key]]),
  );
}

function lifecycleOptions(options) {
  const selected = Object.fromEntries(
    LIFECYCLE_OPTION_KEYS
      .filter((key) => options[key] !== undefined)
      .map((key) => [key, options[key]]),
  );
  const overrides = sourceOverrides(options);
  if (Object.keys(overrides).length > 0) {
    selected.sourceOverrides = overrides;
  }
  return selected;
}

async function runList(options, services, env) {
  const validated = listInventory({
    inventory: {
      items: [],
      warnings: [],
      catalog: { loaded: false, freshness: null, source: null },
    },
    ...options,
  });
  const effective = await services.loadEffectiveConfig({
    env,
    overrides: sourceOverrides(options),
  });
  const optional = await services.loadOptionalCatalogSnapshot({
    config: effective.values,
    now: services.now,
  });
  const inventory = await services.collectLocalInventory({
    adapters: validated.filters.adapters,
    kinds: validated.filters.kinds,
    statePath: effective.paths.managedStatePath,
    catalogSnapshot: optional.snapshot,
    nativeReader: services.nativeReader,
    env,
  });
  inventory.warnings.push(...optional.warnings);
  const data = listInventory({ inventory, ...options });
  return successResult({
    command: "list",
    status: data.page.total === 0 ? "noop" : "ok",
    summary: `${data.page.count} of ${data.page.total} local Skill Market packages returned.`,
    data,
  });
}

async function runDiscover(options, positionals, services, env) {
  const query = positionals.join(" ");
  const validated = discoverCatalog({
    catalog: { packages: [] },
    inventoryItems: [],
    freshness: null,
    query,
    ...options,
  });
  const effective = await services.loadEffectiveConfig({
    env,
    overrides: sourceOverrides(options),
  });
  const snapshot = await services.loadCatalogSnapshot({
    config: effective.values,
    latest: Boolean(options.latest),
    offline: Boolean(options.offline),
    git: services.git,
    now: services.now,
  });
  const inventory = await services.collectLocalInventory({
    adapters: validated.filters.adapters,
    kinds: validated.filters.kinds,
    statePath: effective.paths.managedStatePath,
    catalogSnapshot: snapshot,
    nativeReader: services.nativeReader,
    env,
  });
  const result = discoverCatalog({
    catalog: snapshot.catalog,
    inventoryItems: inventory.items,
    freshness: snapshot.freshness,
    query,
    ...options,
  });
  const data = {
    ...result,
    source: snapshot.source,
    warnings: [...snapshot.warnings, ...inventory.warnings],
  };
  return successResult({
    command: "discover",
    status: data.page.total === 0 ? "noop" : "ok",
    summary: `${data.page.count} of ${data.page.total} catalog packages returned.`,
    data,
  });
}

async function runLifecycle(operation, options, positionals, services, env) {
  const [id] = requirePositionals(positionals, {
    min: 1,
    usage: `${operation} <adapter>:<kind>:<name> [options]`,
  });
  const result = await services.executeLifecycle({
    operation,
    id,
    options: lifecycleOptions(options),
    env,
  });
  return successResult({
    command: operation,
    status: result.status,
    summary: result.summary,
    data: {
      ...(result.data ?? {}),
      warnings: result.warnings ?? [],
    },
  });
}

function invalidProposalOptions(issue, details) {
  throw new SkillMarketError({
    code: "invalid-arguments",
    message: `Invalid proposal arguments: ${issue}.`,
    details,
    nextAction: "Run skill-market help, inspect commands.proposal, and retry with the documented action shape.",
  });
}

function validateSubmitOptions(options) {
  const mode = options.pushMode ?? "auto";
  if (!["auto", "direct", "fork"].includes(mode)) {
    invalidProposalOptions("--push-mode must be auto, direct, or fork", {
      option: "push-mode",
      value: options.pushMode,
    });
  }
  if (mode === "direct" && (options.forkPushUrl || options.headOwner)) {
    invalidProposalOptions("--fork-push-url and --head-owner do not apply to direct mode", {
      pushMode: mode,
      forkPushUrl: options.forkPushUrl ?? null,
      headOwner: options.headOwner ?? null,
    });
  }
  if (mode === "fork" && options.pushUrl) {
    invalidProposalOptions("--push-url does not apply to fork mode", {
      pushMode: mode,
      pushUrl: options.pushUrl,
    });
  }
  if (options.headOwner && !options.forkPushUrl) {
    invalidProposalOptions("--head-owner requires --fork-push-url", {
      headOwner: options.headOwner,
    });
  }
}

async function runProposal(action, options, positionals, services, env) {
  let result;
  if (action === "plan") {
    requirePositionals(positionals, { min: 0, usage: "proposal plan --spec <json-file>" });
    if (!options.specPath) {
      invalidProposalOptions("proposal plan requires --spec <json-file>", {
        action,
        required: ["--spec"],
      });
    }
    result = await services.planProposal({
      specPath: options.specPath,
      options,
      env,
    });
  } else {
    const [id] = requirePositionals(positionals, {
      min: 1,
      usage: `proposal ${action} <proposal-id> [options]`,
    });
    if (action === "prepare") {
      result = await services.prepareProposal({ id, env });
    } else if (action === "submit") {
      validateSubmitOptions(options);
      result = await services.submitProposal({ id, options, env });
    } else if (action === "status") {
      result = await services.statusProposal({ id, env });
    } else {
      result = await services.abortProposal({ id, options, env });
    }
  }
  return successResult({
    command: `proposal ${action}`,
    status: result.status,
    summary: result.summary,
    data: result.data,
  });
}

async function runConfig(positionals, services, env) {
  const [action = "show", ...values] = positionals;
  if (action === "show") {
    requirePositionals(values, { min: 0, usage: "config show" });
    const effective = await services.loadEffectiveConfig({ env });
    return successResult({
      command: "config show",
      summary: effective.configExists
        ? "Effective Skill Market configuration loaded."
        : "Using in-memory Skill Market defaults; no config file exists.",
      data: configFileView(effective),
    });
  }
  if (action === "set") {
    const [key, rawValue] = requirePositionals(values, {
      min: 2,
      usage: "config set <key> <value>",
    });
    const result = await services.updateConfig({
      env,
      patch: { [key]: parseConfigValue(key, rawValue) },
    });
    return successResult({
      command: "config set",
      summary: `Saved ${key} in explicit Skill Market config.`,
      data: result,
    });
  }
  if (action === "unset") {
    const [key] = requirePositionals(values, {
      min: 1,
      usage: "config unset <key>",
    });
    parseConfigValue(key, "0");
    const result = await services.updateConfig({ env, unset: [key] });
    return successResult({
      command: "config unset",
      summary: `Removed ${key} from explicit Skill Market config.`,
      data: result,
    });
  }
  throw new SkillMarketError({
    code: "unknown-config-action",
    message: `Unknown config action: ${action}.`,
    details: { action, allowed: ["show", "set", "unset"] },
    nextAction: "Use config show, config set <key> <value>, or config unset <key>.",
  });
}

function servicesWithDefaults(dependencies) {
  return {
    loadEffectiveConfig,
    loadOptionalCatalogSnapshot,
    loadCatalogSnapshot,
    collectLocalInventory,
    executeLifecycle,
    planProposal,
    prepareProposal,
    submitProposal,
    statusProposal,
    abortProposal,
    updateConfig,
    nativeReader: undefined,
    git: undefined,
    now: () => Date.now(),
    ...dependencies,
  };
}

export async function runCli(argv, { env = process.env, ...dependencies } = {}) {
  const command = argv[0] ?? "help";
  const services = servicesWithDefaults(dependencies);
  try {
    if (command === "help" || command === "--help" || command === "-h") {
      return successResult({
        command: "help",
        summary: "Skill Market CLI command contract.",
        data: helpContract(),
      });
    }
    if (command === "--version") {
      return successResult({ command: "version", summary: CLI_VERSION, data: { version: CLI_VERSION } });
    }
    if (command === "list") {
      const parsed = parseOptions(argv.slice(1), LIST_OPTIONS);
      requirePositionals(parsed.positionals, { min: 0, usage: "list [options]" });
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runList(parsed.options, services, env);
    }
    if (command === "discover") {
      const parsed = parseOptions(argv.slice(1), DISCOVER_OPTIONS);
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runDiscover(parsed.options, parsed.positionals, services, env);
    }
    if (Object.hasOwn(LIFECYCLE_DEFINITIONS, command)) {
      const parsed = parseOptions(argv.slice(1), LIFECYCLE_DEFINITIONS[command]);
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runLifecycle(command, parsed.options, parsed.positionals, services, env);
    }
    if (command === "proposal") {
      const action = argv[1];
      if (action === undefined || action === "--help" || action === "help") {
        return runCli(["help"], { env, ...dependencies });
      }
      if (!Object.hasOwn(PROPOSAL_ACTION_OPTIONS, action)) {
        throw new SkillMarketError({
          code: "unknown-proposal-action",
          message: `Unknown proposal action: ${action}.`,
          details: { action, allowed: Object.keys(PROPOSAL_ACTION_OPTIONS) },
          nextAction: "Use proposal plan, prepare, submit, status, or abort.",
        });
      }
      const parsed = parseOptions(argv.slice(2), PROPOSAL_ACTION_OPTIONS[action]);
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runProposal(action, parsed.options, parsed.positionals, services, env);
    }
    if (command === "config") {
      const parsed = parseOptions(argv.slice(1), CONFIG_OPTIONS);
      if (parsed.options.help) return runCli(["help"], { env, ...dependencies });
      return await runConfig(parsed.positionals, services, env);
    }
    throw new SkillMarketError({
      code: "unknown-command",
      message: `Unknown Skill Market command: ${command}.`,
      details: {
        command,
        allowed: [
          "list",
          "discover",
          "download",
          "install",
          "update",
          "enable",
          "disable",
          "uninstall",
          "proposal",
          "config",
          "help",
        ],
      },
      nextAction: "Run skill-market help and choose a canonical command.",
    });
  } catch (error) {
    const failure = asSkillMarketError(error);
    return failureResult({
      command,
      code: failure.code,
      message: failure.message,
      status: failure.status,
      retryable: failure.retryable,
      nextAction: failure.nextAction,
      details: failure.details,
    });
  }
}
