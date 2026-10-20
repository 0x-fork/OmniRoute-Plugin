// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar as KitSidebar, SidebarProvider } from "@omniroute/ui-kit/sidebar";

process.env.NEXT_PUBLIC_OMNIROUTE_E2E_MODE = "1";
// Not an import budget (the kit comes from the sidebar subpath; import is ~3% of the run): these
// cases resolve accessible names over the whole ~120-control sidebar (getByRole/findByRole) and
// drive it with user-event, measured at 5–8.4 s per case on a loaded host (load 30–42).
vi.setConfig({ testTimeout: 30_000 });
const nav = vi.hoisted(() => ({ pathname: "/home" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
vi.mock("next/link", () => ({
  default: ({ href, children, prefetch: _p, ...p }: any) => (
    <a href={href} {...p}>
      {children}
    </a>
  ),
}));

const { default: Sidebar, useSidebarSide } = await import("@/shared/components/Sidebar");
const jsonResponse = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

function Harness({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const side = useSidebarSide();
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <KitSidebar collapsible="icon" side={side}>
        <Sidebar />
      </KitSidebar>
      <main data-slot="sidebar-inset" />
    </SidebarProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      jsonResponse({ featureFlags: {}, hiddenSidebarItems: [], hiddenSidebarSections: [] })
    )
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.dir = "";
});

describe("Sidebar rendered with the kit Sidebar family", () => {
  it("keeps the navigation contract: landmark, sections as buttons, active link, search box, brand", async () => {
    render(<Harness />);
    const navEl = await screen.findByRole("navigation", { name: "Main navigation" });
    expect(navEl.closest("aside[data-slot=sidebar]")).not.toBeNull();
    expect(within(navEl).getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe(
      "page"
    );
    // At /home the accordion keeps only the active (Home) section open; OmniProxy is a closed
    // disclosure button that opens on click (sidebar logic is unchanged by the kit rendering).
    const section = within(navEl).getByRole("button", { name: "OmniProxy", exact: true });
    expect(section.getAttribute("aria-expanded")).toBe("false");
    expect(section.getAttribute("aria-controls")).toBeTruthy();
    await userEvent.setup().click(section);
    expect(section.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(section.getAttribute("aria-controls")!)).not.toBeNull();
    expect(screen.getByRole("searchbox")).not.toBeNull();
    expect(screen.getByRole("img", { name: "Keak OmniRoute" })).not.toBeNull();
    expect(navEl.querySelector(".material-symbols-outlined")).toBeNull();
    expect(navEl.querySelectorAll("svg.oi-icon").length).toBeGreaterThan(5);
  });

  it("puts the search at the top of SidebarContent, sticky above the scrolling nav (spec §3.7)", async () => {
    render(<Harness />);
    const navEl = await screen.findByRole("navigation", { name: "Main navigation" });
    const search = screen.getByRole("searchbox");
    const content = search.closest("[data-slot=sidebar-content]");
    expect(content).not.toBeNull();
    expect(search.closest("[data-slot=sidebar-header]")).toBeNull();
    // First in the content, before the navigation landmark, and kept in view while it scrolls.
    expect(content!.firstElementChild!.contains(search)).toBe(true);
    expect(content!.firstElementChild!.className).toContain("sticky");
    expect(content!.contains(navEl)).toBe(true);
  });

  it("gives the footer actions full-width rows so their labels never truncate", async () => {
    render(<Harness />);
    await screen.findByRole("navigation", { name: "Main navigation" });
    for (const name of ["Restart", "Shutdown"]) {
      const button = screen.getByRole("button", { name });
      expect(button.textContent).toContain(name);
      expect(button.querySelector(".truncate")).toBeNull();
      expect(button.className).toContain("w-full");
    }
  });

  it("collapsing via the trigger hides labels and keeps links reachable with tooltips", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByRole("navigation", { name: "Main navigation" });
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(document.querySelector("aside[data-slot=sidebar]")!.getAttribute("data-state")).toBe(
      "collapsed"
    );
    expect(screen.queryByRole("searchbox")).toBeNull();
    const home = screen.getByRole("link", { name: "Home" });
    // Icon rail: only the glyph is painted; the name comes from aria-label (+ the kit tooltip).
    expect(home.textContent).toBe("");
    expect(home.querySelector("svg.oi-icon")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByRole("searchbox")).not.toBeNull();
  });

  it("pins and unpins an item into the Pinned section (localStorage round-trip)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const navEl = await screen.findByRole("navigation", { name: "Main navigation" });
    await user.click(within(navEl).getByRole("button", { name: "OmniProxy", exact: true }));
    await user.click(within(navEl).getAllByRole("button", { name: "Pin item" })[0]);
    expect(within(navEl).getByRole("button", { name: "Pinned", exact: true })).not.toBeNull();
    expect(JSON.parse(localStorage.getItem("sidebar-pinned-items")!).length).toBe(1);
    await user.click(within(navEl).getAllByRole("button", { name: "Unpin item" })[0]);
    expect(within(navEl).queryByRole("button", { name: "Pinned", exact: true })).toBeNull();
    expect(JSON.parse(localStorage.getItem("sidebar-pinned-items")!)).toEqual([]);
  });

  it("under dir=rtl the mobile drawer opens from the right (Review Focus 4)", async () => {
    document.documentElement.dir = "rtl";
    render(<Harness />);
    await screen.findByRole("navigation", { name: "Main navigation" });
    expect(document.querySelector("aside[data-slot=sidebar]")!.getAttribute("data-side")).toBe(
      "right"
    );
    // The rail keeps the physical `right-0` in both directions: globals.css mirrors physical
    // utilities under html[dir=rtl] (`.right-0` → `right: auto; inset-inline-end: 0`), which puts it
    // on the aside's left = content edge. A conditional `left-0` would be mirrored to the OUTER edge
    // (measured in Chromium; layout proof in tests/e2e/sidebar-rtl.spec.ts).
    const railClass = document.querySelector("[data-slot=sidebar-rail]")!.className;
    expect(railClass).toContain("right-0");
    expect(railClass).not.toContain("left-0");
  });

  it("keeps the rail inside the aside on the right edge in LTR (no horizontal overflow)", async () => {
    render(<Harness />);
    await screen.findByRole("navigation", { name: "Main navigation" });
    const rail = document.querySelector("[data-slot=sidebar-rail]")!;
    expect(rail.closest("aside[data-slot=sidebar]")).not.toBeNull();
    expect(rail.className).toContain("right-0");
  });
});
