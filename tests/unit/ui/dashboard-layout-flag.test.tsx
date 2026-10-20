// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/shared/components/Sidebar", () => ({
  default: () => <nav data-testid="kit-sidebar" />,
  useSidebarSide: () => "left",
}));
vi.mock("@/shared/components/Header", () => ({
  default: () => <header data-testid="kit-header" />,
}));
vi.mock("@/shared/components/CommandPalette", () => ({ default: () => null }));
vi.mock("@/shared/components/layouts/legacy/SidebarLegacy", () => ({
  default: () => <aside data-testid="legacy-sidebar" />,
}));
vi.mock("@/shared/components/layouts/legacy/HeaderLegacy", () => ({
  default: () => <header data-testid="legacy-header" />,
}));
vi.mock("@/shared/components/layouts/legacy/CommandPaletteLegacy", () => ({
  default: () => null,
}));
vi.mock("@/shared/components/MaintenanceBanner", () => ({ default: () => null }));
vi.mock("@/shared/components/NavigationProgress", () => ({ default: () => null }));

const { default: DashboardLayout } = await import("@/shared/components/layouts/DashboardLayout");

afterEach(() => cleanup());

describe("DashboardLayout shell switch (UI_KIT_SHELL)", () => {
  it("shell=kit renders SidebarProvider + SidebarInset with the kit sidebar/header", () => {
    const { container, getByTestId } = render(
      <DashboardLayout shell="kit">
        <p>page</p>
      </DashboardLayout>
    );
    expect(container.querySelector("[data-slot=sidebar-provider]")).not.toBeNull();
    expect(container.querySelector("main[data-slot=sidebar-inset]#main-content")).not.toBeNull();
    getByTestId("kit-sidebar");
    getByTestId("kit-header");
    expect(container.querySelector(".dashboard-sidebar-desktop")).toBeNull();
  });

  it("shell=legacy renders the untouched legacy shell and nothing from the kit (kill switch)", () => {
    const { container, getAllByTestId, getByTestId, queryByTestId } = render(
      <DashboardLayout shell="legacy">
        <p>page</p>
      </DashboardLayout>
    );
    expect(container.querySelector(".dashboard-sidebar-desktop")).not.toBeNull();
    // The legacy shell mounts its Sidebar twice: the desktop column and the mobile drawer.
    expect(getAllByTestId("legacy-sidebar")).toHaveLength(2);
    getByTestId("legacy-header");
    expect(queryByTestId("kit-sidebar")).toBeNull();
    expect(container.querySelector("[data-slot=sidebar-provider]")).toBeNull();
  });
});
