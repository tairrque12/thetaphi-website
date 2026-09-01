import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("public home page", () => {
  it("identifies the chapter and gives brothers a clear portal entry", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /theta phi chapter of kappa alpha psi fraternity/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /brother login/i }),
    ).toHaveAttribute("href", "/login");
  });
});
