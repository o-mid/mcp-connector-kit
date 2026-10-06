import { MockAgent } from "undici";

export type HttpMockSpec = {
  origin: string;
  pathPrefix: string;
  method?: string;
  statusCode?: number;
  body: unknown;
};

declare global {
  // eslint-disable-next-line no-var
  var __MCK_MOCK_AGENT__: MockAgent | undefined;
}

function getTestMockAgent(): MockAgent {
  const agent = globalThis.__MCK_MOCK_AGENT__;
  if (!agent) {
    throw new Error("MockAgent not initialized (load scripts/vitest-network-guard in vitest setup)");
  }
  return agent;
}

/**
 * Registers a JSON response on the shared undici MockAgent for offline contract replay.
 */
export function mockHttpJson(spec: HttpMockSpec): void {
  const agent = getTestMockAgent();
  const pool = agent.get(spec.origin);
  const prefix = spec.pathPrefix;
  pool
    .intercept({
      path: (p) => p.startsWith(prefix),
      method: spec.method ?? "GET",
    })
    .reply(spec.statusCode ?? 200, spec.body as object, {
      headers: { "content-type": "application/json; charset=utf-8" },
    })
    .persist();
}