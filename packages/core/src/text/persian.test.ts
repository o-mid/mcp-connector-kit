import { describe, expect, it } from "vitest";
import { faToEn, foldText, htmlToText, shopCountFromText } from "./persian.js";

describe("persian text helpers", () => {
  it("normalizes Persian digits", () => {
    expect(faToEn("۱۲۳")).toBe("123");
  });

  it("folds ya/kaf variants", () => {
    expect(foldText("كیف")).toContain("ک");
  });

  it("strips html", () => {
    expect(htmlToText("<p>سلام</p>")).toBe("سلام");
  });

  it("parses shop count from Persian text", () => {
    expect(shopCountFromText("در ۵ فروشگاه")).toBe(5);
  });
});
