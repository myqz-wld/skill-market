import assert from "node:assert/strict";
import test from "node:test";

import { helpContract, runCli } from "../src/cli/index.mjs";
import { parseOptions } from "../src/cli/arguments.mjs";
import { optionsFor } from "../src/cli/registry.mjs";

test("undeclared prototype names are rejected as options", () => {
  for (const name of ["toString", "constructor", "__proto__"]) {
    assert.throws(
      () => parseOptions([`--${name}`, "value"], optionsFor("discover")),
      { code: "invalid-arguments", details: { option: name } },
    );
  }
});

test("missing option values fail before lifecycle or proposal services run", async () => {
  let calls = 0;
  const unexpected = async () => { calls += 1; throw new Error("must not dispatch"); };
  for (const argv of [
    ["install", "codex:standalone:fixture-skill", "--repo-path", "--force"],
    ["proposal", "plan", "--spec", "--pretty"],
    ["discover", "--adapter", "--kind", "standalone"],
    ["discover", "--status", "--"],
  ]) {
    const result = await runCli(argv, {
      executeLifecycle: unexpected,
      planProposal: unexpected,
      loadEffectiveConfig: unexpected,
      loadCatalogSnapshot: unexpected,
    });
    assert.equal(result.error?.code, "invalid-arguments", argv.join(" "));
  }
  assert.equal(calls, 0);
});

test("the terminator preserves every remaining token and equals allows option-like values", () => {
  assert.deepEqual(
    parseOptions(["--pretty", "--", "--", "--pretty", "--adapter=all"], optionsFor("discover")),
    { options: { pretty: true }, positionals: ["--", "--pretty", "--adapter=all"] },
  );
  assert.deepEqual(
    parseOptions(["--repo-path=--fixture", "--limit", "-1"], optionsFor("discover")),
    { options: { repoPath: "--fixture", limit: "-1" }, positionals: [] },
  );
});

test("help advertises exactly the options accepted by each command parser", async () => {
  const help = helpContract();
  const metadata = {
    ...help.globalOptions,
    ...help.sourceOptions,
    ...help.lifecycle.options,
    ...help.commands.list.options,
    ...help.commands.discover.options,
  };
  const scopes = [];
  for (const [command, contract] of Object.entries(help.commands)) {
    if (command === "proposal") {
      for (const [action, details] of Object.entries(contract.actions)) {
        const options = Array.isArray(details.options)
          ? details.options
          : Object.keys(details.options ?? {});
        if (!Array.isArray(details.options)) Object.assign(metadata, details.options);
        for (const option of options) metadata[option] ??= { type: "value" };
        scopes.push({ argv: [command, action], options });
      }
    } else {
      const options = Array.isArray(contract.options)
        ? contract.options
        : Object.keys(contract.options ?? {});
      if (command === "list" || command === "discover") {
        options.push(...Object.keys(help.sourceOptions));
      }
      scopes.push({ argv: [command], options });
    }
  }
  for (const scope of scopes) {
    const allowed = new Set([...Object.keys(help.globalOptions), ...scope.options]);
    for (const [option, details] of Object.entries(metadata)) {
      const value = details.type === "boolean" ? [] : ["fixture"];
      const result = await runCli([...scope.argv, option, ...value, "--help"]);
      const label = `${scope.argv.join(" ")} ${option}`;
      if (allowed.has(option)) {
        assert.equal(result.ok, true, label);
        assert.equal(result.command, "help", label);
      } else {
        assert.equal(result.error?.code, "invalid-arguments", label);
      }
    }
  }
});
