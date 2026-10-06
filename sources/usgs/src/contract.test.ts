import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { usgsSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
describeSourceContractReplay("usgs", usgsSource, path.join(dir, "../fixtures"));
