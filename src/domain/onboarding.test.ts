import { describe, expect, it } from "vitest";

import { onboardingSchema } from "./onboarding";

const validProfile = {
  first_name: "John",
  middle_name: "",
  last_name: "Doe",
  individual_line_name: "Achievement",
  email: "john@example.com",
  phone: "334-555-1911",
  street_address: "",
  city: "Troy",
  state: "AL",
  postal_code: "36081",
  profession: "Engineer",
  employer: "",
  membership_status: "alumni",
  privacy: {
    email: false,
    phone: false,
    city_state: true,
    birthday: false,
    profession: true,
    employer: false,
  },
};

describe("onboarding profile validation", () => {
  it("accepts a complete brother profile", () => {
    expect(onboardingSchema.safeParse(validProfile).success).toBe(true);
  });

  it("rejects Chapter Invisible as a self-selected status", () => {
    const result = onboardingSchema.safeParse({
      ...validProfile,
      membership_status: "chapter_invisible",
    });

    expect(result.success).toBe(false);
  });

  it("requires the brother's first and last name", () => {
    expect(
      onboardingSchema.safeParse({ ...validProfile, first_name: "" }).success,
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({ ...validProfile, last_name: "" }).success,
    ).toBe(false);
  });

  it("rejects malformed email when an email is supplied", () => {
    expect(
      onboardingSchema.safeParse({ ...validProfile, email: "not-email" })
        .success,
    ).toBe(false);
  });
});
