import { readdirSync } from "node:fs";
import path from "node:path";
import { loadFixture } from "./fixtures.js";
import { replayToolContract, ToolContract } from "./replay-contract.js";
import { beforeEach, describe, expect, it } from "vitest";
import { MockAgent, setGlobalDispatcher } from "undici";
import type { SourceDefinition } from "@mck/core";

declare global {
  // eslint-disable-next-line no-var
  var __MCK_MOCK_AGENT__: MockAgent | undefined;
}

function listContractFiles(fixturesDir: string): string[] {
  try {
    return readdirSync(fixturesDir).filter((f) => f.endsWith(".contract.json"));
  } catch {
    return [];
  }
}

/**
 * Discovers *.contract.json files next to a source package and replays each offline.
 */
export function describeSourceContractReplay(
  label: string,
  source: SourceDefinition,
  fixturesDir: string,
): void {
  const files = listContractFiles(fixturesDir);
  describe(`${label} contract replay`, () => {
    beforeEach(() => {
      const agent = new MockAgent();
      agent.disableNetConnect();
      setGlobalDispatcher(agent);
      globalThis.__MCK_MOCK_AGENT__ = agent;
    });

    it("has fixture contracts", () => {
      expect(files.length).toBeGreaterThan(0);
    });

    for (const file of files) {
      it(`replays ${file}`, async () => {
        const raw = await loadFixture<unknown>(path.join(fixturesDir, file));
        const doc = ToolContract.parse(raw);
        const result = await replayToolContract(source, doc);
        expect(result.ok).toBe(true);
        if (result.ok && doc.output !== undefined) {
          expect(result.data).toEqual(doc.output);
        }
      });
    }
  });
}
