import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";
import { createWooCommerceSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

const demoWoo = createWooCommerceSource([
  {
    id: "demo",
    name: "Demo Shop",
    site: "https://shop.test",
    note: "Contract replay shop",
  },
]);

describeSourceContractReplay("woocommerce", demoWoo, path.join(dir, "../fixtures"));
