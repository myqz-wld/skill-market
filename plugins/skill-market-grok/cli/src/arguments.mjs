import { SkillMarketError } from "./errors.mjs";

export function parseOptions(tokens, definitions) {
  const options = {};
  const positionals = [];
  let positionalOnly = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") {
      positionalOnly = true;
      continue;
    }
    if (positionalOnly || !token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const separator = token.indexOf("=");
    const name = token.slice(2, separator < 0 ? undefined : separator);
    const definition = definitions[name];
    if (!definition) {
      throw argumentError(`unknown option --${name}`, { option: name });
    }
    if (definition.type === "boolean") {
      if (separator >= 0) {
        throw argumentError(`--${name} does not accept a value`, { option: name });
      }
      options[definition.key] = true;
      continue;
    }
    const value = separator >= 0 ? token.slice(separator + 1) : tokens[++index];
    if (value === undefined || value === "") {
      throw argumentError(`--${name} requires a value`, { option: name });
    }
    if (definition.type === "list") {
      const values = value.split(",").map((item) => item.trim()).filter(Boolean);
      if (values.length === 0) {
        throw argumentError(`--${name} requires at least one value`, { option: name });
      }
      options[definition.key] = [...(options[definition.key] ?? []), ...values];
    } else {
      options[definition.key] = value;
    }
  }
  return { options, positionals };
}

export function requirePositionals(positionals, { min, max = min, usage }) {
  if (positionals.length < min || positionals.length > max) {
    throw argumentError(`expected ${min === max ? min : `${min}-${max}`} positional values`, {
      received: positionals,
      usage,
    });
  }
  return positionals;
}

function argumentError(issue, details) {
  return new SkillMarketError({
    code: "invalid-arguments",
    message: `Invalid CLI arguments: ${issue}.`,
    details,
    nextAction: "Run skill-market help and retry with the documented command shape.",
  });
}
