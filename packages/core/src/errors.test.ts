import { describe, expect, it } from "vitest";
import { ConnectorError } from "./errors.js";

describe("ConnectorError", () => {
  it("exposes stable payload", () => {
    const err = new ConnectorError("not_found", "missing", { source: "torob" });
    expect(err.toPayload().code).toBe("not_found");
    expect(err.retryable).toBe(false);
  });
});
