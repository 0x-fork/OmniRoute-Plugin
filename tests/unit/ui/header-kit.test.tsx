// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@omniroute/ui-kit";

process.env.NEXT_PUBLIC_OMNIROUTE_E2E_MODE = "1";
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/providers",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/shared/components/LanguageSelector", () => ({
  default: () => <div data-testid="lang" />,
}));

const { default: Header } = await import("@/shared/components/Header");
const { default: ThemeToggle } = await import("@/shared/components/ThemeToggle");

afterEach(() => cleanup());

describe("Header on the kit shell", () => {
  it(
    "renders the sidebar trigger, page title, product switcher and actions",
    { timeout: 20_000 },
    () => {
      const open = vi.fn();
      render(
        <SidebarProvider>
          <Header onOpenCommandPalette={open} />
        </SidebarProvider>
      );
      const header = screen.getByRole("banner");
      expect(header.className).toContain("ci-sidebar-shell-header");
      expect(screen.getByRole("button", { name: "Collapse sidebar" })).not.toBeNull();
      expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Providers/);
      expect(screen.getByRole("navigation", { name: "Keak products" })).not.toBeNull();
      fireEvent.click(screen.getAllByRole("button", { name: "Open quick navigation" })[0]);
      expect(open).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Logout" }).className).toContain(
        "ci-button--ghost"
      );
      expect(header.querySelector(".material-symbols-outlined")).toBeNull();
    }
  );

  it(
    "ThemeToggle is a ghost icon button with a translated name that flips",
    { timeout: 20_000 },
    () => {
      render(<ThemeToggle />);
      const btn = screen.getByRole("button", { name: /Switch to (dark|light) mode/ });
      expect(btn.className).toContain("ci-button--ghost");
      expect(btn.querySelector("svg.oi-icon")).not.toBeNull();
      const before = btn.getAttribute("aria-label");
      fireEvent.click(btn);
      expect(
        screen
          .getByRole("button", { name: /Switch to (dark|light) mode/ })
          .getAttribute("aria-label")
      ).not.toBe(before);
    }
  );
});
