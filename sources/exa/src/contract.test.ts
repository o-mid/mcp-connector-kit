import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll } from "vitest";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { exaSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

beforeAll(() => {
  process.env.EXA_API_KEY = process.env.EXA_API_KEY ?? "contract-test-key";
});

describeSourceContractReplay("exa", exaSource, path.join(dir, "../fixtures"));
