import { foldText, plainTextFromHtml, validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const SITE = "https://www.khanoumi.com";

const ProductItem = z
  .object({
    slug: z.string().optional(),
    nameFa: z.string().optional(),
    nameEn: z.string().optional(),
    effectivePrice: z.union([z.string(), z.number()]).optional(),
    salesPrice: z.union([z.string(), z.number()]).optional(),
    basePrice: z.union([z.string(), z.number()]).optional(),
    discountPercent: z.union([z.string(), z.number()]).optional(),
    hasStock: z.boolean().optional(),
    isSalable: z.boolean().optional(),
    imageUrl: z.string().optional(),
    mainImageUrl: z.string().optional(),
    brand: z
      .object({
        slug: z.string().optional(),
        nameFa: z.string().optional(),
        nameEn: z.string().optional(),
      })
      .optional(),
    rate: z.number().optional(),
    ratesCount: z.number().optional(),
    commentsCount: z.number().optional(),
    descriptionHtmlFa: z.string().optional(),
    descriptionMarkdown: z.string().optional(),
    howToUseHtml: z.string().optional(),
    howToUseMarkdown: z.string().optional(),
    variants: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough();

const ProductsEnvelope = z.object({
  data: z
    .object({
      products: z
        .object({
          items: z.array(ProductItem).optional(),
          totalCount: z.number().optional(),
          pageNumber: z.number().optional(),
        })
        .optional(),
      facets: z.record(z.unknown()).optional(),
    })
    .passthrough()
    .optional(),
  isSuccess: z.boolean().optional(),
});

function toman(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type ProductRow = z.infer<typeof ProductItem>;

function brandOf(brand: ProductRow["brand"]) {
  if (!brand || typeof brand === "string") return { name: brand || null, slug: null };
  return { name: brand.nameFa || brand.nameEn || null, slug: brand.slug || null };
}

export function card(item: z.infer<typeof ProductItem>) {
  const brand = brandOf(item.brand);
  const price = toman(item.effectivePrice ?? item.salesPrice);
  const regular = toman(item.basePrice);
  return {
    id: item.slug,
    title: item.nameFa || item.nameEn || null,
    title_en: item.nameEn || null,
    brand: brand.name,
    brand_slug: brand.slug,
    price_toman: price,
    regular_price_toman: regular,
    on_sale:
      Number(item.discountPercent) > 0 ||
      (price != null && regular != null && price < regular),
    in_stock: item.hasStock === true || (item.hasStock == null && item.isSalable === true),
    url: item.slug ? `${SITE}/products/${item.slug}` : null,
    image_url: item.imageUrl || item.mainImageUrl || null,
  };
}

const SORTS: Record<string, string> = {
  relevance: "",
  popular: "MostVisited",
  cheapest: "Cheapest",
  expensive: "MostExpensive",
  newest: "Newest",
};

export function sortParam(sort?: string): string {
  if (!sort) return "";
  const key = String(sort).toLowerCase();
  if (!(key in SORTS)) throw new Error(`Unknown sort: ${sort}`);
  return SORTS[key] ?? "";
}

function matchesQuery(item: z.infer<typeof ProductItem>, query: string): boolean {
  const tokens = foldText(query).split(/\s+/).filter((t) => t.length >= 2);
  if (!tokens.length) return true;
  const brand = brandOf(item.brand);
  const hay = foldText([item.nameFa, item.nameEn, brand.name, brand.slug].filter(Boolean).join(" "));
  return tokens.every((t) => hay.includes(t));
}

function matchesBrand(item: z.infer<typeof ProductItem>, brand: string): boolean {
  if (!brand) return true;
  const needle = foldText(brand);
  const info = brandOf(item.brand);
  return [info.slug, info.name, item.brand?.nameEn].filter(Boolean).some((v) => foldText(v ?? "") === needle);
}

async function ntlGet(ctx: ToolContext, path: string, params: Record<string, unknown>, signal: AbortSignal) {
  const url = new URL(`${SITE}/api/ntl/v1${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }
  const raw = await ctx.http.getUrl<unknown>(url.toString(), { signal });
  return validateUpstream(ProductsEnvelope, raw, {
    sourceId: ctx.sourceId,
    tool: "khanoumi",
    metrics: ctx.metrics,
  }).data;
}

export async function searchProducts(
  ctx: ToolContext,
  opts: {
    query: string;
    brand: string;
    category: string;
    inStock: boolean;
    minPrice: number | null;
    maxPrice: number | null;
    sort?: string | undefined;
    page: number;
    limit: number;
  },
  signal: AbortSignal,
) {
  const json = await ntlGet(
    ctx,
    "/products",
    {
      page_number: opts.page,
      page_size: Math.min(20, Math.max(opts.limit, opts.limit * 4)),
      query: opts.query,
      brand: opts.brand,
      cat: opts.category,
      has_stock: opts.inStock ? "true" : "",
      from_price: opts.minPrice,
      to_price: opts.maxPrice,
      sort: sortParam(opts.sort),
    },
    signal,
  );
  const products = json.data?.products;
  const items = products?.items ?? [];
  const cards = items
    .filter((item) => matchesBrand(item, opts.brand) && matchesQuery(item, opts.query))
    .map(card)
    .filter((item) => {
      if (opts.inStock && !item.in_stock) return false;
      if (opts.minPrice != null && (item.price_toman == null || item.price_toman < opts.minPrice)) return false;
      if (opts.maxPrice != null && (item.price_toman == null || item.price_toman > opts.maxPrice)) return false;
      return true;
    })
    .slice(0, opts.limit);
  return {
    total_count: products?.totalCount ?? null,
    page: products?.pageNumber ?? opts.page,
    products: cards,
  };
}

function facetCategories(nodes: unknown, out: Array<{ name: string | null; key: string | null; count: number | null }> = []) {
  if (!Array.isArray(nodes)) return out;
  for (const node of nodes) {
    const n = node as { displayNameFa?: string; displayNameEn?: string; key?: string; count?: number; children?: unknown };
    out.push({
      name: n.displayNameFa || n.displayNameEn || null,
      key: n.key || null,
      count: n.count ?? null,
    });
    if (out.length >= 12) return out;
    facetCategories(n.children, out);
    if (out.length >= 12) return out;
  }
  return out;
}

export async function searchFilters(ctx: ToolContext, query: string, signal: AbortSignal) {
  const json = await ntlGet(ctx, "/products", { query, page_size: 1, page_number: 1 }, signal);
  const data = json.data;
  const price = data?.facets?.priceFacet as { fromPrice?: unknown; toPrice?: unknown } | undefined;
  const brandFacets = (data?.facets?.brandFacets as Array<Record<string, unknown>> | undefined) ?? [];
  const brands = brandFacets.slice(0, 8).map((brand) => ({
    name: (brand.displayNameFa as string) || (brand.displayNameEn as string) || null,
    slug: (brand.key as string) || null,
    count: (brand.count as number) ?? null,
  }));
  return {
    query,
    total_count: data?.products?.totalCount ?? null,
    price_toman: price
      ? {
          min: Number.isFinite(Number(price.fromPrice)) ? Number(price.fromPrice) : null,
          max: Number.isFinite(Number(price.toPrice)) ? Number(price.toPrice) : null,
        }
      : null,
    categories: facetCategories(data?.facets?.categories),
    brands,
  };
}

export async function searchBrands(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  if (!query) {
    const json = await ntlGet(ctx, "/layout/menu", {}, signal);
    const brands = (json.data as { brand?: { bestSellingBrands?: Array<Record<string, unknown>> } })?.brand
      ?.bestSellingBrands ?? [];
    return brands.slice(0, limit).map((brand) => ({
      name: (brand.nameFa as string) || (brand.nameEn as string) || null,
      name_en: (brand.nameEn as string) || null,
      slug: (brand.slug as string) || null,
      url: brand.slug ? `${SITE}/brands/${brand.slug}` : null,
    }));
  }
  const json = await ntlGet(ctx, "/catalog/brands", { query, page_number: 1, page_size: limit }, signal);
  const items = (json.data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  return items.slice(0, limit).map((brand) => ({
    name: (brand.nameFa as string) || (brand.nameEn as string) || null,
    name_en: (brand.nameEn as string) || null,
    slug: (brand.slug as string) || null,
    url: brand.slug ? `${SITE}/brands/${brand.slug}` : null,
  }));
}

export async function brandProfile(ctx: ToolContext, slug: string, limit: number, signal: AbortSignal) {
  const meta = await ntlGet(ctx, `/catalog/brands/slug/${encodeURIComponent(slug)}`, {}, signal);
  const brand = meta.data as Record<string, unknown>;
  if (!brand?.slug) throw new Error("Brand not found");
  const products = await searchProducts(
    ctx,
    {
      query: "",
      brand: String(brand.slug),
      category: "",
      inStock: false,
      minPrice: null,
      maxPrice: null,
      page: 1,
      limit,
    },
    signal,
  );
  return {
    name: (brand.nameFa as string) || (brand.nameEn as string) || null,
    name_en: (brand.nameEn as string) || null,
    slug: brand.slug as string,
    url: `${SITE}/brands/${brand.slug}`,
    description: plainTextFromHtml(String(brand.description ?? ""), 700),
    products: products.products,
  };
}

export async function productDetails(ctx: ToolContext, slug: string, signal: AbortSignal) {
  const json = await ntlGet(ctx, `/products/slug/${encodeURIComponent(slug)}`, {}, signal);
  const item = json.data as z.infer<typeof ProductItem>;
  if (!item?.slug) throw new Error("Product not found");
  const base = card(item);
  const variants = Array.isArray(item.variants)
    ? item.variants.slice(0, 12).map((variant) => {
        const v = variant as Record<string, unknown>;
        const color = v.color as { name?: string } | undefined;
        const weight = v.weight as { value?: number; unit?: string } | undefined;
        return {
          id: (v.id as string) || null,
          color: color?.name || null,
          price_toman: toman(v.salesPrice),
          regular_price_toman: toman(v.basePrice),
          in_stock: v.isSalable === true,
          weight: weight?.value != null ? `${weight.value} ${weight.unit || ""}`.trim() : null,
        };
      })
    : [];
  return {
    ...base,
    rating: item.rate ?? null,
    rating_count: item.ratesCount ?? null,
    comments_count: item.commentsCount ?? null,
    description: plainTextFromHtml(item.descriptionHtmlFa || item.descriptionMarkdown || "", 1200),
    how_to_use: plainTextFromHtml(item.howToUseHtml || item.howToUseMarkdown || "", 600),
    variants,
  };
}
