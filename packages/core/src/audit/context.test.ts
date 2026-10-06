import { describe, expect, it } from "vitest";
import { getAuditContext, runWithAuditContext } from "./context.js";

describe("audit context", () => {
  it("returns tenant inside runWithAuditContext", () => {
    runWithAuditContext({ tenantId: "t-1" }, () => {
      expect(getAuditContext()?.tenantId).toBe("t-1");
    });
    expect(getAuditContext()).toBeUndefined();
  });
});
