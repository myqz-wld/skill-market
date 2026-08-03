import { mkdir, readdir, writeFile } from "node:fs/promises";

import {
  applyProposalToWorktree,
  assertExpectedProposalChanges,
  enrichProposalSources,
  proposalCommitMessage,
} from "./proposal-apply.mjs";
import { canonicalDigest, proposalIdFor } from "./proposal-contracts.mjs";
import { digestBytes } from "./proposal-git.mjs";
import {
  branchFor,
  cleanupWorkspace,
  ensureSourceStillExact,
  metadataIfExists,
  proposalBody,
  proposalError,
  proposalServices,
  proposalSourceOverrides,
  publicProposalResult,
  readProposalSpec,
  validateSnapshotBase,
  verifyPreparedWorkspace,
} from "./proposal-runtime.mjs";
import {
  evolveProposalState,
  initialProposalState,
  readProposalState,
  resolveProposalPaths,
  withProposalLock,
  writeProposalState,
} from "./proposal-store.mjs";

export async function planProposal({ specPath, options = {}, env = process.env, dependencies = {} }) {
  const services = proposalServices({ env, dependencies });
  const effective = await services.loadEffectiveConfig({
    env,
    overrides: proposalSourceOverrides(options),
  });
  const input = await readProposalSpec(specPath, effective.paths.home);
  const snapshot = await services.loadCatalogSnapshot({
    config: effective.values,
    latest: true,
    allowStaleOnRefreshFailure: false,
    now: services.now,
  });
  const source = await validateSnapshotBase({
    snapshot,
    config: effective.values,
    git: services.git,
  });
  const enrichedSpec = await enrichProposalSources({
    spec: input.spec,
    catalog: snapshot.catalog,
    proposalsRoot: effective.paths.proposalsRoot,
  });
  const planIdentity = {
    schemaVersion: 1,
    spec: enrichedSpec,
    source: {
      repoIdentity: source.repoIdentity,
      baseRef: source.baseRef,
      baseCommit: source.baseCommit,
      catalogDigest: source.catalogDigest,
    },
  };
  const planHash = canonicalDigest(planIdentity);
  const id = proposalIdFor(planIdentity);
  const paths = resolveProposalPaths(env, id);
  return withProposalLock(paths, async () => {
    const existingMetadata = await metadataIfExists(paths.statePath);
    if (existingMetadata) {
      const existing = await readProposalState(paths);
      if (existing.planHash !== planHash) {
        throw proposalError(
          "proposal-id-collision",
          "A different proposal plan resolved to the same shortened proposal id.",
          { id, expectedPlanHash: planHash, existingPlanHash: existing.planHash },
          "Preserve both inputs and report this digest collision before proceeding.",
        );
      }
      if (existing.status === "aborted") {
        const replanned = evolveProposalState(existing, {
          status: "planned",
          patch: { workspace: null, submission: null },
          event: "replanned",
          now: services.now,
        });
        const saved = await writeProposalState(paths, replanned);
        return publicProposalResult("ok", `Proposal ${id} was reactivated from its identical plan.`, saved);
      }
      return publicProposalResult("noop", `Proposal ${id} already records this exact plan.`, existing);
    }
    if (await metadataIfExists(paths.proposalDir)) {
      const entries = await readdir(paths.proposalDir);
      if (entries.length > 0) {
        throw proposalError(
          "proposal-directory-collision",
          "Proposal directory exists with unmanaged artifacts but no durable state.",
          { id, proposalDir: paths.proposalDir, entries },
          "Inspect and relocate the unmanaged directory; do not let proposal plan overwrite it.",
        );
      }
    }
    await mkdir(paths.proposalDir, { recursive: true });
    const initial = initialProposalState({ id, planHash, spec: enrichedSpec, source, now: services.now });
    const saved = await writeProposalState(paths, initial);
    return publicProposalResult(
      "ok",
      `Proposal ${id} planned without creating a Git branch or external effect.`,
      saved,
    );
  });
}

export async function prepareProposal({ id, env = process.env, dependencies = {} }) {
  const services = proposalServices({ env, dependencies });
  const paths = resolveProposalPaths(env, id);
  return withProposalLock(paths, async () => {
    let state = await readProposalState(paths);
    if (["prepared", "pushed", "submitted"].includes(state.status)) {
      await verifyPreparedWorkspace(state, paths, services.git);
      return publicProposalResult("noop", `Proposal ${id} is already ${state.status}.`, state);
    }
    if (state.status === "aborted") {
      throw proposalError(
        "proposal-aborted",
        `Proposal ${id} is aborted.`,
        { id },
        "Run proposal plan with the identical spec to reactivate it, or create a new plan.",
      );
    }
    if (state.status === "preparing") {
      try {
        await cleanupWorkspace(paths, services.git, { force: true });
        state = await writeProposalState(
          paths,
          evolveProposalState(state, {
            status: "planned",
            patch: { workspace: null },
            event: "prepare-recovered",
            now: services.now,
          }),
        );
      } catch (error) {
        throw proposalError(
          "proposal-workspace-recovery-required",
          "Incomplete proposal preparation could not be cleaned up safely.",
          { id, originalError: error.message },
          "Inspect only the canonical proposal directory and resolve its worktree/bare-repository state before retrying.",
          { cause: error },
        );
      }
    }

    const { root } = await ensureSourceStillExact(state, services.git, paths.proposalsRoot);
    const branchName = branchFor(state);
    const preparing = await writeProposalState(
      paths,
      evolveProposalState(state, {
        status: "preparing",
        patch: {
          workspace: {
            barePath: paths.barePath,
            worktreePath: paths.worktreePath,
            bodyPath: paths.bodyPath,
            branchName,
            preparedCommit: null,
            treeHash: null,
            diffHash: null,
            bodyDigest: null,
            changes: [],
          },
        },
        event: "preparing",
        now: services.now,
      }),
    );
    try {
      for (const target of [paths.barePath, paths.worktreePath, paths.bodyPath]) {
        if (await metadataIfExists(target)) {
          throw proposalError(
            "proposal-workspace-collision",
            "Proposal workspace target exists before isolated preparation.",
            { id, target },
            "Inspect and clean only this proposal's managed artifacts, then retry prepare.",
          );
        }
      }
      await services.git.cloneBare({ sourceRoot: root, destination: paths.barePath });
      await services.git.createWorktree({
        barePath: paths.barePath,
        destination: paths.worktreePath,
        branch: branchName,
        commit: state.source.baseCommit,
      });
      const application = await applyProposalToWorktree({
        state: preparing,
        worktreePath: paths.worktreePath,
        proposalsRoot: paths.proposalsRoot,
      });
      const changedPaths = await services.git.changedPaths(paths.worktreePath, state.source.baseCommit);
      assertExpectedProposalChanges(changedPaths, application.allowedPrefixes);
      await services.git.diffCheck(paths.worktreePath, state.source.baseCommit);
      await services.git.stage(paths.worktreePath, application.allowedPrefixes);
      const preparedCommit = await services.git.commit(paths.worktreePath, {
        message: proposalCommitMessage(state.spec),
      });
      if ((await services.git.status(paths.worktreePath)) !== "") {
        throw proposalError(
          "proposal-workspace-drift",
          "Proposal worktree is not clean immediately after its generated commit.",
          { id },
          "Do not submit; inspect the isolated worktree and create a new proposal if needed.",
        );
      }
      const [treeHash, diffBytes] = await Promise.all([
        services.git.tree(paths.worktreePath),
        services.git.diffBytes(paths.worktreePath, state.source.baseCommit, preparedCommit),
      ]);
      const diffHash = digestBytes(diffBytes);
      const workspace = {
        ...preparing.workspace,
        preparedCommit,
        treeHash,
        diffHash,
        changes: application.changes,
      };
      const body = proposalBody(state, workspace);
      await writeFile(paths.bodyPath, body, { encoding: "utf8", mode: 0o600, flag: "wx" });
      workspace.bodyDigest = digestBytes(Buffer.from(body, "utf8"));
      const prepared = await writeProposalState(
        paths,
        evolveProposalState(preparing, {
          status: "prepared",
          patch: { workspace },
          event: "prepared",
          now: services.now,
        }),
      );
      return publicProposalResult(
        "ok",
        `Proposal ${id} prepared locally at ${preparedCommit}; nothing was pushed.`,
        prepared,
        { changedPaths },
      );
    } catch (error) {
      const recoveryFailures = [];
      try {
        await cleanupWorkspace(paths, services.git, { force: true });
      } catch (cleanupError) {
        recoveryFailures.push(`workspace: ${cleanupError.message}`);
      }
      try {
        await writeProposalState(
          paths,
          evolveProposalState(preparing, {
            status: recoveryFailures.length === 0 ? "planned" : "preparing",
            patch: recoveryFailures.length === 0 ? { workspace: null } : {},
            event: recoveryFailures.length === 0 ? "prepare-rolled-back" : "prepare-recovery-failed",
            now: services.now,
          }),
        );
      } catch (stateError) {
        recoveryFailures.push(`state: ${stateError.message}`);
      }
      if (recoveryFailures.length > 0) {
        throw proposalError(
          "proposal-workspace-recovery-required",
          "Proposal preparation failed and cleanup was incomplete.",
          { id, originalError: error.message, recoveryFailures },
          "Stop proposal mutations and reconcile only the canonical proposal directory before retrying.",
          { cause: error },
        );
      }
      throw error;
    }
  });
}
