import { validateUpstream, type ToolContext } from "@mck/core";
import { WooList, type ProductCard } from "./schemas.js";
import { wooCard, withinBudget, type SearchOpts } from "./lib.js";
import type { WooShop } from "./shops.js";
import type { z } from "zod";

export function searchOptsFromArgs(args: {
  min_price?: number | undefined;
  max_price?: number | undefined;
  in_stock?: boolean | undefined;
  brand?: string | undefined;
}): SearchOpts {
  return {
    brand: args.brand ? String(args.brand).trim() : "",
    inStock: args.in_stock === true,
    minPrice: args.min_price ?? null,
    maxPrice: args.max_price ?? null,
  };
}

export async function searchWooShop(
  ctx: ToolContext,
  shop: WooShop,
  query: string,
  limit: number,
  opts: SearchOpts,
  signal: AbortSignal,
): Promise<z.infer<typeof ProductCard>[]> {
  const url = new URL("/wp-json/wc/store/v1/products", shop.site);
  if (query) url.searchParams.set("search", query);
  url.searchParams.set("per_page", String(Math.min(20, Math.max(limit, limit))));
  if (opts.minPrice != null) url.searchParams.set("min_price", String(opts.minPrice));
  if (opts.maxPrice != null) url.searchParams.set("max_price", String(opts.maxPrice));
  const raw = await ctx.http.getUrl<unknown>(url.toString(), { signal });
  const parsed = validateUpstream(WooList, raw, {
    sourceId: ctx.sourceId,
    tool: "search_products",
    metrics: ctx.metrics,
  });
  return parsed.data
    .map((item) => wooCard(shop, item))
    .filter((card) => {
      if (opts.inStock && !card.in_stock) return false;
      if (opts.minPrice != null || opts.maxPrice != null) {
        return withinBudget(card, opts.minPrice, opts.maxPrice);
      }
      return true;
    })
    .slice(0, limit);
}

export async function productDetailWoo(
  ctx: ToolContext,
  shop: WooShop,
  id: string,
  signal: AbortSignal,
) {
  const url = new URL(`/wp-json/wc/store/v1/products/${encodeURIComponent(id)}`, shop.site);
  const raw = await ctx.http.getUrl<unknown>(url.toString(), { signal });
  const item = validateUpstream(
    WooList.element,
    raw,
    { sourceId: ctx.sourceId, tool: "product_details", metrics: ctx.metrics },
  ).data;
  const card = wooCard(shop, item);
  return {
    ...card,
    sku: item.sku ?? null,
    categories: Array.isArray(item.categories)
      ? item.categories.map((c) => c.name).filter((n): n is string => Boolean(n))
      : [],
  };
}
