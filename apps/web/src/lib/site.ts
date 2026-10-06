export const SITE_ORIGIN = "https://mck-web-production.up.railway.app";
export const GATEWAY_ORIGIN = "https://mcp-connector-kit-production.up.railway.app";
export const MCP_URL = `${GATEWAY_ORIGIN}/mcp`;
export const DEMO_MCP_URL = `${GATEWAY_ORIGIN}/demo/mcp`;
export const GITHUB_REPO = "https://github.com/o-mid/mcp-connector-kit";
export const REGISTRY_METADATA = `${GITHUB_REPO}/blob/main/registry/server.json`;
export const ADDING_A_SOURCE = `${GITHUB_REPO}/blob/main/docs/adding-a-source.md`;
export const OPEN_METEO_ISSUE = `${GITHUB_REPO}/issues/1`;
export const OG_IMAGE = `${SITE_ORIGIN}/opengraph-image`;

export const INSTALL_COMMANDS = `git clone https://github.com/o-mid/mcp-connector-kit.git
cd mcp-connector-kit
pnpm install
pnpm build
MCK_SOURCES=fixture,wikipedia,open-meteo,frankfurter,openalex,openlibrary,hn,usgs,worldbank MCK_TRANSPORT=http PORT=8080 node apps/gateway/dist/cli.js`;

export type SourceCard = {
  name: string;
  tools: string;
  tier: "free" | "paid";
  note: string;
};

export const SOURCES: SourceCard[] = [
  { name: "Wikipedia", tools: "wiki_search · wiki_summary", tier: "free", note: "No upstream key" },
  { name: "Open-Meteo", tools: "weather_forecast", tier: "free", note: "No key · CC BY 4.0" },
  { name: "Frankfurter", tools: "fx_latest", tier: "free", note: "No key · daily rates" },
  { name: "OpenAlex", tools: "paper_search", tier: "free", note: "No key · works search" },
  { name: "Open Library", tools: "book_search", tier: "free", note: "No key · works search" },
  { name: "Hacker News", tools: "hn_search", tier: "free", note: "No key · Algolia" },
  { name: "USGS", tools: "recent_quakes", tier: "free", note: "No key · public domain" },
  { name: "World Bank", tools: "country_profile", tier: "free", note: "No key · ISO country" },
  { name: "Fixture", tools: "echo · health", tier: "free", note: "CI smoke" },
  { name: "GitHub", tools: "search_repositories · search_issues", tier: "paid", note: "GITHUB_TOKEN" },
  { name: "Brave", tools: "web_search", tier: "paid", note: "BRAVE_API_KEY" },
  { name: "Exa", tools: "exa_search", tier: "paid", note: "EXA_API_KEY" },
  { name: "Tavily", tools: "tavily_search", tier: "paid", note: "TAVILY_API_KEY" },
  { name: "Web reader", tools: "fetch_page", tier: "paid", note: "Host allowlist" },
];

export const COMPOSIO_ROWS: { situation: string; composio: string; mck: string }[] = [
  {
    situation: "You need Slack or Notion OAuth tomorrow",
    composio: "Composio",
    mck: "MCK does not broker those logins",
  },
  {
    situation: "You need your own API, or a connector you can fork",
    composio: "You work inside their catalog",
    mck: "MCK",
  },
  {
    situation: "You want the vendor to run everything",
    composio: "Composio",
    mck: "You operate the gateway",
  },
  {
    situation: "You need self-host, metrics, and fixtures in CI",
    composio: "Managed session",
    mck: "MCK",
  },
  {
    situation: "Per-seat SaaS is an acceptable bill",
    composio: "Composio",
    mck: "Self-host has no seat fee",
  },
  {
    situation: "You want Zod and HTTP policy in git",
    composio: "Opaque tool layer",
    mck: "MCK",
  },
];

export const SMITHERY_ROWS: { smithery: string; mck: string }[] = [
  { smithery: "Discover anything", mck: "Maintain something" },
  { smithery: "Hosted connect", mck: "Versioned contracts and a gateway you compose" },
  { smithery: "Community long tail", mck: "Curated trust tier" },
];
