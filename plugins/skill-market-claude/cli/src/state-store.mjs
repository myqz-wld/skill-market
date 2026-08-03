import { SkillMarketError } from "./errors.mjs";
import { atomicWriteJson, readJsonIfExists } from "./fs-utils.mjs";
import { validateManagedState } from "./managed-state.mjs";

export function emptyManagedState() {
  return { schemaVersion: 2, packages: {} };
}

export async function loadManagedState(statePath) {
  return (await loadManagedStateSnapshot(statePath)).state;
}

export async function loadManagedStateSnapshot(statePath) {
  let value;
  try {
    value = await readJsonIfExists(statePath);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SkillMarketError({
        code: "invalid-managed-state",
        message: "Managed state is not valid JSON.",
        status: "blocked",
        details: { statePath },
        nextAction: "Restore a valid v2 managed-state file from backup before retrying.",
        cause: error,
      });
    }
    throw error;
  }
  return {
    exists: value !== null,
    state: value === null ? emptyManagedState() : validateManagedState(value, statePath),
  };
}

export async function writeManagedState(statePath, state) {
  validateManagedState(state, statePath);
  await atomicWriteJson(statePath, state);
}
