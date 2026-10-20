import assert from "node:assert/strict";
import test from "node:test";

import { helpContract, runCli } from "../src/cli/index.mjs";

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
