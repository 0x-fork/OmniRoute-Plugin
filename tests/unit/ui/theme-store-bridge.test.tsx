// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

describe("themeStore ↔ CI UI Kit bridge", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = "";
  });

  it("applies dark as both the .dark class and data-theme=dark (kit contract)", async () => {
    const { applyTheme } = await import("@/store/themeStore");
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignores the retired colorTheme/customColor keys persisted by older builds (Review Focus 1)", async () => {
    localStorage.setItem(
      "theme",
      JSON.stringify({
        state: { theme: "dark", colorTheme: "violet", customColor: "#8b5cf6" },
        version: 0,
      })
    );
    const { default: useThemeStore } = await import("@/store/themeStore");
    await useThemeStore.persist.rehydrate();
    const state = useThemeStore.getState() as Record<string, unknown>;
    expect(state.theme).toBe("dark");
    expect("colorTheme" in state).toBe(false);
    expect("customColor" in state).toBe(false);
    expect("setColorTheme" in state).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe("");
  });

  it("toggleTheme flips dark ↔ light and persists only the theme", async () => {
    const { default: useThemeStore } = await import("@/store/themeStore");
    useThemeStore.getState().setTheme("light");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
    expect(JSON.parse(localStorage.getItem("theme")!).state).toEqual({ theme: "dark" });
  });
});
