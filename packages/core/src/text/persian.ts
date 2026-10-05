/** Persian digits to ASCII so price parsing matches legacy Torob behavior. */
export function faToEn(value: string): string {
  return String(value).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/** Loose fold for Persian/Arabic letter variants in search matching. */
export function foldText(value: string): string {
  return faToEn(String(value))
    .replace(/[\u200c\u200d]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .toLowerCase();
}

/** Strip HTML to plain text for product guides and descriptions. */
export function htmlToText(html: string | null | undefined, maxLen?: number): string {
  let text = String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  if (maxLen != null && text.length > maxLen) {
    text = `${text.slice(0, maxLen).trim()}…`;
  }
  return text;
}

export function plainTextFromHtml(value: string | null | undefined, max = 900): string {
  const text = String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&zwnj;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export function shopCountFromText(text: string | null | undefined): number | null {
  if (!text || typeof text !== "string") return null;
  const m = faToEn(text).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}
