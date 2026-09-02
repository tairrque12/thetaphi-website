import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingForm } from "./onboarding-form";

const profile = {
  first_name: "John",
  middle_name: "",
  last_name: "Doe",
  individual_line_name: "Achievement",
  email: "john@example.com",
  phone: "",
  street_address: "",
  city: "Troy",
  state: "AL",
  postal_code: "",
  profession: "",
  employer: "",
  membership_status: "alumni" as const,
};

describe("OnboardingForm", () => {
  it("offers only On Yard and Alumni as self-selected statuses", () => {
    render(<OnboardingForm action={vi.fn()} initialProfile={profile} />);

    expect(
      screen.getByRole("radio", { name: /^On Yard/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^Alumni/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: /chapter invisible/i }),
    ).not.toBeInTheDocument();
  });

  it("moves from profile review to privacy without losing the short flow", () => {
    render(<OnboardingForm action={vi.fn()} initialProfile={profile} />);

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save and enter portal" }),
    ).toBeInTheDocument();
  });
});
