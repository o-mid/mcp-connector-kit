import { beforeAll } from "vitest";
import { MockAgent, setGlobalDispatcher } from "undici";

/**
 * Blocks real HTTP in unit tests unless MCK_LIVE=1 (live-contract runs).
 */
beforeAll(() => {
  if (process.env.MCK_LIVE === "1") return;
  const agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
  globalThis.__MCK_MOCK_AGENT__ = agent;
});
