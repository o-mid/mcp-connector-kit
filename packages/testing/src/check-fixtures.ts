import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ToolContract } from "./replay-contract.js";

export type FixtureCheckResult = {
  file: string;
  ok: boolean;
  error?: string;
};

/** Validates contract JSON files under each source fixtures directory. */
export async function checkFixtureContracts(repoRoot: string): Promise<FixtureCheckResult[]> {
  const sourcesDir = path.join(repoRoot, "sources");
  const results: FixtureCheckResult[] = [];
  let entries: string[] = [];
  try {
    entries = await readdir(sourcesDir);
  } catch {
    return results;
  }
  for (const sourceId of entries) {
    const fixturesDir = path.join(sourcesDir, sourceId, "fixtures");
    let files: string[] = [];
    try {
      files = await readdir(fixturesDir);
    } catch {
      continue;
    }
    for (const file of files.filter((f) => f.endsWith(".contract.json"))) {
      const full = path.join(fixturesDir, file);
      try {
        const raw = JSON.parse(await readFile(full, "utf8")) as unknown;
        const doc = ToolContract.parse(raw);
        if (doc.source !== sourceId) {
          results.push({
            file: full,
            ok: false,
            error: `source mismatch: expected ${sourceId}, got ${doc.source}`,
          });
          continue;
        }
        results.push({ file: full, ok: true });
      } catch (err) {
        results.push({
          file: full,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  return results;
}
