// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

const { default: OmniRouteLogo, OmniRouteLockup } =
  await import("@/shared/components/OmniRouteLogo");

afterEach(() => cleanup());

describe("brand wrappers → kit ProductIcon / ProductLockup", () => {
  it("OmniRouteLogo keeps the size/className API and renders the kit product glyph", () => {
    const { container } = render(<OmniRouteLogo size={22} className="x" />);
    const svg = container.querySelector("svg")!;
    expect(svg.classList.contains("ci-keak-product-icon")).toBe(true);
    expect(svg.classList.contains("x")).toBe(true);
    expect(svg.getAttribute("width")).toBe("22");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("image, [href^='/brand/']")).toBeNull();
  });

  it("OmniRouteLockup renders the Keak OmniRoute lockup with one accessible name", () => {
    render(<OmniRouteLockup />);
    expect(screen.getByRole("img", { name: "Keak OmniRoute" })).not.toBeNull();
  });

  it("OmniRouteLockup honours white-label name/logo", () => {
    render(<OmniRouteLockup name="Acme Router" logoSrc="data:image/png;base64,AAAA" />);
    expect(screen.getByRole("img", { name: "Acme Router" })).not.toBeNull();
    expect(screen.getByText("Acme Router")).not.toBeNull();
  });
});
