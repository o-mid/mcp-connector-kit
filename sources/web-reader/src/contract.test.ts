import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { createWebReaderSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const source = createWebReaderSource(["https://example.com"]);

describeSourceContractReplay("web-reader", source, path.join(dir, "../fixtures"));
