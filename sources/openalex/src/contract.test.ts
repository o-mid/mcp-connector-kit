import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { openAlexSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

describeSourceContractReplay("openalex", openAlexSource, path.join(dir, "../fixtures"));
