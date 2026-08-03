import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function createStandaloneFixture(
  home,
  { adapter = "codex", version = "1.0.0", content = "fixture v1\n" } = {},
) {
  const name = "fixture-skill";
  const repoRoot = path.join(home, "catalog-repo");
  const packagePath = path.join(repoRoot, "skills", adapter, name);
  await mkdir(packagePath, { recursive: true });
  await writeFile(path.join(packagePath, "SKILL.md"), content, "utf8");
  const entry = {
    id: `${adapter}:standalone:${name}`,
    adapter,
    kind: "standalone",
    name,
    version,
    status: "active",
    path: `skills/${adapter}/${name}`,
    description: "Fixture standalone skill.",
  };
  const snapshot = {
    root: repoRoot,
    freshness: "fresh",
    source: {
      mode: "cache",
      repoIdentity: "example.test/skill-market",
      repoUrl: "https://example.test/skill-market.git",
      baseRef: "main",
      fetchedAt: "2026-08-03T00:00:00.000Z",
      head: "a".repeat(40),
    },
    catalog: { packages: [entry] },
    warnings: [],
  };
  return {
    entry,
    snapshot,
    packagePath,
    statePath: path.join(home, ".skill-market/managed-state.json"),
    marketHome: path.join(home, ".skill-market"),
  };
}
