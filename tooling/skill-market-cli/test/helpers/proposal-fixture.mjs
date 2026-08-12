import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { writeCatalogViews } from "../../src/generators.mjs";
import { fixtureCatalog } from "../fixtures/catalog.mjs";
import { makeTempDirectory } from "./temp-env.mjs";

const execFileAsync = promisify(execFile);

export async function fixtureGit(args, { cwd, env = process.env } = {}) {
  const result = await execFileAsync("git", args, {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  return result.stdout.trim();
}

export async function writeFixtureRepository(root, catalog = structuredClone(fixtureCatalog)) {
  await mkdir(path.join(root, "catalog"), { recursive: true });
  await writeFile(
    path.join(root, "catalog", "entries.json"),
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf8",
  );
  await writeCatalogViews({ root, catalog });
  for (const entry of catalog.packages) {
    if (entry.status === "removed") continue;
    const packageRoot = path.join(root, entry.path);
    await mkdir(packageRoot, { recursive: true });
    if (entry.kind === "standalone") {
      await writeFile(
        path.join(packageRoot, "SKILL.md"),
        `---\nname: ${entry.name}\ndescription: ${entry.description}\n---\n\n# ${entry.name}\n`,
        "utf8",
      );
    } else {
      const manifestPath = path.join(packageRoot, entry.manifestPath);
      await mkdir(path.dirname(manifestPath), { recursive: true });
      await writeFile(
        manifestPath,
        `${JSON.stringify({ name: entry.name, version: entry.version, description: entry.description }, null, 2)}\n`,
        "utf8",
      );
    }
  }
}

export async function createProposalRepository({ catalog = structuredClone(fixtureCatalog) } = {}) {
  const container = await makeTempDirectory("skill-market-proposal-repo-");
  const root = path.join(container, "source");
  await mkdir(root);
  await fixtureGit(["init", "--initial-branch=main"], { cwd: root });
  await writeFixtureRepository(root, catalog);
  await fixtureGit(["add", "--all"], { cwd: root });
  await fixtureGit(
    [
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.test",
      "commit",
      "--no-gpg-sign",
      "-m",
      "fixture base",
    ],
    { cwd: root },
  );
  const head = await fixtureGit(["rev-parse", "HEAD"], { cwd: root });
  return { container, root, head, catalog };
}

export async function createBareRemote(container, name = "remote.git") {
  const remote = path.join(container, name);
  await fixtureGit(["init", "--bare", "--initial-branch=main", remote]);
  return remote;
}
