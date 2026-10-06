import { MockAgent, setGlobalDispatcher } from "undici";

declare global {
  // eslint-disable-next-line no-var
  var __MCK_MOCK_AGENT__: MockAgent | undefined;
}

/**
 * Allows MCP Streamable HTTP to 127.0.0.1 while upstream APIs stay on MockAgent intercepts.
 */
export function prepareMcpHttpE2eNetwork(): void {
  const agent = new MockAgent();
  agent.disableNetConnect();
  agent.enableNetConnect((host) =>
    host === "127.0.0.1" ||
    host.startsWith("127.0.0.1:") ||
    host === "localhost" ||
    host.startsWith("localhost:"),
  );
  setGlobalDispatcher(agent);
  globalThis.__MCK_MOCK_AGENT__ = agent;
}
