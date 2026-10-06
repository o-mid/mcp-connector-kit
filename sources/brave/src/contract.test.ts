import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll } from "vitest";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { braveSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

beforeAll(() => {
  process.env.BRAVE_API_KEY = process.env.BRAVE_API_KEY ?? "contract-test-key";
});

describeSourceContractReplay("brave", braveSource, path.join(dir, "../fixtures"));
