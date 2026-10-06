import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { openMeteoSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

describeSourceContractReplay("open-meteo", openMeteoSource, path.join(dir, "../fixtures"));
