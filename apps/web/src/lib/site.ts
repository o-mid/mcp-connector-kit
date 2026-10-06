import {
  CATALOG_SOURCES,
  FREE_TIER_SOURCE_IDS,
  SOURCE_PROFILES,
} from "@/generated/catalog";

export const SITE_ORIGIN = "https://mck-web-production.up.railway.app";
export const GATEWAY_ORIGIN = "https://mcp-connector-kit-production.up.railway.app";
export const MCP_URL = `${GATEWAY_ORIGIN}/mcp`;
export const DEMO_MCP_URL = `${GATEWAY_ORIGIN}/demo/mcp`;
export const GITHUB_REPO = "https://github.com/o-mid/mcp-connector-kit";
export const REGISTRY_METADATA = `${GITHUB_REPO}/blob/main/registry/server.json`;
export const ADDING_A_SOURCE = `${GITHUB_REPO}/blob/main/docs/adding-a-source.md`;
export const TRUST_TIER_DOC = `${GITHUB_REPO}/blob/main/docs/trust-tier.md`;
export const OG_IMAGE = `${SITE_ORIGIN}/opengraph-image`;

export const INSTALL_COMMANDS = `git clone https://github.com/o-mid/mcp-connector-kit.git
cd mcp-connector-kit
pnpm install
pnpm build
MCK_SOURCES=${FREE_TIER_SOURCE_IDS.join(",")} MCK_TRANSPORT=http PORT=8080 node apps/gateway/dist/cli.js`;

export const PROFILE_EXAMPLES = Object.entries(SOURCE_PROFILES)
  .filter(([name]) => name !== "default" && name !== "trust")
  .map(([name, ids]) => ({
    name,
    env: `MCK_SOURCE_PROFILE=${name}`,
    ids,
  }));

export type SourceCard = {
  id: string;
  name: string;
  tools: string;
  tier: "free" | "paid";
  note: string;
};

export const SOURCES: SourceCard[] = CATALOG_SOURCES.map((s) => ({
  id: s.id,
  name: s.title,
  tools: s.tools.map((t) => t.name).join(" · "),
  tier: s.tier,
  note: s.note,
}));

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
