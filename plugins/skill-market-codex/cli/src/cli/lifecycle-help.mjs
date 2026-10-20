import { commandOptionNames, optionHelp, LIFECYCLE_OPTION_NAMES } from "./registry.mjs";

export function lifecycleHelpContract() {
  const stableId = {
    name: "id",
    type: "canonical package id",
    format: "<adapter>:<kind>:<kebab-case-name>",
    adapters: ["claude", "codex", "grok"],
    kinds: ["plugin", "standalone"],
    required: true,
  };
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
      options: optionHelp(LIFECYCLE_OPTION_NAMES),
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
      standalonePathTopology: {
        adapterRoot: "~/.claude, ~/.codex, or ~/.grok may be a symbolic link resolving to an existing real directory; the resolved directory is the containment root",
        descendants: "skills, skills.disabled, transaction roots, package state, and lock ancestors must not redirect through symbolic links",
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
        options: commandOptionNames("download"),
        sideEffects: "May refresh the catalog cache and atomically create or replace only the resolved download destination; never changes installed package state.",
        idempotent: "matching content is noop; different content requires --force",
      },
      install: {
        purpose: "Install one exact catalog plugin or standalone skill with adapter-specific safety gates.",
        positionals: stableId,
        options: commandOptionNames("install"),
        sideEffects: "May refresh the catalog cache; invokes the selected native plugin CLI or atomically writes one canonical standalone path plus managed state.",
        idempotent: "matching existing installation is noop; version/content mismatch routes to update",
      },
      update: {
        purpose: "Update one installed package from an eligible catalog entry while preserving activation and native scope.",
        positionals: stableId,
        options: commandOptionNames("update"),
        sideEffects: "Refreshes or pins the catalog, then invokes the selected native updater or atomically swaps standalone content and managed state.",
        idempotent: "current matching content is noop unless --force",
      },
      enable: {
        purpose: "Enable one installed package without fetching catalog content.",
        positionals: stableId,
        options: commandOptionNames("enable"),
        sideEffects: "Moves one managed standalone directory or invokes the native adapter; Codex plugins return unsupported.",
        idempotent: "already active is noop",
      },
      disable: {
        purpose: "Disable one installed package while preserving its files and persistent data.",
        positionals: stableId,
        options: commandOptionNames("disable"),
        sideEffects: "Moves one managed standalone directory or invokes the native adapter; Codex plugins return unsupported.",
        idempotent: "already disabled is noop",
      },
      uninstall: {
        purpose: "Remove one installed package while retaining standalone history and native persistent data by default.",
        positionals: stableId,
        options: commandOptionNames("uninstall"),
        sideEffects: "Atomically removes an exact standalone path and records absent history, or invokes native uninstall; --remove-data expands native deletion for Claude/Grok.",
        idempotent: "already absent is noop",
      },
    },
  };
}
