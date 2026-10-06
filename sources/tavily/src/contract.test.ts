import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll } from "vitest";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { tavilySource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

beforeAll(() => {
  process.env.TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? "contract-test-key";
});

describeSourceContractReplay("tavily", tavilySource, path.join(dir, "../fixtures"));
