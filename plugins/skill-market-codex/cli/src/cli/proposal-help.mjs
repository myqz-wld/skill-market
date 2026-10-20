import { commandOptionNames, commandOptionHelp } from "./registry.mjs";

export function proposalHelpContract() {
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
            version: { type: "semver string", requiredFor: ["add", "update"], forbiddenFor: ["retire", "remove"], constraints: ["update must be greater than catalog version", "new standalone must have core version 0.0.1; prereleases such as 0.0.1-draft.1 are allowed", "plugin manifest must match name/version"] },
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
          options: commandOptionNames("proposal", "plan"),
          sideEffects: "May strictly refresh the configured read cache and writes durable local proposal state; creates no branch, commit, fork, push, or PR.",
          idempotent: "the same normalized spec, source digests, base commit, and catalog digest return the same proposal id and noop; an identical aborted proposal is reactivated",
        },
        prepare: {
          syntax: "proposal prepare <proposal-id>",
          positionals: proposalId,
          options: commandOptionNames("proposal", "prepare"),
          sideEffects: "Creates only proposal-managed local bare/worktree/body artifacts and one validated commit; no network write occurs.",
          idempotent: "an exact prepared/pushed/submitted workspace returns noop; incomplete preparing state is cleaned and resumed only inside its managed directory",
        },
        submit: {
          syntax: "proposal submit <proposal-id> --confirm-external-effects [submit options]",
          positionals: proposalId,
          options: commandOptionHelp("proposal", "submit"),
          sideEffects: "After confirmation, reads GitHub auth/permission, may create a personal fork, pushes the exact prepared commit to a non-conflicting branch, then discovers or creates one PR.",
          idempotent: "submitted returns noop without remote calls; pushed resumes PR discovery; exact existing branch/PR is reused",
        },
        status: {
          syntax: "proposal status <proposal-id>",
          positionals: proposalId,
          options: commandOptionNames("proposal", "status"),
          sideEffects: "Reads durable state and local worktree health only; no network or state write.",
          idempotent: true,
        },
        abort: {
          syntax: "proposal abort <proposal-id> [--confirm-discard]",
          positionals: proposalId,
          options: commandOptionHelp("proposal", "abort"),
          sideEffects: "Removes only this proposal's local Git workspace/body and records aborted; pushed/submitted proposals are blocked and external objects are never undone.",
          idempotent: "already aborted is noop",
        },
      },
    },
  };
}
