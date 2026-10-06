import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGatewayRegistry, loadConfig } from "@mck/gateway";

type RecordOpts = {
  root: string;
  source: string;
  tool: string;
  inputJson: string;
  out?: string;
};

/** Calls a tool live (MCK_LIVE=1) and writes a contract skeleton with captured output. */
export async function recordContract(opts: RecordOpts): Promise<string> {
  if (process.env.MCK_LIVE !== "1") {
    throw new Error("Set MCK_LIVE=1 to record live upstream responses.");
  }

  const input = JSON.parse(opts.inputJson) as Record<string, unknown>;
  const registry = createGatewayRegistry(
    loadConfig({
      MCK_SOURCES: opts.source,
      MCK_SKU: "paid",
      LOG_LEVEL: "warn",
    }),
  );

  const toolName = `${opts.source}.${opts.tool}`;
  const result = await registry.callTool(toolName, input);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const doc = {
    source: opts.source,
    tool: opts.tool,
    input,
    output: result.data,
    _note: "Add mock.origin, mock.pathPrefix, and mock.body from a captured HTTP response for offline replay.",
  };

  const outPath =
    opts.out ??
    path.join(opts.root, "sources", opts.source, "fixtures", `${opts.tool}.contract.json`);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  return outPath;
}
