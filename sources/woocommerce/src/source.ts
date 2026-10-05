import { ConnectorError, defineSource, defineTool, type SourceDefinition } from "@mck/core";
import { z } from "zod";
import { ProductCard } from "./schemas.js";
import { WooList } from "./schemas.js";
import { DEFAULT_WOO_SHOPS, type WooShop } from "./shops.js";
import { productDetailWoo, searchOptsFromArgs, searchWooShop } from "./woo-api.js";

const searchInput = z.object({
  query: z.string().min(1),
  shop: z.string().optional(),
  min_price: z.number().int().optional(),
  max_price: z.number().int().optional(),
  in_stock: z.boolean().optional(),
  limit: z.number().int().min(1).max(10).default(5),
});

const searchOut = z.object({
  query: z.string(),
  shops: z.array(
    z.object({
      shop: z.string(),
      count: z.number(),
      products: z.array(ProductCard),
      error: z.string().optional(),
    }),
  ),
});

/** Builds a config-driven WooCommerce Store API source. */
export function createWooCommerceSource(shops: WooShop[] = DEFAULT_WOO_SHOPS): SourceDefinition {
  const shopIds = shops.map((s) => s.id);

  const listShops = defineTool({
    name: "list_shops",
    description: "WooCommerce shops configured for this connector.",
    input: z.object({}),
    upstream: z.object({ shops: z.array(z.any()) }),
    output: z.object({
      shops: z.array(
        z.object({ id: z.string(), name: z.string(), site: z.string(), note: z.string() }),
      ),
    }),
    async run() {
      return { shops: shops.map((s) => ({ id: s.id, name: s.name, site: s.site, note: s.note })) };
    },
  });

  function makeSearchTool(name: string, description: string) {
    return defineTool({
      name,
      description,
      input: searchInput,
      upstream: WooList,
      output: searchOut,
      cacheTtlMs: 180_000,
      legacyJsonPretty: name === "search_cosmetics",
      async run({ input, ctx, signal }) {
        const opts = searchOptsFromArgs(input);
        const limit = input.limit ?? 5;
        const ids = input.shop ? [input.shop] : shopIds;
        const rows = [];
        for (const id of ids) {
          const shop = shops.find((s) => s.id === id);
          if (!shop) {
            rows.push({ shop: id, count: 0, products: [], error: `Unknown shop: ${id}` });
            continue;
          }
          try {
            const products = await searchWooShop(ctx, shop, input.query, limit, opts, signal);
            rows.push({ shop: id, count: products.length, products });
          } catch (err) {
            rows.push({
              shop: id,
              count: 0,
              products: [],
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
        return { query: input.query, shops: rows };
      },
    });
  }

  const findBest = defineTool({
    name: "find_best_price",
    description: "Search all shops and return cheapest in-stock offers.",
    input: z.object({
      query: z.string().min(1),
      min_price: z.number().int().optional(),
      max_price: z.number().int().optional(),
      limit: z.number().int().min(1).max(10).default(5),
    }),
    upstream: WooList,
    output: z.object({
      query: z.string(),
      products: z.array(ProductCard),
      shop_errors: z.array(z.object({ shop: z.string(), error: z.string() })),
    }),
    cacheTtlMs: 180_000,
    legacyJsonPretty: true,
    async run({ input, ctx, signal }) {
      const opts = searchOptsFromArgs(input);
      const limit = input.limit ?? 5;
      const perShop = Math.min(10, Math.max(limit, 8));
      const rows = [];
      for (const shop of shops) {
        try {
          const products = await searchWooShop(ctx, shop, input.query, perShop, opts, signal);
          rows.push({ shop: shop.id, count: products.length, products });
        } catch (err) {
          rows.push({
            shop: shop.id,
            count: 0,
            products: [],
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      const ranked = rows
        .flatMap((s) => s.products)
        .filter((p) => p.in_stock && p.price_toman != null)
        .sort((a, b) => (a.price_toman ?? 0) - (b.price_toman ?? 0))
        .slice(0, limit);
      return {
        query: input.query,
        products: ranked,
        shop_errors: rows
          .filter((s) => s.error)
          .map((s) => ({ shop: s.shop, error: s.error as string })),
      };
    },
  });

  const details = defineTool({
    name: "product_details",
    description: "One WooCommerce product by numeric id.",
    input: z.object({
      shop: z.string(),
      id: z.string().min(1),
    }),
    upstream: z.record(z.unknown()),
    output: ProductCard.extend({
      sku: z.string().nullable().optional(),
      categories: z.array(z.string()).optional(),
    }),
    cacheTtlMs: 180_000,
    legacyJsonPretty: true,
    async run({ input, ctx, signal }) {
      const shop = shops.find((s) => s.id === input.shop);
      if (!shop) {
        throw new ConnectorError("invalid_input", `Unknown shop: ${input.shop}`, {
          source: "woocommerce",
        });
      }
      return productDetailWoo(ctx, shop, input.id, signal);
    },
  });

  return defineSource({
    id: "woocommerce",
    title: "WooCommerce stores",
    baseUrls: shops.map((s) => s.site),
    limits: { rps: 2, burst: 4, concurrency: 4, timeoutMs: 15_000 },
    cache: { defaultTtlMs: 180_000 },
    userAgent: "mck-woocommerce/1.0 (+read-only product search)",
    tools: [
      listShops,
      makeSearchTool("search_products", "Search products across configured Woo shops."),
      makeSearchTool("search_cosmetics", "Alias for search_products (cosmetic-mcp compat)."),
      findBest,
      details,
    ],
  });
}

export const wooCommerceSource = createWooCommerceSource();
