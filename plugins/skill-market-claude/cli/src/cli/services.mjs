import { loadEffectiveConfig, updateConfig } from "../shared/config.mjs";
import { loadCatalogSnapshot, loadOptionalCatalogSnapshot } from "../catalog/cache.mjs";
import { collectLocalInventory } from "../packages/inventory.mjs";
import { executeLifecycle } from "../packages/lifecycle.mjs";
import { abortProposal, planProposal, prepareProposal, statusProposal, submitProposal } from "../proposals/index.mjs";

export function servicesWithDefaults(dependencies) {
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
