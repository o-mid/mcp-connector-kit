import {
  faToEn,
  foldText,
  htmlToText,
  shopCountFromText,
  validateUpstream,
  type ToolContext,
} from "@mck/core";
import { z } from "zod";

const SITE = "https://torob.com";

const DetailSchema = z.record(z.unknown());
const SearchSchema = z.record(z.unknown());

const SORTS: Record<string, string | undefined> = {
  popular: "",
  cheapest: "price",
  expensive: "-price",
  newest: "-date",
  most_sellers: "-supply",
};

export function clamp(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function productUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return SITE + path;
}

export function card(item: Record<string, unknown>) {
  if (!item.random_key) return null;
  const price = typeof item.price === "number" && item.price > 0 ? item.price : null;
  const inStock = item.price_text_mode !== "disabled" && price != null;
  return {
    id: item.random_key as string,
    title: (item.name1 as string) ?? null,
    title_en: (item.name2 as string) || null,
    price_toman: price,
    price_label: (item.price_text as string) || null,
    in_stock: inStock,
    shop_count: shopCountFromText(item.shop_text as string),
    shop_text: (item.shop_text as string) || null,
    url: productUrl(item.web_client_absolute_url as string),
    image_url: (item.image_url as string) || null,
    is_ad: item.is_adv === true,
  };
}

export function sortParam(sort?: string): string | undefined {
  if (!sort || sort === "popular") return undefined;
  if (!(sort in SORTS)) {
    throw new Error(`Unknown sort "${sort}". Use popular, cheapest, expensive, newest, most_sellers.`);
  }
  return SORTS[sort];
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function catRef(c: Record<string, unknown>) {
  return { id: Number(c.cat_id ?? c.id), title: (c.title as string) ?? null };
}

export function matchQuery(query: string, items: Array<{ title?: string | null; title_en?: string | null }>) {
  const terms = foldText(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1);
  if (!terms.length || !items.length) return { low_confidence: false, unmatched_terms: [] as string[] };
  const blob = items.map((it) => foldText(`${it.title ?? ""} ${it.title_en ?? ""}`)).join("\n");
  const unmatched = terms.filter((t) => !blob.includes(t));
  return { low_confidence: unmatched.length === terms.length, unmatched_terms: unmatched };
}

export async function torobGet(ctx: ToolContext, path: string, params: Record<string, unknown>, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>(path, {
    query: params as Record<string, string | number | boolean | null | undefined>,
    signal,
  });
  return validateUpstream(z.unknown(), raw, {
    sourceId: ctx.sourceId,
    tool: "torob",
    metrics: ctx.metrics,
  }).data;
}

export async function productDetails(ctx: ToolContext, id: string, signal: AbortSignal) {
  assertId(id);
  const raw = await ctx.http.get<unknown>("/v4/base-product/details/", { query: { prk: id }, signal });
  return validateUpstream(DetailSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "product_details",
    metrics: ctx.metrics,
  }).data as Record<string, unknown>;
}

export function assertId(id: string): void {
  if (typeof id !== "string" || !/^[0-9a-f-]{16,}$/i.test(id)) {
    throw new Error("Product id must be a Torob random_key (UUID), from search or browse.");
  }
}

export async function searchProducts(
  ctx: ToolContext,
  opts: {
    query?: string | undefined;
    category_id?: number | undefined;
    brand_id?: number | undefined;
    sort?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    min_price_toman?: number | undefined;
    max_price_toman?: number | undefined;
    only_marketable?: boolean | undefined;
  },
  signal: AbortSignal,
) {
  const limit = clamp(opts.limit, 10, 1, 24);
  const page = clamp(opts.page, 1, 1, 50);
  const params: Record<string, unknown> = {
    q: opts.query,
    category: opts.category_id,
    brand: opts.brand_id,
    page: page - 1,
    size: limit,
    sort: sortParam(opts.sort),
    available: opts.only_marketable === false ? undefined : "true",
  };
  if (opts.min_price_toman != null) params.price__gt = opts.min_price_toman;
  if (opts.max_price_toman != null) params.price__lt = opts.max_price_toman;
  const raw = await ctx.http.get<unknown>("/v4/base-product/search/", { query: params as never, signal });
  const data = validateUpstream(SearchSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "search_torob",
    metrics: ctx.metrics,
  }).data as Record<string, unknown>;
  let items = ((data.results as unknown[]) ?? [])
    .map((r) => card(r as Record<string, unknown>))
    .filter((c): c is NonNullable<ReturnType<typeof card>> => c != null);
  if (opts.only_marketable !== false) items = items.filter((c) => c.in_stock);
  if (opts.min_price_toman != null) {
    items = items.filter((c) => c.price_toman != null && c.price_toman >= opts.min_price_toman!);
  }
  if (opts.max_price_toman != null) {
    items = items.filter((c) => c.price_toman != null && c.price_toman <= opts.max_price_toman!);
  }
  const upstreamMin = num(data.min_price);
  const upstreamMax = num(data.max_price);
  const priceSent =
    opts.min_price_toman != null &&
    opts.max_price_toman != null &&
    upstreamMin != null &&
    upstreamMax != null &&
    upstreamMin >= opts.min_price_toman * 0.5 &&
    upstreamMax <= opts.max_price_toman * 1.5;
  return {
    items: items.slice(0, limit),
    page,
    total_items_estimate: typeof data.count === "number" ? data.count : null,
    estimate_capped: data.count === 1200,
    price_min_toman: upstreamMin,
    price_max_toman: upstreamMax,
    price_filter_sent_upstream: Boolean(priceSent),
    categories: ((data.categories as unknown[]) ?? []).slice(0, 20).map((c) => catRef(c as Record<string, unknown>)),
    parent_categories: ((data.parent_categories as unknown[]) ?? []).map((c) =>
      catRef(c as Record<string, unknown>),
    ),
    spellcheck:
      (data.spellcheck as { is_spellchecked?: boolean })?.is_spellchecked
        ? {
            from: (data.spellcheck as { initial_query?: string }).initial_query,
            to: (data.spellcheck as { corrected_query?: string }).corrected_query,
          }
        : null,
    ...(opts.query ? matchQuery(opts.query, items) : { low_confidence: false, unmatched_terms: [] }),
  };
}

export function keySpecs(detail: Record<string, unknown>) {
  const groups = [];
  for (const group of (detail.key_specs as Array<Record<string, unknown>>) ?? []) {
    const items = [];
    for (const row of (group.items as Array<Record<string, unknown>>) ?? []) {
      const value = Array.isArray(row.value)
        ? row.value.filter(Boolean).join("، ")
        : String(row.value ?? "");
      if (!row.key || !value || /^\d+$/.test(value)) continue;
      items.push({ name: row.key as string, value });
    }
    if (items.length) groups.push({ group: (group.header as string) || "مشخصات", items });
  }
  return groups;
}

export function sellerRow(s: Record<string, unknown>) {
  const complaints = (s.score_info as { complaints_info?: { summary?: unknown[] } })?.complaints_info?.summary;
  return {
    shop_id: s.shop_id ?? null,
    shop: s.shop_name ?? null,
    city: s.shop_name2 || null,
    price_toman: typeof s.price === "number" && s.price > 0 ? s.price : null,
    in_stock: s.availability === true && s.price_text_mode !== "disabled",
    price_unreliable: s.is_price_unreliable === true,
    score: (s.score_info as { score?: number })?.score ?? s.shop_score ?? null,
    score_text: (s.score_info as { score_text?: string })?.score_text ?? null,
    buyer_notes: Array.isArray(complaints) ? complaints.slice(0, 4) : [],
    warranty_listed: (s.guarantee_info as { status?: string })?.status === "enabled",
    last_price_change: s.last_price_change_date || null,
    is_ad: s.is_adv === true,
    listing_title: s.name1 || null,
  };
}

export { htmlToText, faToEn };
