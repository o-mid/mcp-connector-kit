export type WooShop = {
  id: string;
  name: string;
  site: string;
  note: string;
};

export const DEFAULT_WOO_SHOPS: WooShop[] = [
  {
    id: "aradokht",
    name: "آرا دخت",
    site: "https://aradokht.net",
    note: "Korean skincare shop",
  },
  {
    id: "mouliyan",
    name: "مولیان",
    site: "https://mouliyan.com",
    note: "Skincare shop",
  },
  {
    id: "nazisho",
    name: "نازی شو",
    site: "https://nazisho.com",
    note: "Skincare shop",
  },
];
