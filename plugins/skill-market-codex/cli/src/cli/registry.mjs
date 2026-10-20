// Parser definitions and help metadata share this registry.
const define = (key, type, help) => Object.freeze({ key, type, help });

export const OPTIONS = Object.freeze({
  "pretty": define("pretty", "boolean", {"type": "boolean", "default": false, "effect": "indent JSON by two spaces"}),
  "json": define("json", "boolean", {"type": "boolean", "default": true, "effect": "accepted for explicitness; output is always JSON"}),
  "help": define("help", "boolean", {"type": "boolean", "default": false, "effect": "return this contract"}),
  "read-repo-url": define("readRepoUrl", "value", {"type": "HTTPS URL without embedded credentials", "default": "https://github.com/myqz-wld/skill-market.git"}),
  "base-ref": define("baseRef", "value", {"type": "safe Git ref", "default": "main"}),
  "cache-path": define("cachePath", "value", {"type": "absolute path or ~/ path", "default": "~/.skill-market/cache/skill-market"}),
  "cache-ttl-seconds": define("cacheTtlSeconds", "value", {"type": "non-negative integer", "default": 86400, "zero": "disable automatic refresh and report cached data as stale"}),
  "repo-path": define("repoPath", "value", {"type": "absolute path or ~/ path | null", "default": null, "effect": "read this checkout directly and skip cache/network behavior"}),
  "adapter": define("adapters", "list", {"type": "comma-separated enum", "values": ["claude", "codex", "grok", "all"], "default": "all"}),
  "kind": define("kinds", "list", {"type": "comma-separated enum", "values": ["plugin", "standalone", "all"], "default": "all"}),
  "local-state": define("localStates", "list", {"type": "comma-separated enum", "values": ["active", "disabled", "absent", "broken", "all"], "default": "active,disabled,broken"}),
  "ownership": define("ownership", "list", {"type": "comma-separated enum", "values": ["native", "skill-market", "adopted", "all"], "default": "all"}),
  "update-state": define("updateStates", "list", {"type": "comma-separated enum", "values": ["current", "update_available", "ahead", "unknown", "catalog_missing", "all"], "default": "all"}),
  "history": define("history", "boolean", {"type": "boolean", "default": false, "effect": "include expected absent standalone uninstall records; required when --local-state explicitly selects absent"}),
  "offset": define("offset", "value", {"type": "integer", "range": ">= 0", "default": 0}),
  "limit": define("limit", "value", {"type": "integer", "range": "1..100", "default": 20}),
  "status": define("statuses", "list", {"type": "comma-separated enum", "values": ["active", "deprecated", "disabled", "removed", "all"], "default": "active"}),
  "latest": define("latest", "boolean", {"type": "boolean", "default": false}),
  "offline": define("offline", "boolean", {"type": "boolean", "default": false}),
  "allow-stale-head": define("allowStaleHead", "value", {"type": "lowercase commit id", "format": "exactly 40 or 64 hexadecimal characters", "default": null, "appliesTo": ["download", "install", "update"], "effect": "read the matching configured cache offline; reject any head mismatch"}),
  "allow-deprecated": define("allowDeprecated", "boolean", {"type": "boolean", "default": false, "appliesTo": ["download", "install"], "effect": "accept a deprecated catalog entry for a new copy or installation"}),
  "destination": define("destination", "value", {"type": "absolute path or ~/ path", "default": "~/.skill-market/downloads/<adapter>/<kind>/<name>/<version>", "appliesTo": ["download"], "constraint": "must remain below ~/.skill-market/downloads (or the configured SKILL_MARKET_HOME downloads root)"}),
  "force": define("force", "boolean", {"type": "boolean", "default": false, "appliesTo": ["download", "update"], "effect": "replace differing download content or reinstall an already-current package"}),
  "adopt": define("adopt", "boolean", {"type": "boolean", "default": false, "appliesTo": ["standalone install", "standalone uninstall"], "effect": "authorize replacing or removing an exact unmanaged canonical package path after inspection"}),
  "confirm-source-change": define("confirmSourceChange", "boolean", {"type": "boolean", "default": false, "appliesTo": ["standalone update", "Grok plugin install/update/enable/disable/uninstall"], "effect": "accept a verified source-identity change or missing/mismatched Grok provenance"}),
  "confirm-trust": define("confirmTrust", "boolean", {"type": "boolean", "default": false, "appliesTo": ["Grok plugin install"], "effect": "pass Grok --trust only after the caller inspected the exact catalog package"}),
  "scope": define("scope", "value", {"type": "enum", "values": ["user", "project", "local", "managed"], "default": "detected installed scope, otherwise user for a new install; missing installed scope blocks until --scope is explicit", "appliesTo": ["Claude plugin install/update/enable/disable/uninstall"], "constraints": ["install accepts user, project, or local", "managed is update-only; managed enable/disable/uninstall is controlled by policy", "an explicit scope cannot differ from a detected installed scope"]}),
  "confirm-drift": define("confirmDrift", "boolean", {"type": "boolean", "default": false, "appliesTo": ["standalone update", "standalone enable", "standalone disable", "standalone uninstall"], "effect": "authorize overwrite, move, or deletion after the local digest differs from managed state"}),
  "confirm-reinstall": define("confirmReinstall", "boolean", {"type": "boolean", "default": false, "appliesTo": ["Codex plugin update"], "effect": "authorize a Git-marketplace refresh when applicable, followed by remove/add and at most one add retry"}),
  "remove-data": define("removeData", "boolean", {"type": "boolean", "default": false, "appliesTo": ["Claude plugin uninstall", "Grok plugin uninstall"], "effect": "omit the native --keep-data flag and allow native persistent plugin data removal"}),
  "spec": define("specPath", "value", {"type": "path", "required": true, "effect": "UTF-8 proposal JSON input"}),
  "confirm-external-effects": define("confirmExternalEffects", "boolean", {"type": "boolean", "default": false, "effect": "authorize fork creation when required, exact branch push, and PR creation"}),
  "push-mode": define("pushMode", "value", {"type": "enum", "values": ["auto", "direct", "fork"], "default": "auto", "effect": "auto chooses direct for write permission and fork otherwise"}),
  "push-url": define("pushUrl", "value", {"type": "credential-free Git target", "requiredWhen": "selected strategy is direct", "appliesTo": ["auto", "direct"]}),
  "fork-push-url": define("forkPushUrl", "value", {"type": "credential-free Git target", "required": false, "appliesTo": ["auto", "fork"], "effect": "use an already-configured fork instead of creating/verifying one"}),
  "head-owner": define("headOwner", "value", {"type": "GitHub login", "required": false, "dependency": "allowed only with --fork-push-url; defaults to authenticated login"}),
  "draft": define("draft", "boolean", {"type": "boolean", "default": false, "effect": "mark only a newly-created PR as draft"}),
  "confirm-discard": define("confirmDiscard", "boolean", {"type": "boolean", "default": false, "effect": "delete extra commits or uncommitted drift only inside the exact proposal-managed worktree"}),
});

export const GLOBAL_OPTION_NAMES = ["--json", "--pretty", "--help"].map((name) => name.slice(2));
export const SOURCE_OPTION_NAMES = ["read-repo-url", "base-ref", "cache-path", "cache-ttl-seconds", "repo-path"];
export const SOURCE_OPTION_KEYS = SOURCE_OPTION_NAMES.map((name) => OPTIONS[name].key);
export const LIFECYCLE_OPTION_NAMES = ["allow-stale-head", "allow-deprecated", "destination", "force", "adopt", "confirm-drift", "confirm-source-change", "confirm-trust", "confirm-reinstall", "scope", "remove-data"];
export const LIFECYCLE_OPTION_KEYS = LIFECYCLE_OPTION_NAMES.map((name) => OPTIONS[name].key);

export const COMMANDS = Object.freeze({
  list: {"options": ["adapter", "kind", "local-state", "ownership", "update-state", "offset", "limit", "history"], "sourceOptions": true},
  discover: {"options": ["adapter", "kind", "status", "latest", "offline", "offset", "limit"], "sourceOptions": true},
  download: {"options": ["read-repo-url", "base-ref", "cache-path", "cache-ttl-seconds", "repo-path", "allow-stale-head", "allow-deprecated", "destination", "force"], "lifecycle": true},
  install: {"options": ["read-repo-url", "base-ref", "cache-path", "cache-ttl-seconds", "repo-path", "allow-stale-head", "allow-deprecated", "adopt", "confirm-source-change", "confirm-trust", "scope"], "lifecycle": true},
  update: {"options": ["read-repo-url", "base-ref", "cache-path", "cache-ttl-seconds", "repo-path", "allow-stale-head", "force", "confirm-drift", "confirm-source-change", "confirm-reinstall", "scope"], "lifecycle": true},
  enable: {"options": ["read-repo-url", "cache-path", "repo-path", "confirm-drift", "confirm-source-change", "scope"], "lifecycle": true},
  disable: {"options": ["read-repo-url", "cache-path", "repo-path", "confirm-drift", "confirm-source-change", "scope"], "lifecycle": true},
  uninstall: {"options": ["read-repo-url", "cache-path", "repo-path", "adopt", "confirm-drift", "confirm-source-change", "scope", "remove-data"], "lifecycle": true},
  proposal: { actions: {
    plan: { options: ["spec", "read-repo-url", "base-ref", "cache-path", "cache-ttl-seconds", "repo-path"] },
    prepare: { options: [] },
    submit: { options: ["confirm-external-effects", "push-mode", "push-url", "fork-push-url", "head-owner", "draft"] },
    status: { options: [] },
    abort: { options: ["confirm-discard"] },
  } },
  config: {"options": []},
});

export const COMMAND_NAMES = Object.keys(COMMANDS);
export const LIFECYCLE_COMMANDS = COMMAND_NAMES.filter((name) => COMMANDS[name].lifecycle);
export const PROPOSAL_PHASES = Object.keys(COMMANDS.proposal.actions);

function selected(command, action) {
  const definition = action === undefined ? COMMANDS[command] : COMMANDS[command]?.actions?.[action];
  if (!definition || !Array.isArray(definition.options)) {
    throw new TypeError(`Unknown CLI option scope: ${command}${action === undefined ? "" : ` ${action}`}`);
  }
  return definition;
}

export function optionsFor(command, action) {
  const definition = selected(command, action);
  const names = [...GLOBAL_OPTION_NAMES, ...(definition.sourceOptions ? SOURCE_OPTION_NAMES : []), ...definition.options];
  return Object.fromEntries(names.map((name) => {
    const { key, type } = OPTIONS[name];
    return [name, { key, type }];
  }));
}

export function optionHelp(names) {
  return Object.fromEntries(names.map((name) => [`--${name}`, structuredClone(OPTIONS[name].help)]));
}

export function commandOptionNames(command, action) {
  return selected(command, action).options.map((name) => `--${name}`);
}

export function commandOptionHelp(command, action) {
  return optionHelp(selected(command, action).options);
}
