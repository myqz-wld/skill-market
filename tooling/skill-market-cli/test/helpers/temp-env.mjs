import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export async function makeTempDirectory(prefix = "skill-market-test-") {
  return mkdtemp(path.join(tmpdir(), prefix));
}

export async function removeTempDirectory(directory) {
  await rm(directory, { recursive: true, force: true });
}

export async function writeFakeBinary(directory, name, source) {
  await mkdir(directory, { recursive: true });
  const filePath = path.join(directory, name);
  await writeFile(filePath, `#!/usr/bin/env node\n${source}\n`, "utf8");
  await chmod(filePath, 0o755);
  return filePath;
}

export async function withTemporaryHome(callback) {
  const directory = await makeTempDirectory("skill-market-home-");
  const previousHome = process.env.HOME;
  process.env.HOME = directory;
  try {
    return await callback(directory);
  } finally {
    if (previousHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = previousHome;
    }
    await removeTempDirectory(directory);
  }
}
