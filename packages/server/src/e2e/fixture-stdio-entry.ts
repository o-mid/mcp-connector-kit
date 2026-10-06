import { createDefaultCache, createSourceRegistry } from "@mck/core";
import { fixtureSource } from "@mck/source-fixture";
import { connectStdio, createMcpServer } from "../mcp-server.js";

const registry = createSourceRegistry([fixtureSource], {
  cache: createDefaultCache(),
  legacyToolNames: true,
});
const server = createMcpServer(registry, { name: "mck-fixture-stdio", version: "1.0.0" });
await connectStdio(server);
