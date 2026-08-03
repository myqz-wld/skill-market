import { validatePushTarget } from "./proposal-git.mjs";
import {
  githubRepositoryFromIdentity,
  resolveSubmissionStrategy,
} from "./proposal-host.mjs";
import {
  cleanupWorkspace,
  proposalError,
  proposalServices,
  publicProposalResult,
  safeManagedMetadata,
  verifyPreparedWorkspace,
} from "./proposal-runtime.mjs";
import {
  assertProposalTopology,
  evolveProposalState,
  readProposalState,
  resolveProposalPaths,
  withProposalLock,
  writeProposalState,
} from "./proposal-store.mjs";

function submitConfirmation() {
  return proposalError(
    "proposal-submit-confirmation",
    "Proposal submit can create a fork, push a branch, and open a pull request.",
    { externalEffects: ["fork if required", "Git push", "GitHub pull request"] },
    "After verifying the prepared commit and diff hash, retry with --confirm-external-effects.",
    { status: "needs_confirmation" },
  );
}

async function resolvePush({ state, options, github }) {
  const baseRepository = githubRepositoryFromIdentity(state.source.repoIdentity);
  const [permission, login] = await Promise.all([
    github.viewerPermission(baseRepository),
    github.currentLogin(),
  ]);
  const mode = options.pushMode ?? "auto";
  const needsFork = mode === "fork" || (mode === "auto" && !github.canPushDirect(permission));
  let fork = null;
  if (needsFork && !options.forkPushUrl) {
    fork = await github.ensureFork({ baseRepository, login });
  }
  const resolved = resolveSubmissionStrategy({
    pushMode: mode,
    permission,
    baseRepository,
    login,
    pushUrl: options.pushUrl,
    forkPushUrl: options.forkPushUrl,
    headOwner: options.headOwner,
    fork,
    canPushDirect: (value) => github.canPushDirect(value),
  });
  return {
    baseRepository,
    ...resolved,
    pushTarget: validatePushTarget(resolved.pushTarget),
  };
}

function assertRemoteCommit(remoteHead, state) {
  if (remoteHead === null) {
    throw proposalError(
      "proposal-remote-branch-missing",
      "Recorded pushed proposal branch no longer exists at its verified push target.",
      {
        branch: state.workspace.branchName,
        expectedCommit: state.workspace.preparedCommit,
      },
      "Inspect why the remote branch was removed and create a new proposal or restore it explicitly; the CLI will not recreate a recorded pushed branch implicitly.",
    );
  }
  if (remoteHead !== state.workspace.preparedCommit) {
    throw proposalError(
      "proposal-branch-collision",
      "Remote proposal branch exists at a different commit and will not be overwritten.",
      {
        branch: state.workspace.branchName,
        expectedCommit: state.workspace.preparedCommit,
        remoteCommit: remoteHead,
      },
      "Inspect the remote branch and choose a new proposal plan; automatic force-push is intentionally unsupported.",
    );
  }
}

export async function submitProposal({ id, options = {}, env = process.env, dependencies = {} }) {
  const services = proposalServices({ env, dependencies });
  const paths = resolveProposalPaths(env, id);
  return withProposalLock(paths, async () => {
    let state = await readProposalState(paths);
    if (state.status === "submitted") {
      return publicProposalResult("noop", `Proposal ${id} is already submitted.`, state);
    }
    if (!options.confirmExternalEffects) throw submitConfirmation();
    if (!["prepared", "pushed"].includes(state.status)) {
      throw proposalError(
        "proposal-not-prepared",
        `Proposal ${id} cannot submit from status ${state.status}.`,
        { id, status: state.status },
        "Run proposal prepare successfully before submitting, or re-plan an aborted proposal.",
      );
    }
    await verifyPreparedWorkspace(state, paths, services.git);
    await services.github.assertAuthenticated();
    let submission = state.submission;
    let baseRepository;
    if (state.status === "prepared") {
      const resolved = await resolvePush({ state, options, github: services.github });
      baseRepository = resolved.baseRepository;
      let remoteHead = await services.git.remoteBranchHead(
        resolved.pushTarget,
        state.workspace.branchName,
      );
      if (remoteHead === null) {
        await services.git.push({
          root: paths.worktreePath,
          pushTarget: resolved.pushTarget,
          branch: state.workspace.branchName,
        });
        remoteHead = await services.git.remoteBranchHead(
          resolved.pushTarget,
          state.workspace.branchName,
        );
      }
      assertRemoteCommit(remoteHead, state);
      submission = {
        strategy: resolved.strategy,
        baseRepository,
        headOwner: resolved.headOwner,
        headRepository: resolved.headRepository,
        branch: state.workspace.branchName,
        pushTarget: resolved.pushTarget,
        pushedCommit: state.workspace.preparedCommit,
        pushedAt: new Date(services.now()).toISOString(),
        pr: null,
      };
      state = await writeProposalState(
        paths,
        evolveProposalState(state, {
          status: "pushed",
          patch: { submission },
          event: "pushed",
          now: services.now,
        }),
      );
    } else {
      baseRepository = submission?.baseRepository;
      if (!submission?.pushTarget || !baseRepository) {
        throw proposalError(
          "invalid-proposal-state",
          "Pushed proposal state is missing its verified submission target.",
          { id, submission },
          "Restore proposal state from a trusted backup before attempting PR creation.",
        );
      }
      assertRemoteCommit(
        await services.git.remoteBranchHead(submission.pushTarget, submission.branch),
        state,
      );
    }

    let pullRequest = await services.github.findPullRequest({
      baseRepository,
      headOwner: submission.headOwner,
      branch: submission.branch,
      commit: submission.pushedCommit,
    });
    if (!pullRequest) {
      pullRequest = await services.github.createPullRequest({
        baseRepository,
        baseRef: state.source.baseRef,
        headOwner: submission.headOwner,
        branch: submission.branch,
        title: state.spec.summary,
        bodyPath: paths.bodyPath,
        draft: Boolean(options.draft),
      });
    }
    if (pullRequest.headRefOid !== submission.pushedCommit) {
      throw proposalError(
        "pull-request-commit-mismatch",
        "Created or discovered pull request does not point to the prepared proposal commit.",
        { expectedCommit: submission.pushedCommit, pullRequest },
        "Inspect the remote branch and pull request; do not retry with a force-push.",
      );
    }
    const submitted = await writeProposalState(
      paths,
      evolveProposalState(state, {
        status: "submitted",
        patch: {
          submission: {
            ...submission,
            pr: pullRequest,
            submittedAt: new Date(services.now()).toISOString(),
          },
        },
        event: "submitted",
        now: services.now,
      }),
    );
    return publicProposalResult(
      "ok",
      `Proposal ${id} submitted as ${pullRequest.url}.`,
      submitted,
    );
  });
}

export async function statusProposal({ id, env = process.env, dependencies = {} }) {
  const services = proposalServices({ env, dependencies });
  const paths = resolveProposalPaths(env, id);
  await assertProposalTopology(paths);
  const state = await readProposalState(paths);
  let workspaceHealth = { present: false, clean: null, exact: null };
  if (state.workspace) {
    const metadata = await safeManagedMetadata(paths.worktreePath, paths.proposalDir, "worktree");
    if (metadata?.isDirectory()) {
      try {
        const head = await services.git.head(paths.worktreePath);
        const status = await services.git.status(paths.worktreePath);
        workspaceHealth = {
          present: true,
          clean: status === "",
          exact: state.workspace.preparedCommit ? head === state.workspace.preparedCommit : null,
          head,
          status,
        };
      } catch (error) {
        workspaceHealth = { present: true, clean: null, exact: false, error: error.message };
      }
    }
  }
  return publicProposalResult("ok", `Proposal ${id} status is ${state.status}.`, state, {
    workspaceHealth,
  });
}

export async function abortProposal({ id, options = {}, env = process.env, dependencies = {} }) {
  const services = proposalServices({ env, dependencies });
  const paths = resolveProposalPaths(env, id);
  return withProposalLock(paths, async () => {
    const state = await readProposalState(paths);
    if (state.status === "aborted") {
      return publicProposalResult("noop", `Proposal ${id} is already aborted.`, state);
    }
    if (["pushed", "submitted"].includes(state.status)) {
      throw proposalError(
        "proposal-has-external-effects",
        `Proposal ${id} already has external effects and cannot be locally aborted.`,
        { id, status: state.status, submission: state.submission },
        "Inspect and close the pull request or remove the remote branch explicitly; this CLI will not undo them implicitly.",
      );
    }
    const worktree = await safeManagedMetadata(paths.worktreePath, paths.proposalDir, "worktree");
    if (worktree?.isDirectory() && state.status === "prepared") {
      const [actualHead, worktreeStatus] = await Promise.all([
        services.git.head(paths.worktreePath),
        services.git.status(paths.worktreePath),
      ]);
      const drifted =
        actualHead !== state.workspace.preparedCommit || worktreeStatus !== "";
      if (drifted && !options.confirmDiscard) {
        throw proposalError(
          "proposal-abort-confirmation",
          "Proposal worktree contains commits or uncommitted changes that abort would delete.",
          {
            id,
            worktreePath: paths.worktreePath,
            expectedHead: state.workspace.preparedCommit,
            actualHead,
            status: worktreeStatus,
          },
          "Inspect the exact proposal worktree and preserve any wanted commits/changes, then retry with --confirm-discard only to delete them.",
          { status: "needs_confirmation" },
        );
      }
    }
    await cleanupWorkspace(paths, services.git, {
      force: state.status === "preparing" || Boolean(options.confirmDiscard),
    });
    const aborted = await writeProposalState(
      paths,
      evolveProposalState(state, {
        status: "aborted",
        event: "aborted",
        now: services.now,
      }),
    );
    return publicProposalResult(
      "ok",
      `Proposal ${id} aborted; its managed Git workspace was removed.`,
      aborted,
    );
  });
}
