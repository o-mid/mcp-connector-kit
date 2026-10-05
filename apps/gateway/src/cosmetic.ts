import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { card as khanoumiCard, khanoumiSource } from "@mck/source-khanoumi";
import { createWooCommerceSource, DEFAULT_WOO_SHOPS } from "@mck/source-woocommerce";
import { searchOptsFromArgs, searchWooShop } from "@mck/source-woocommerce";

const KHANOUMI = {
  id: "khanoumi",
  name: "خانومی",
  site: "https://www.khanoumi.com",
  note: "The whole Khanoumi catalog. Pass brand, for example sheglam, to narrow it.",
};

const woo = createWooCommerceSource(DEFAULT_WOO_SHOPS);
const shops = [...DEFAULT_WOO_SHOPS.map((s) => ({ ...s })), KHANOUMI];
const shopIds = shops.map((s) => s.id);

/**
 * cosmetic-mcp compatibility: four shops, search_cosmetics, find_best_price, product_details.
 */
export function createCosmeticCompositeSource() {
  const listShops = defineTool({
    name: "list_shops",
    description: "The four shops this server can read.",
    input: z.object({}),
    upstream: z.object({}),
    output: z.object({
      shops: z.array(z.object({ id: z.string(), name: z.string(), site: z.string(), note: z.string() })),
    }),
    async run() {
      return { shops };
    },
  });

  const searchInput = z.object({
    query: z.string().min(1),
    shop: z.enum(shopIds as [string, ...string[]]).optional(),
    brand: z.string().optional(),
    min_price: z.number().int().optional(),
    max_price: z.number().int().optional(),
    in_stock: z.boolean().optional(),
    limit: z.number().int().min(1).max(10).default(5),
  });

  async function searchAll(ctx: import("@mck/core").ToolContext, input: z.infer<typeof searchInput>, perShop: number) {
    const opts = searchOptsFromArgs(input);
    const ids = input.shop ? [input.shop] : shopIds;
    const rows = [];
    for (const id of ids) {
      try {
        if (id === "khanoumi") {
          const tool = khanoumiSource.tools.find((t) => t.name === "search_khanoumi");
          if (!tool) throw new Error("khanoumi search missing");
          const result = await tool.run({
            input: {
              query: input.query,
              brand: input.brand,
              in_stock: input.in_stock,
              min_price: input.min_price,
              max_price: input.max_price,
              limit: perShop,
              page: 1,
            },
            ctx: { ...ctx, sourceId: "khanoumi", http: ctx.http },
            signal: AbortSignal.timeout(60_000),
          });
          const products = (result as { products: unknown[] }).products.map((p) => {
            const c = p as ReturnType<typeof khanoumiCard>;
            return {
              shop: KHANOUMI.id,
              shop_name: KHANOUMI.name,
              id: c.id,
              title: c.title,
              title_en: c.title_en,
              brand: c.brand,
              price_toman: c.price_toman,
              regular_price_toman: c.regular_price_toman,
              on_sale: c.on_sale,
              in_stock: c.in_stock,
              url: c.url,
            };
          });
          rows.push({ shop: id, count: products.length, products });
        } else {
          const shop = DEFAULT_WOO_SHOPS.find((s) => s.id === id);
          if (!shop) throw new Error(`Unknown shop ${id}`);
          const products = await searchWooShop(ctx, shop, input.query, perShop, opts, AbortSignal.timeout(60_000));
          rows.push({ shop: id, count: products.length, products });
        }
      } catch (err) {
        rows.push({
          shop: id,
          count: 0,
          products: [],
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return rows;
  }

  const searchCosmetics = defineTool({
    name: "search_cosmetics",
    description: "Search across Aradokht, Mouliyan, Nazisho, and Khanoumi.",
    input: searchInput,
    upstream: z.array(z.unknown()),
    output: z.object({
      query: z.string(),
      shops: z.array(z.record(z.unknown())),
    }),
    cacheTtlMs: 180_000,
    legacyJsonPretty: true,
    async run({ input, ctx }) {
      const limit = input.limit ?? 5;
      const shopsResult = await searchAll(ctx, input, limit);
      return { query: input.query, shops: shopsResult };
    },
  });

  const findBestPrice = defineTool({
    name: "find_best_price",
    description: "Cheapest in-stock offers across cosmetic shops.",
    input: z.object({
      query: z.string().min(1),
      brand: z.string().optional(),
      min_price: z.number().int().optional(),
      max_price: z.number().int().optional(),
      limit: z.number().int().min(1).max(10).default(5),
    }),
    upstream: z.array(z.unknown()),
    output: z.record(z.unknown()),
    cacheTtlMs: 180_000,
    legacyJsonPretty: true,
    async run({ input, ctx }) {
      const limit = input.limit ?? 5;
      const perShop = Math.min(10, Math.max(limit, 8));
      const shopsResult = await searchAll(ctx, { ...input, limit: perShop }, perShop);
      const ranked = shopsResult
        .flatMap((s) => s.products as Array<{ in_stock: boolean; price_toman: number | null }>)
        .filter((p) => p.in_stock && p.price_toman != null)
        .sort((a, b) => (a.price_toman ?? 0) - (b.price_toman ?? 0))
        .slice(0, limit);
      return {
        query: input.query,
        products: ranked,
        shop_errors: shopsResult
          .filter((s) => s.error)
          .map((s) => ({ shop: s.shop, error: s.error as string })),
      };
    },
  });

  const productDetails = defineTool({
    name: "product_details",
    description: "One product from one shop.",
    input: z.object({
      shop: z.enum(shopIds as [string, ...string[]]),
      id: z.string().min(1),
    }),
    upstream: z.record(z.unknown()),
    output: z.record(z.unknown()),
    cacheTtlMs: 180_000,
    legacyJsonPretty: true,
    async run({ input, ctx, signal }) {
      if (input.shop === "khanoumi") {
        const tool = khanoumiSource.tools.find((t) => t.name === "product_details");
        if (!tool) throw new Error("missing khanoumi details");
        const item = await tool.run({ input: { id: input.id }, ctx, signal });
        const c = item as ReturnType<typeof khanoumiCard>;
        return {
          shop: KHANOUMI.id,
          shop_name: KHANOUMI.name,
          id: c.id,
          title: c.title,
          title_en: c.title_en,
          brand: c.brand,
          price_toman: c.price_toman,
          regular_price_toman: c.regular_price_toman,
          on_sale: c.on_sale,
          in_stock: c.in_stock,
          url: c.url,
        };
      }
      const details = woo.tools.find((t) => t.name === "product_details");
      if (!details) throw new Error("missing woo details");
      return details.run({ input: { shop: input.shop, id: input.id }, ctx, signal });
    },
  });

  return defineSource({
    id: "cosmetic",
    title: "Cosmetic multi-shop search",
    baseUrls: [
      ...DEFAULT_WOO_SHOPS.map((s) => s.site),
      "https://www.khanoumi.com",
    ],
    limits: { rps: 2, burst: 4, concurrency: 4, timeoutMs: 15_000 },
    cache: { defaultTtlMs: 180_000 },
    tools: [listShops, searchCosmetics, findBestPrice, productDetails],
  });
}
