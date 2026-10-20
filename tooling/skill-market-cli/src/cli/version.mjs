import { readFileSync } from "node:fs";

// Canonical and bundled CLIs both resolve their own package metadata.
const metadata = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
export const CLI_VERSION = metadata.version;
