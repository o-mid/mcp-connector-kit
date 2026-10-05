import { z } from "zod";

export const WooProduct = z.object({
  id: z.number(),
  name: z.string().optional(),
  permalink: z.string().optional(),
  on_sale: z.boolean().optional(),
  is_in_stock: z.boolean().optional(),
  sku: z.string().optional(),
  prices: z
    .object({
      price: z.union([z.string(), z.number()]).optional(),
      regular_price: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
  categories: z.array(z.object({ name: z.string().optional() })).optional(),
});

export const WooList = z.array(WooProduct);

export const ProductCard = z.object({
  shop: z.string(),
  shop_name: z.string(),
  id: z.string(),
  title: z.string().nullable(),
  price_toman: z.number().nullable(),
  regular_price_toman: z.number().nullable(),
  on_sale: z.boolean(),
  in_stock: z.boolean(),
  url: z.string().nullable(),
});
