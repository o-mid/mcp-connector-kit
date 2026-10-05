import type { WooShop } from "./shops.js";
import type { z } from "zod";
import type { WooProduct } from "./schemas.js";

export function toman(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function wooCard(shop: WooShop, item: z.infer<typeof WooProduct>) {
  const prices = item.prices ?? {};
  return {
    shop: shop.id,
    shop_name: shop.name,
    id: String(item.id),
    title: item.name ?? null,
    price_toman: toman(prices.price),
    regular_price_toman: toman(prices.regular_price),
    on_sale: item.on_sale === true,
    in_stock: item.is_in_stock === true,
    url: item.permalink ?? null,
  };
}

export type SearchOpts = {
  brand: string;
  inStock: boolean;
  minPrice: number | null;
  maxPrice: number | null;
};

export function withinBudget(
  card: { price_toman: number | null },
  minPrice: number | null,
  maxPrice: number | null,
): boolean {
  if (card.price_toman == null) return false;
  if (minPrice != null && card.price_toman < minPrice) return false;
  if (maxPrice != null && card.price_toman > maxPrice) return false;
  return true;
}
