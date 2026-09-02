import { describe, expect, it } from "vitest";

import { normalizeLegacyRoster } from "./legacy-roster";

const baseRecord = {
  sourceRow: 1,
  name: "  John   Doe ",
  individualLineName: " Achievement ",
  email: " JOHN.DOE@EXAMPLE.COM ",
  phone: "(334) 555-1911",
  address: "100 University Ave, Troy, AL 36081",
  crossingSeason: "spring",
  crossingYear: 2018,
  groupLineName: "Example Line",
};

describe("legacy roster normalization", () => {
  it("normalizes contact information without marking it verified", () => {
    const [record] = normalizeLegacyRoster([baseRecord]);

    expect(record).toMatchObject({
      fullName: "John Doe",
      email: "john.doe@example.com",
      phone: "+13345551911",
      verificationState: "unverified",
      importState: "ready_for_review",
    });
  });

  it("assigns records explicitly marked Chapter Invisible", () => {
    const [record] = normalizeLegacyRoster([
      {
        ...baseRecord,
        individualLineName: "Chapter Invisible",
        email: "Chapter Invisible",
      },
    ]);

    expect(record.membershipStatus).toBe("chapter_invisible");
    expect(record.importState).toBe("chapter_invisible");
    expect(record.email).toBeNull();
  });

  it("routes missing contact details to officer review", () => {
    const [record] = normalizeLegacyRoster([{ ...baseRecord, email: "" }]);

    expect(record.importState).toBe("needs_review");
    expect(record.reviewFlags).toContain("missing_email");
  });

  it("flags duplicate-looking records without merging them automatically", () => {
    const records = normalizeLegacyRoster([
      baseRecord,
      { ...baseRecord, sourceRow: 2, phone: "" },
    ]);

    expect(records[0].reviewFlags).toContain("possible_duplicate");
    expect(records[1].reviewFlags).toContain("possible_duplicate");
  });
});
