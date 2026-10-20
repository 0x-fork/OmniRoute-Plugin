// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { default: Button } = await import("@/shared/components/Button");

afterEach(() => cleanup());

describe("Button adapter → kit Button", () => {
  it("maps legacy variants onto kit classes and keeps type=button", () => {
    const cases: Array<[string, string]> = [
      ["primary", "ci-button--default"],
      ["accent", "ci-button--default"],
      ["secondary", "ci-button--secondary"],
      ["outline", "ci-button--outline"],
      ["ghost", "ci-button--ghost"],
      ["danger", "ci-button--destructive"],
      ["warning", "ci-button--warning"],
    ];
    for (const [variant, cls] of cases) {
      const { getByRole, unmount } = render(<Button variant={variant as any}>Go</Button>);
      const btn = getByRole("button", { name: "Go" });
      expect(btn.className, variant).toContain("ci-button");
      expect(btn.className, variant).toContain(cls);
      expect(btn.getAttribute("type")).toBe("button");
      unmount();
    }
  });

  it("maps sizes and fullWidth", () => {
    const { getByRole } = render(
      <Button size="sm" fullWidth>
        S
      </Button>
    );
    const btn = getByRole("button", { name: "S" });
    expect(btn.className).toContain("ci-button--size-sm");
    expect(btn.className).toContain("w-full");
  });

  it("renders icon/iconRight through <Icon> (Lucide for mapped names)", () => {
    const { getByRole } = render(
      <Button icon="search" iconRight="chevron_right">
        Find
      </Button>
    );
    const btn = getByRole("button", { name: "Find" });
    expect(btn.querySelectorAll("svg.oi-icon").length).toBe(2);
    expect(btn.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("loading disables the button, sets aria-busy and hides the leading icon", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <Button loading icon="search" onClick={onClick}>
        Save
      </Button>
    );
    const btn = getByRole("button", { name: "Save" });
    expect(btn).toHaveProperty("disabled", true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.querySelector("svg.oi-icon")).toBeNull();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards arbitrary props (data-*, aria-*, onClick, className)", () => {
    const onClick = vi.fn();
    const { getByTestId } = render(
      <Button data-testid="x" aria-label="Extra" className="mt-2" onClick={onClick} />
    );
    const btn = getByTestId("x");
    expect(btn.getAttribute("aria-label")).toBe("Extra");
    expect(btn.className).toContain("mt-2");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
