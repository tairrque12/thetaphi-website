import { describe, expect, it } from "vitest";

import { safeInternalPath } from "./navigation";

describe("safeInternalPath", () => {
  it("keeps an internal application path", () => {
    expect(safeInternalPath("/claim/abc123")).toBe("/claim/abc123");
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "javascript:alert(1)",
    "",
  ])("rejects unsafe redirect value %s", (path) => {
    expect(safeInternalPath(path)).toBe("/dashboard");
  });
});
