import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  makeTempDirectory,
  removeTempDirectory,
  withTemporaryHome,
  writeFakeBinary,
} from "./helpers/temp-env.mjs";

const execFileAsync = promisify(execFile);

test("fake native binaries execute only against an isolated HOME", async () => {
  await withTemporaryHome(async (temporaryHome) => {
    const binaryDirectory = await makeTempDirectory("skill-market-bin-");
    try {
      const fakeCodex = await writeFakeBinary(
        binaryDirectory,
        "codex",
        'process.stdout.write(JSON.stringify({ home: process.env.HOME, argv: process.argv.slice(2) }));',
      );
      const { stdout } = await execFileAsync(fakeCodex, ["plugin", "list"], {
        env: {
          ...process.env,
          HOME: temporaryHome,
          PATH: [binaryDirectory, path.dirname(process.execPath)].join(path.delimiter),
        },
      });
      assert.deepEqual(JSON.parse(stdout), {
        home: temporaryHome,
        argv: ["plugin", "list"],
      });
      assert.equal(path.dirname(fakeCodex), binaryDirectory);
    } finally {
      await removeTempDirectory(binaryDirectory);
    }
  });
});
