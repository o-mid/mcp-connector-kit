import { describe, expect, it } from "vitest";
import { htmlToText, plainTextFromHtml } from "./html-text.js";

describe("html text helpers", () => {
  it("strips tags", () => {
    expect(htmlToText("<p>Hello</p>")).toBe("Hello");
  });

  it("respects max length", () => {
    expect(plainTextFromHtml("<p>abcdefghij</p>", 5)).toBe("abcd…");
  });
});
