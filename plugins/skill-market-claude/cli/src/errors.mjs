export class SkillMarketError extends Error {
  constructor({
    code,
    message,
    status = "error",
    retryable = false,
    nextAction = null,
    details = null,
    cause,
  }) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "SkillMarketError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.nextAction = nextAction;
    this.details = details;
  }
}

export function asSkillMarketError(error, fallback = {}) {
  if (error instanceof SkillMarketError) {
    return error;
  }
  return new SkillMarketError({
    code: fallback.code ?? "unexpected-error",
    message: fallback.message ?? error?.message ?? "Unexpected Skill Market error.",
    status: fallback.status ?? "error",
    retryable: fallback.retryable ?? false,
    nextAction: fallback.nextAction ?? null,
    details: fallback.details ?? null,
    cause: error,
  });
}
