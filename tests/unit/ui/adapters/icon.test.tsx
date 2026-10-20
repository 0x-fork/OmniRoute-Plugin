// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { default: Icon } = await import("@/shared/components/Icon");
const { ICON_MAP } = await import("@/shared/constants/iconMap");

afterEach(() => cleanup());

describe("<Icon> adapter (Material name → Lucide, with Material fallback)", () => {
  it("renders the mapped Lucide glyph, decorative by default", () => {
    const { container } = render(<Icon name="settings" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("aria-hidden")).toBe("true");
    expect(svg!.getAttribute("width")).toBe("18");
    expect(svg!.classList.contains("oi-icon")).toBe(true);
    expect(svg!.classList.contains("pointer-events-none")).toBe(true);
    expect(container.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("exposes an accessible name when ariaLabel is given", () => {
    const { getByRole } = render(<Icon name="search" ariaLabel="Search" size={16} />);
    const svg = getByRole("img", { name: "Search" });
    expect(svg.getAttribute("width")).toBe("16");
  });

  it("falls back to the Material ligature for an unmapped name and warns once (Review Focus 2)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container, rerender } = render(<Icon name="rocket_launch_unmapped_xyz" />);
    const span = container.querySelector("span.material-symbols-outlined");
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe("rocket_launch_unmapped_xyz");
    expect(span!.getAttribute("aria-hidden")).toBe("true");
    rerender(<Icon name="rocket_launch_unmapped_xyz" />);
    expect(
      warn.mock.calls.filter((c) => String(c[0]).includes("rocket_launch_unmapped_xyz")).length
    ).toBe(1);
    warn.mockRestore();
  });

  it("renders nothing for an empty name", () => {
    const { container } = render(
      <>
        <Icon name="" />
        <Icon name={null} />
        <Icon />
      </>
    );
    expect(container.innerHTML).toBe("");
  });

  it("the shell and primitive names are all mapped to Lucide (never null)", () => {
    for (const name of [
      "home",
      "settings",
      "search",
      "close",
      "menu",
      "logout",
      "check",
      "expand_more",
      "chevron_right",
      "push_pin",
      "left_panel_open",
      "left_panel_close",
      "light_mode",
      "dark_mode",
      "restart_alt",
      "power_settings_new",
      "power_off",
      "progress_activity",
      "info",
      "visibility",
      "visibility_off",
      "error",
      "warning",
      "check_circle",
      "inbox",
      "add",
      "delete",
      "edit",
      "content_copy",
      "refresh",
      "open_in_new",
      "more_vert",
      "arrow_back",
      "arrow_forward",
      "dns",
      "api",
      "vpn_key",
      "view_list",
      "deployed_code",
      "healing",
    ]) {
      expect(ICON_MAP[name], `${name} must map to a Lucide icon`).toBeTypeOf("object");
    }
  });
});
