import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import {
  assertId,
  card,
  clamp,
  htmlToText,
  keySpecs,
  productDetails,
  productUrl,
  searchProducts,
  sellerRow,
  torobGet,
} from "./api.js";
import { shopCountFromText } from "@mck/core";

const sortEnum = z.enum(["popular", "cheapest", "expensive", "newest", "most_sellers"]);

const torobSuggest = defineTool({
  name: "torob_suggest",
  description: "Autocomplete a vague Persian or English query into real Torob search phrases.",
  input: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(20).default(10),
  }),
  upstream: z.array(z.record(z.unknown())),
  output: z.object({ keywords: z.array(z.string()) }),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const limit = clamp(input.limit, 10, 1, 20);
    const rows = await torobGet(ctx, "/suggestion2/", { q: input.query }, signal);
    const list = Array.isArray(rows) ? rows : [];
    return {
      keywords: list
        .filter((r) => r && (r as { text?: string }).text && (r as { is_history?: boolean }).is_history !== true)
        .slice(0, limit)
        .map((r) => (r as { text: string }).text),
    };
  },
});

const searchTorob = defineTool({
  name: "search_torob",
  description: "Search Torob base products. Prices are in Toman.",
  input: z.object({
    query: z.string().optional(),
    category_id: z.number().optional(),
    brand_id: z.number().optional(),
    sort: sortEnum.optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(24).default(10),
    min_price_toman: z.number().optional(),
    max_price_toman: z.number().optional(),
    only_marketable: z.boolean().default(true),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    return searchProducts(ctx, input, signal);
  },
});

const browseCategory = defineTool({
  name: "browse_category",
  description: "Browse one Torob category by id.",
  input: z.object({
    category_id: z.number(),
    brand_id: z.number().optional(),
    sort: sortEnum.optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(24).default(10),
    min_price_toman: z.number().optional(),
    max_price_toman: z.number().optional(),
    only_marketable: z.boolean().default(true),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    return searchProducts(ctx, { ...input, query: undefined }, signal);
  },
});

const searchFilters = defineTool({
  name: "search_filters",
  description: "Categories and price span for a query.",
  input: z.object({ query: z.string().min(1) }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const data = await searchProducts(ctx, { query: input.query, limit: 1, only_marketable: false }, signal);
    return {
      query: input.query,
      categories: data.categories,
      parent_categories: data.parent_categories,
      price_min_toman: data.price_min_toman,
      price_max_toman: data.price_max_toman,
      total_items_estimate: data.total_items_estimate,
      sorts: ["popular", "cheapest", "expensive", "newest", "most_sellers"],
    };
  },
});

function flattenSpecs(detail: Record<string, unknown>, keyword?: string) {
  const groups = keySpecs(detail);
  if (!keyword) return groups;
  const q = keyword.toLowerCase();
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => `${it.name} ${it.value}`.toLowerCase().includes(q)),
    }))
    .filter((g) => g.items.length);
}

const productGuide = defineTool({
  name: "product_guide",
  description: "Torob product guide text.",
  input: z.object({ id: z.string().min(1) }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const d = await productDetails(ctx, input.id, signal);
    let text = "";
    try {
      const wiki = await torobGet(ctx, "/v4/base-product/wiki/", { prk: input.id }, signal);
      text = htmlToText((wiki as { data_html?: string }).data_html).slice(0, 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/404|ویکی/.test(msg)) throw err;
    }
    return {
      id: d.random_key,
      title: d.name1 ?? null,
      url: productUrl(d.web_client_absolute_url as string),
      has_guide: text.length > 0,
      text: text || null,
      note: text
        ? "This is Torob's product write-up, not a list of buyer reviews."
        : "Torob has no write-up for this product. Use product_sellers buyer_notes for shop trust.",
    };
  },
});

const productDetailsTool = defineTool({
  name: "product_details",
  description: "One Torob base product.",
  input: z.object({
    id: z.string().min(1),
    spec_keyword: z.string().optional(),
    include_specs: z.boolean().optional(),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const d = await productDetails(ctx, input.id, signal);
    const specs = input.include_specs === false ? [] : flattenSpecs(d, input.spec_keyword);
    const specCount = specs.reduce((n, g) => n + g.items.length, 0);
    const breadcrumbs = (d.breadcrumbs as Array<Record<string, unknown>>) ?? [];
    const brand = breadcrumbs.find((b) => b.brand_id);
    return {
      id: d.random_key,
      title: d.name1 ?? null,
      title_en: d.name2 || null,
      price_toman: (d.price as number) > 0 ? d.price : null,
      min_price_toman: (d.min_price as number) > 0 ? d.min_price : null,
      max_price_toman: (d.max_price as number) > 0 ? d.max_price : null,
      price_label: d.price_text || null,
      in_stock: d.availability !== false && d.price_text_mode !== "disabled" && (d.price as number) > 0,
      shop_count:
        (d.products_info as { count?: number })?.count ?? shopCountFromText(d.shop_text as string),
      shop_text: d.shop_text || null,
      category_id: d.torob_category ?? null,
      category: breadcrumbs.filter((b) => b.cat_id).map((b) => ({ id: b.cat_id, title: b.title })),
      brand: brand ? { id: brand.brand_id, title: brand.title } : null,
      url: productUrl(d.web_client_absolute_url as string),
      image_url: d.image_url || null,
      specs: specCount > 40 ? specs.map((g) => ({ ...g, items: g.items.slice(0, 40) })) : specs,
      specs_capped: specCount > 40,
    };
  },
});

function priceStats(prices: number[]) {
  if (!prices.length) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  return { min_toman: sorted[0], median_toman: median, max_toman: sorted[sorted.length - 1], sample_size: sorted.length };
}

const productSellers = defineTool({
  name: "product_sellers",
  description: "Shops listing this product.",
  input: z.object({
    id: z.string().min(1),
    limit: z.number().int().min(1).max(30).default(10),
    include_unreliable: z.boolean().default(false),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const d = await productDetails(ctx, input.id, signal);
    const limit = clamp(input.limit, 10, 1, 30);
    let rows = ((d.products_info as { result?: unknown[] })?.result ?? []).map((s) =>
      sellerRow(s as Record<string, unknown>),
    );
    if (input.include_unreliable !== true) {
      rows = rows.filter((r) => !r.price_unreliable && r.price_toman != null);
    }
    rows.sort((a, b) => (a.price_toman ?? Infinity) - (b.price_toman ?? Infinity));
    const priced = rows.filter((r) => r.price_toman != null).map((r) => r.price_toman!);
    return {
      id: d.random_key,
      title: d.name1 ?? null,
      url: productUrl(d.web_client_absolute_url as string),
      seller_count: (d.products_info as { count?: number })?.count ?? rows.length,
      cheapest_reliable_toman: priced[0] ?? null,
      price_stats: priceStats(priced),
      sellers: rows.slice(0, limit),
      note: "Buy links stay on the Torob product page.",
    };
  },
});

const productStores = defineTool({
  name: "product_stores",
  description: "Physical shops that stock this product.",
  input: z.object({
    id: z.string().min(1),
    limit: z.number().int().min(1).max(30).default(10),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const d = await productDetails(ctx, input.id, signal);
    const limit = clamp(input.limit, 10, 1, 30);
    const rows = ((d.products_in_store_info as { result?: Array<Record<string, unknown>> })?.result ?? []).map(
      (s) => ({
        shop_id: s.shop_id ?? null,
        shop: s.shop_name ?? null,
        city: s.shop_name2 || null,
        address: s.address || null,
        price_toman: typeof s.price === "number" && s.price > 0 ? s.price : null,
        price_unreliable: s.is_price_unreliable === true,
        is_open: s.is_open ?? null,
        hours: s.working_hours || null,
        distance: s.distance || null,
        last_price_change: s.last_price_change_date || null,
      }),
    );
    return {
      id: d.random_key,
      title: d.name1 ?? null,
      url: productUrl(d.web_client_absolute_url as string),
      store_count: (d.products_in_store_info as { count?: number })?.count ?? rows.length,
      stores: rows.slice(0, limit),
    };
  },
});

const shopProfile = defineTool({
  name: "shop_profile",
  description: "Public profile of one Torob shop.",
  input: z.object({ shop_id: z.number().int().positive() }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const s = await torobGet(ctx, "/v4/internet-shop/details/", { id: input.shop_id }, signal);
    const shop = s as Record<string, unknown>;
    const support = (shop.customer_support_info as Record<string, unknown>) ?? {};
    return {
      shop_id: shop.id,
      name: shop.name ?? null,
      domain: shop.domain || null,
      city: shop.city || null,
      province: shop.province || null,
      address: shop.address || null,
      shop_type: shop.shop_type || null,
      score: shop.shop_score ?? null,
      enamad: shop.enamad_level || null,
      enamad_valid_until: shop.enamad_expire_date || null,
      active_time: shop.active_time || null,
      member_since: shop.date_added || null,
      guarantee: (shop.guarantee_info as { status?: string })?.status ?? null,
      support_hours: support.schedule || null,
      phones: Array.isArray(support.phones) ? support.phones.slice(0, 3) : [],
    };
  },
});

const productVariants = defineTool({
  name: "product_variants",
  description: "Storage/RAM/region siblings of a product.",
  input: z.object({ id: z.string().min(1) }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const d = await productDetails(ctx, input.id, signal);
    const items = [];
    for (const group of (d.variants as Array<Record<string, unknown>>) ?? []) {
      for (const v of (group.items as Array<Record<string, unknown>>) ?? []) {
        const c = card(v);
        if (!c) continue;
        items.push({
          ...c,
          group: group.title || null,
          variant_title: v.title || null,
          selected: v.selected === true,
        });
      }
    }
    const priced = items.filter((v) => v.price_toman != null);
    const cheapest = priced.reduce<(typeof priced)[0] | null>(
      (a, b) => (a == null || (b.price_toman ?? 0) < (a.price_toman ?? 0) ? b : a),
      null,
    );
    return {
      id: d.random_key,
      variants: items,
      cheapest_variant_toman: cheapest?.price_toman ?? null,
      cheapest_variant_id: cheapest?.id ?? null,
    };
  },
});

const productPriceChart = defineTool({
  name: "product_price_chart",
  description: "Torob price chart for a product.",
  input: z.object({ id: z.string().min(1) }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    assertId(input.id);
    const d = await productDetails(ctx, input.id, signal);
    const chartData = await torobGet(ctx, "/v4/base-product/price-chart/", { prk: input.id }, signal);
    const cd = chartData as { dataSets?: Array<Record<string, unknown>>; labels?: string[] };
    const series = (cd.dataSets ?? []).map((set) => {
      const points = ((set.entries as Array<Record<string, unknown>>) ?? [])
        .map((e, i) => ({
          index: e.i ?? i,
          day: cd.labels?.[(e.i as number) ?? i] ?? null,
          price_toman: typeof e.val === "number" ? Math.round(e.val) : null,
        }))
        .filter((p) => p.price_toman != null);
      const prices = points.map((p) => p.price_toman!);
      return {
        label: set.label || null,
        points,
        low_toman: prices.length ? Math.min(...prices) : null,
        high_toman: prices.length ? Math.max(...prices) : null,
      };
    });
    return {
      id: input.id,
      title: d.name1 ?? null,
      url: productUrl(d.web_client_absolute_url as string),
      current_cheapest_toman: (d.price as number) > 0 ? d.price : null,
      series,
    };
  },
});

const productUrlTool = defineTool({
  name: "product_url",
  description: "UUID to torob.com URL.",
  input: z.object({ id: z.string().min(1) }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const d = await productDetails(ctx, input.id, signal);
    return { id: d.random_key, title: d.name1 ?? null, url: productUrl(d.web_client_absolute_url as string) };
  },
});

const getProductsBatch = defineTool({
  name: "get_products_batch",
  description: "Cards for up to 10 product UUIDs.",
  input: z.object({ ids: z.array(z.string()).min(1).max(10) }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const ids = [...new Set(input.ids)].slice(0, 10);
    const items = [];
    const missing = [];
    for (const id of ids) {
      try {
        const d = await productDetails(ctx, id, signal);
        const c = card(d);
        if (c) items.push(c);
        else missing.push(id);
      } catch {
        missing.push(id);
      }
    }
    return { items, missing_ids: missing };
  },
});

const compareProducts = defineTool({
  name: "compare_products",
  description: "2 to 5 products side by side.",
  input: z.object({
    ids: z.array(z.string()).min(2).max(5),
    spec_keyword: z.string().optional(),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const ids = [...new Set(input.ids)];
    const details = await Promise.all(ids.map((id) => productDetails(ctx, id, signal)));
    const maps = details.map((d) => {
      const map = new Map<string, string>();
      for (const group of flattenSpecs(d, input.spec_keyword)) {
        for (const item of group.items) map.set(item.name, item.value);
      }
      return map;
    });
    const names = [...new Set(maps.flatMap((m) => [...m.keys()]))];
    const differences = [];
    for (const name of names) {
      const values = maps.map((m) => m.get(name) ?? null);
      if (new Set(values).size <= 1) continue;
      differences.push({ name, values });
    }
    return {
      products: details.map((d) => ({
        id: d.random_key,
        title: d.name1 ?? null,
        price_toman: (d.price as number) > 0 ? d.price : null,
        min_price_toman: (d.min_price as number) > 0 ? d.min_price : null,
        max_price_toman: (d.max_price as number) > 0 ? d.max_price : null,
        shop_count:
          (d.products_info as { count?: number })?.count ?? shopCountFromText(d.shop_text as string),
        in_stock: (d.price as number) > 0 && d.price_text_mode !== "disabled",
        url: productUrl(d.web_client_absolute_url as string),
      })),
      spec_differences: differences,
      spec_differences_note: differences.length
        ? null
        : "No differing key specs. These may be colour or region twins of one model.",
    };
  },
});

const findBestValue = defineTool({
  name: "find_best_value",
  description: "Best matches under a Toman budget.",
  input: z.object({
    query: z.string().min(1),
    budget_toman: z.number().positive(),
    category_id: z.number().optional(),
    limit: z.number().int().min(1).max(10).default(3),
    pages: z.number().int().min(1).max(3).default(1),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    const pages = clamp(input.pages, 1, 1, 3);
    const limit = clamp(input.limit, 3, 1, 10);
    const pool = [];
    for (let page = 1; page <= pages; page++) {
      const data = await searchProducts(
        ctx,
        {
          query: input.query,
          category_id: input.category_id,
          sort: "cheapest",
          page,
          limit: 24,
          max_price_toman: input.budget_toman,
          only_marketable: true,
        },
        signal,
      );
      pool.push(...data.items);
      const top = data.items.at(-1)?.price_toman;
      if (data.items.length < 8 || (top != null && top > input.budget_toman)) break;
    }
    const seen = new Set<string>();
    const unique = pool.filter((c) => {
      if (seen.has(c.id) || c.price_toman == null || c.price_toman > input.budget_toman) return false;
      seen.add(c.id);
      return true;
    });
    unique.sort((a, b) => (b.shop_count ?? 0) - (a.shop_count ?? 0) || a.price_toman! - b.price_toman!);
    return {
      query: input.query,
      budget_toman: input.budget_toman,
      picks: unique.slice(0, limit),
      scanned: unique.length,
      note: "Ranked by shop count, then price.",
    };
  },
});

const similarProducts = defineTool({
  name: "similar_products",
  description: "Products Torob lists as similar.",
  input: z.object({
    id: z.string().min(1),
    limit: z.number().int().min(1).max(24).default(10),
    max_price_toman: z.number().optional(),
    only_marketable: z.boolean().default(true),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    assertId(input.id);
    const limit = clamp(input.limit, 10, 1, 24);
    const data = await torobGet(
      ctx,
      "/v4/base-product/similar-base-product/",
      { prk: input.id, limit: 24 },
      signal,
    );
    let items = ((data as { results?: unknown[] }).results ?? [])
      .map((r) => card(r as Record<string, unknown>))
      .filter((c): c is NonNullable<typeof c> => c != null);
    if (input.only_marketable !== false) items = items.filter((c) => c.in_stock);
    if (input.max_price_toman != null) {
      items = items.filter((c) => c.price_toman != null && c.price_toman <= input.max_price_toman!);
    }
    return { id: input.id, items: items.slice(0, limit) };
  },
});

export const torobSource = defineSource({
  id: "torob",
  title: "Torob price comparison",
  baseUrls: ["https://api.torob.com"],
  limits: { rps: 2, burst: 4, concurrency: 4, timeoutMs: 8000 },
  cache: { defaultTtlMs: 180_000 },
  userAgent: "mck-torob/1.0 (+read-only price comparison)",
  health: async (ctx) => ctx.http.get("/v4/base-product/search/", { query: { q: "test" } }),
  tools: [
    torobSuggest,
    searchTorob,
    browseCategory,
    searchFilters,
    productGuide,
    productDetailsTool,
    productSellers,
    productStores,
    shopProfile,
    productVariants,
    productPriceChart,
    productUrlTool,
    getProductsBatch,
    compareProducts,
    findBestValue,
    similarProducts,
  ],
});
