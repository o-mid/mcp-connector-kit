/** Strips HTML to plain text for upstream fields. */
export function htmlToText(html: string | null | undefined, maxLen?: number): string {
  if (html == null || html === "") return "";
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (maxLen != null && text.length > maxLen) {
    text = `${text.slice(0, maxLen - 1)}…`;
  }
  return text;
}

export function plainTextFromHtml(value: string | null | undefined, max = 900): string {
  return htmlToText(value, max);
}
