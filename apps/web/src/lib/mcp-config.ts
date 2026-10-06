export type McpServerConfig = {
  url: string;
  headers?: { Authorization: string };
};

export function mcpServerConfig(url: string, apiKey: string): McpServerConfig {
  const key = apiKey.trim();
  if (!key) return { url };
  return { url, headers: { Authorization: `Bearer ${key}` } };
}

/** Cursor install deeplink. `config` is the transport object, base64-encoded. */
export function cursorInstallHref(name: string, config: McpServerConfig): string {
  const b64 = btoa(JSON.stringify(config));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(b64)}`;
}

export function cursorMcpJson(name: string, config: McpServerConfig): string {
  return JSON.stringify({ mcpServers: { [name]: config } }, null, 2);
}

export function claudeDesktopJson(name: string, config: McpServerConfig): string {
  return JSON.stringify({ mcpServers: { [name]: config } }, null, 2);
}

export function langchainPython(name: string, config: McpServerConfig): string {
  const headers = config.headers
    ? `,
            "headers": {"Authorization": ${JSON.stringify(config.headers.Authorization)}}`
    : "";
  return `from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    ${JSON.stringify(name)}: {
        "transport": "streamable_http",
        "url": ${JSON.stringify(config.url)}${headers},
    }
})
tools = await client.get_tools()`;
}
