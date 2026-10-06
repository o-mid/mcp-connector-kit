import { describe, expect, it } from "vitest";
import { filterSourcesForSku } from "./tier.js";

describe("gateway SKU", () => {
  it("free tier keeps fixture and wikipedia only", () => {
    expect(filterSourcesForSku(["fixture", "wikipedia", "github"], "free")).toEqual([
      "fixture",
      "wikipedia",
    ]);
  });

  it("paid tier includes trust sources", () => {
    const ids = filterSourcesForSku(
      ["fixture", "wikipedia", "github", "web-reader", "brave"],
      "paid",
    );
    expect(ids).toContain("github");
    expect(ids).toContain("brave");
  });
});
