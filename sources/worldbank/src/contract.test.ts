import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { worldBankSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
describeSourceContractReplay("worldbank", worldBankSource, path.join(dir, "../fixtures"));
