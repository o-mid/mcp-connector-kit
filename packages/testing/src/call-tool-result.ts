export type McpTextContent = { type: "text"; text: string };

export type McpCallToolResult = {
  content: McpTextContent[];
};

/** Narrow MCP SDK callTool results in e2e tests (SDK types content as {}). */
export function asCallToolResult(result: unknown): McpCallToolResult {
  return result as McpCallToolResult;
}

export function parseFirstTextJson(result: McpCallToolResult): unknown {
  const block = result.content[0];
  if (!block) {
    throw new Error("expected text tool result");
  }
  return JSON.parse(block.text);
}
