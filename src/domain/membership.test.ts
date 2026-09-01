import { describe, expect, it } from "vitest";

import {
  ACCESS_ROLES,
  LEADERSHIP_POSITIONS,
  MEMBERSHIP_STATUSES,
  canBrotherChooseMembershipStatus,
  hasMemberManagementAccess,
} from "./membership";

describe("membership rules", () => {
  it.each(["on_yard", "alumni"] as const)(
    "allows a brother to choose %s",
    (status) => {
      expect(canBrotherChooseMembershipStatus(status)).toBe(true);
    },
  );

  it("reserves Chapter Invisible for management", () => {
    expect(canBrotherChooseMembershipStatus("chapter_invisible")).toBe(false);
  });

  it.each([
    ["brother", false],
    ["officer", true],
    ["admin", true],
  ] as const)("grants member management correctly for %s", (role, expected) => {
    expect(hasMemberManagementAccess(role)).toBe(expected);
  });

  it("contains exactly the agreed platform roles", () => {
    expect(ACCESS_ROLES).toEqual(["brother", "officer", "admin"]);
  });

  it("contains exactly the agreed membership statuses", () => {
    expect(MEMBERSHIP_STATUSES).toEqual([
      "on_yard",
      "alumni",
      "chapter_invisible",
    ]);
  });

  it("contains exactly the five current campus leadership positions", () => {
    expect(LEADERSHIP_POSITIONS).toEqual([
      "polemarch",
      "vice_polemarch",
      "keeper_of_records",
      "keeper_of_exchequer",
      "strategus",
    ]);
  });
});
