// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

const { default: Footer } = await import("@/shared/components/Footer");

afterEach(() => cleanup());

describe("Footer on kit primitives", () => {
  it("titles each column with a kit eyebrow, splits the bottom row with a kit Separator and names every link", () => {
    const { container } = render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const eyebrows = Array.from(footer.querySelectorAll(".ci-eyebrow")).map((el) => el.textContent);
    expect(eyebrows).toEqual(["Product", "Resources", "Company"]);
    expect(footer.querySelector(".ci-separator")).not.toBeNull();
    // internal links used to render `link.label` (undefined) — every link needs a visible name
    for (const name of [
      "Features",
      "Pricing",
      "Documentation",
      "API Reference",
      "Terms",
      "Privacy",
    ]) {
      expect(screen.getAllByRole("link", { name }).length).toBeGreaterThan(0);
    }
    const external = screen.getByRole("link", { name: "Help Center" });
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");
    expect(container.innerHTML).not.toContain("hover:text-primary");
  });
});
