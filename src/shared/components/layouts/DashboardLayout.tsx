"use client";

import DashboardShell from "./DashboardShell";
import DashboardLayoutLegacy from "./legacy/DashboardLayoutLegacy";

export type DashboardShellMode = "kit" | "legacy";

/** Shell selector: `shell` comes from the server layout (UI_KIT_SHELL flag). */
export default function DashboardLayout({
  children,
  shell = "kit",
  sidebarDefaultOpen = true,
}: {
  children: React.ReactNode;
  shell?: DashboardShellMode;
  sidebarDefaultOpen?: boolean;
}) {
  if (shell === "legacy") return <DashboardLayoutLegacy>{children}</DashboardLayoutLegacy>;
  return <DashboardShell sidebarDefaultOpen={sidebarDefaultOpen}>{children}</DashboardShell>;
}
