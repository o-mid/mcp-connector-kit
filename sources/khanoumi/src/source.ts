import { ConnectorError, defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import {
  brandProfile,
  card,
  productDetails,
  searchBrands,
  searchFilters,
  searchProducts,
} from "./api.js";

const sorts = ["relevance", "popular", "cheapest", "expensive", "newest"] as const;

const searchKhanoumi = defineTool({
  name: "search_khanoumi",
  description:
    "Search the Khanoumi catalog. Prices are in Toman. Filter with brand slug, category key from search_filters, price, stock, and sort.",
  input: z.object({
    query: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    min_price: z.number().int().optional(),
    max_price: z.number().int().optional(),
    in_stock: z.boolean().optional(),
    sort: z.enum(sorts).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  upstream: z.record(z.unknown()),
  output: z.object({
    total_count: z.number().nullable(),
    page: z.number(),
    products: z.array(z.any()),
  }),
  cacheTtlMs: 180_000,
  legacyJsonPretty: true,
  async run({ input, ctx, signal }) {
    const query = String(input.query ?? "").trim();
    const brand = String(input.brand ?? "").trim();
    const category = String(input.category ?? "").trim();
    if (!query && !brand && !category) {
      throw new ConnectorError("invalid_input", "query, brand, or category is required", {
        source: "khanoumi",
      });
    }
    return searchProducts(
      ctx,
      {
        query,
        brand,
        category,
        inStock: input.in_stock === true,
        minPrice: input.min_price ?? null,
        maxPrice: input.max_price ?? null,
        sort: input.sort,
        page: input.page ?? 1,
        limit: input.limit ?? 5,
      },
      signal,
    );
  },
});

const searchFiltersTool = defineTool({
  name: "search_filters",
  description: "Categories, brands, and the Toman price span for a query.",
  input: z.object({ query: z.string().min(1) }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  legacyJsonPretty: true,
  async run({ input, ctx, signal }) {
    return searchFilters(ctx, input.query, signal);
  },
});

const searchBrandsTool = defineTool({
  name: "search_brands",
  description: "Best-selling brands, or brands matching a name.",
  input: z.object({
    query: z.string().optional(),
    limit: z.number().int().min(1).max(10).default(8),
  }),
  upstream: z.record(z.unknown()),
  output: z.object({ brands: z.array(z.record(z.unknown())) }),
  cacheTtlMs: 180_000,
  legacyJsonPretty: true,
  async run({ input, ctx, signal }) {
    const brands = await searchBrands(ctx, String(input.query ?? "").trim(), input.limit ?? 8, signal);
    return { brands };
  },
});

const brandProfileTool = defineTool({
  name: "brand_profile",
  description: "One brand: short description and a few products.",
  input: z.object({
    slug: z.string().min(1),
    limit: z.number().int().min(1).max(8).default(4),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  legacyJsonPretty: true,
  async run({ input, ctx, signal }) {
    return brandProfile(ctx, input.slug, input.limit ?? 4, signal);
  },
});

const productDetailsTool = defineTool({
  name: "product_details",
  description: "One product: price, stock, rating, description, and each color with its own price.",
  input: z.object({ id: z.string().min(1) }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  legacyJsonPretty: true,
  async run({ input, ctx, signal }) {
    return productDetails(ctx, input.id, signal);
  },
});

export const khanoumiSource = defineSource({
  id: "khanoumi",
  title: "Khanoumi catalog",
  baseUrls: ["https://www.khanoumi.com"],
  limits: { rps: 2, burst: 4, concurrency: 4, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 180_000 },
  userAgent: "mck-khanoumi/1.0 (+read-only catalog)",
  tools: [
    searchKhanoumi,
    searchFiltersTool,
    searchBrandsTool,
    brandProfileTool,
    productDetailsTool,
  ],
});

export { card };
