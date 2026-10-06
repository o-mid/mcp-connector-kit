import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { frankfurterSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

describeSourceContractReplay("frankfurter", frankfurterSource, path.join(dir, "../fixtures"));
