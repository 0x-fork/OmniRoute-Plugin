import { test, expect, type Page } from "@playwright/test";
import { gotoDashboardRoute } from "./helpers/dashboardAuth";

// `/dashboard/settings` has no tab strip since the Nav Restructure: it redirects to the first
// sub-route and every settings area is its own page reached from the sidebar (owner decision P1,
// KEA-7886). Each check below runs on the sub-route that now owns the control:
//   - debug mode            → /dashboard/settings/advanced (DebugModeCard)
//   - sidebar visibility    → /dashboard/settings/sidebar  (SidebarTab, one checkbox per item)
//   - clear cache / purge   → /dashboard/settings/general  (SystemStorageTab)
test.describe("Settings Toggles", () => {
  const getDebugToggle = (page: Page) => page.getByRole("switch", { name: /enable debug mode/i });

  // Sidebar visibility rows are kit checkboxes named by the item label; every section of the
  // accordion starts expanded, so the row is reachable without opening anything.
  const getSidebarVisibilityToggle = (page: Page, itemLabel: string) =>
    page.getByRole("checkbox", { name: new RegExp(`^${itemLabel}$`, "i") });

  const waitForSettingsPatch = (page: Page) =>
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/settings") &&
        response.request().method() === "PATCH" &&
        response.ok()
    );

  test("/dashboard/settings redirects to a settings sub-route", async ({ page }) => {
    await gotoDashboardRoute(page, "/dashboard/settings");
    await expect(page).toHaveURL(/\/dashboard\/settings\/general(?:[?#].*)?$/, {
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: /clear cache/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("Debug mode toggle should work", async ({ page }) => {
    await gotoDashboardRoute(page, "/dashboard/settings/advanced");

    const debugToggle = getDebugToggle(page);

    await expect(debugToggle).toBeVisible({ timeout: 15000 });
    await expect(debugToggle).toBeEnabled({ timeout: 15000 });

    const initialState = await debugToggle.getAttribute("aria-checked");
    await Promise.all([waitForSettingsPatch(page), debugToggle.click()]);
    await expect(debugToggle).toHaveAttribute(
      "aria-checked",
      initialState === "true" ? "false" : "true",
      { timeout: 15000 }
    );
  });

  test("Sidebar visibility toggle should work", async ({ page }) => {
    await gotoDashboardRoute(page, "/dashboard/settings/sidebar");

    const sidebarToggle = getSidebarVisibilityToggle(page, "Health");

    await expect(sidebarToggle).toBeVisible({ timeout: 15000 });
    await expect(sidebarToggle).toBeEnabled({ timeout: 15000 });

    const initiallyChecked = await sidebarToggle.isChecked();
    await Promise.all([waitForSettingsPatch(page), sidebarToggle.click()]);
    if (initiallyChecked) {
      await expect(sidebarToggle).not.toBeChecked({ timeout: 15000 });
    } else {
      await expect(sidebarToggle).toBeChecked({ timeout: 15000 });
    }
  });

  test("Clear Cache button calls DELETE /api/cache", async ({ page }) => {
    await gotoDashboardRoute(page, "/dashboard/settings/general");

    const clearBtn = page.getByRole("button", { name: /clear cache/i });
    await expect(clearBtn).toBeVisible({ timeout: 15000 });

    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().includes("/api/cache") && req.method() === "DELETE"),
      clearBtn.click(),
    ]);
    expect(request).toBeTruthy();
  });

  test("Purge Expired Logs button calls POST /api/settings/purge-logs", async ({ page }) => {
    await gotoDashboardRoute(page, "/dashboard/settings/general");

    const purgeBtn = page.getByRole("button", { name: /purge expired logs/i });
    await expect(purgeBtn).toBeVisible({ timeout: 15000 });

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes("/api/settings/purge-logs") && req.method() === "POST"
      ),
      purgeBtn.click(),
    ]);
    expect(request).toBeTruthy();
  });

  test("Debug mode should persist after page reload", async ({ page }) => {
    await gotoDashboardRoute(page, "/dashboard/settings/advanced");

    const debugToggle = getDebugToggle(page);

    await expect(debugToggle).toBeVisible({ timeout: 15000 });
    await expect(debugToggle).toBeEnabled({ timeout: 15000 });

    const initialState = await debugToggle.getAttribute("aria-checked");
    await Promise.all([waitForSettingsPatch(page), debugToggle.click()]);
    const nextState = initialState === "true" ? "false" : "true";
    await expect(debugToggle).toHaveAttribute("aria-checked", nextState, { timeout: 15000 });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const reloadedToggle = getDebugToggle(page);
    await expect(reloadedToggle).toBeEnabled({ timeout: 15000 });
    await expect(reloadedToggle).toHaveAttribute("aria-checked", nextState, {
      timeout: 15000,
    });
  });
});
