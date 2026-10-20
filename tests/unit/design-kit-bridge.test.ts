import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const css = read("src/app/globals.css");
const block = (selector: string) => {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `globals.css has a "${selector}" block`);
  return css.slice(start, css.indexOf("\n}", start));
};

test("globals.css loads the self-hosted Keak fonts and the vendored kit CSS right after Tailwind", () => {
  const order = [
    '@import "tailwindcss" source(none);',
    // Static weights, not `@fontsource-variable/inter`: the variable package registers the
    // family "Inter Variable", which the kit's `--ci-font-ui: "Inter", …` never matches.
    '@import "@fontsource/inter/400.css";',
    '@import "@fontsource/inter/500.css";',
    '@import "@fontsource/inter/600.css";',
    '@import "@fontsource/inter/700.css";',
    '@import "@fontsource/instrument-serif/400.css";',
    '@import "@fontsource/instrument-serif/400-italic.css";',
    '@import "@fontsource/ibm-plex-mono/400.css";',
    '@import "@fontsource/ibm-plex-mono/500.css";',
    '@import "@fontsource/ibm-plex-mono/600.css";',
    '@import "@fontsource/ibm-plex-mono/700.css";',
    '@import "../../packages/ui-kit/src/ci-ui.css";',
    '@import "material-symbols/outlined.css" layer(base);',
  ].map((needle) => css.indexOf(needle));
  assert.ok(
    order.every((i) => i >= 0),
    `every import is present: ${order}`
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
    "imports keep this order"
  );
  assert.doesNotMatch(css, /fonts\.googleapis\.com/);
  assert.doesNotMatch(css, /@fontsource-variable/);
});

test("the OmniRoute color tokens are aliases of kit tokens (no hex left in :root / .dark)", () => {
  const root = block(":root {\n  --desktop-safe-top");
  const dark = block(".dark {");
  for (const [name, target] of [
    ["--color-bg", "var(--ci-color-background)"],
    ["--color-bg-primary", "var(--ci-color-background)"],
    ["--color-bg-alt", "var(--ci-color-surface-subtle)"],
    ["--color-bg-subtle", "var(--ci-color-surface-subtle)"],
    ["--color-surface", "var(--ci-color-surface)"],
    ["--color-card", "var(--ci-color-surface)"],
    ["--color-sidebar", "var(--ci-color-surface)"],
    ["--surface-2", "var(--ci-color-surface-muted)"],
    ["--color-border", "var(--ci-color-border-subtle)"],
    ["--color-text-main", "var(--ci-color-foreground)"],
    ["--color-text-primary", "var(--ci-color-foreground)"],
    ["--color-text-muted", "var(--ci-color-text-muted)"],
    ["--color-primary", "var(--ci-color-accent)"],
    ["--color-primary-hover", "var(--ci-color-accent-hover)"],
    ["--color-accent", "var(--ci-color-accent)"],
    ["--color-accent-hover", "var(--ci-color-accent-hover)"],
    ["--color-accent-light", "var(--ci-color-accent-surface-strong)"],
    ["--grad-brand", "var(--ci-color-accent)"],
    ["--color-success", "var(--ci-color-success)"],
    ["--color-warning", "var(--ci-color-warning)"],
    ["--color-error", "var(--ci-color-danger)"],
    ["--orch-status-success", "var(--ci-color-success)"],
    ["--orch-status-warning", "var(--ci-color-warning)"],
    ["--orch-status-error", "var(--ci-color-danger)"],
    ["--radius", "var(--ci-radius-surface)"],
    ["--radius-control", "var(--ci-radius-control)"],
    ["--color-fd-background", "var(--ci-color-background)"],
    ["--color-fd-primary", "var(--ci-color-accent)"],
    ["--table-header-bg", "var(--ci-color-surface-muted)"],
    ["--table-cell-border", "var(--ci-color-border-subtle)"],
  ] as const) {
    assert.ok(root.includes(`${name}: ${target};`), `:root maps ${name} → ${target}`);
  }
  assert.doesNotMatch(root, /#[0-9a-fA-F]{3,6}\b/, ":root carries no hex literal");
  assert.doesNotMatch(
    dark,
    /--color-[\w-]+:\s*#[0-9a-fA-F]{3,6}/,
    ".dark redefines no color token with a hex"
  );
  assert.match(dark, /color-scheme:\s*dark/);
});

test("the graph-paper grid, the coral/indigo palette and the macOS font stack are gone", () => {
  assert.doesNotMatch(css, /body::before/);
  assert.doesNotMatch(css, /--grid-line|--grid-size|--section-alt/);
  assert.doesNotMatch(css, /#e54d5e|#6366f1|#8b5cf6/);
  assert.doesNotMatch(css, /"SF Pro Text"/);
  const theme = block("@theme inline {");
  assert.match(theme, /--font-sans:\s*var\(--ci-font-ui\);/);
  assert.match(theme, /--font-mono:\s*var\(--ci-font-mono\);/);
  assert.match(theme, /--font-display:\s*var\(--ci-font-display\);/);
  for (const t of [
    "--color-success-bg",
    "--color-warning-bg",
    "--color-error-bg",
    "--color-info",
    "--color-info-bg",
    "--color-chart-1",
    "--color-chart-5",
  ]) {
    assert.ok(theme.includes(`${t}:`), `@theme inline exposes ${t}`);
  }
});

test("focus ring lives in @layer base so kit controls keep their own focus styles", () => {
  // An OUTLINE, not a box-shadow: Tailwind `shadow-*` utilities (layer utilities) would win
  // the box-shadow cascade over @layer base and leave legacy buttons without any focus cue.
  assert.match(
    css,
    /@layer base \{[\s\S]*?:focus-visible \{\s*outline: 2px solid var\(--ci-color-focus-ring\);\s*outline-offset: 2px;/
  );
  // the generic rule (bare `:focus-visible`, not `.focus-ring:focus-visible`) no longer pairs
  // `outline: none` with a box-shadow
  assert.doesNotMatch(
    css,
    /\n\s*:focus-visible \{\s*outline: none;\s*box-shadow: var\(--focus-ring\)/
  );
  assert.match(
    css,
    /\.focus-ring:focus-visible \{\s*outline: none;\s*box-shadow: var\(--focus-ring\);/
  );
  assert.match(css, /:focus:not\(:focus-visible\) \{\s*outline: none;/);
  assert.match(
    css,
    /--focus-ring:\s*0 0 0 2px var\(--ci-color-background\), 0 0 0 4px var\(--ci-color-focus-ring\);/
  );
});

test("phone-only heading/button rules leave kit elements alone (spike conflicts #7/#8)", () => {
  // Same `@layer components` as the kit; without the guard, source order would let these
  // truncate a kit PageHeader title or stretch kit buttons on phones.
  assert.match(css, /main :is\(h1, h2\):not\(\[class\*="ci-"\]\)/);
  assert.match(css, /> button:not\(\[class\*="ci-"\]\)/);
  assert.doesNotMatch(css, /main :is\(h1, h2\) \{/);
});

test("adapter extension classes exist for the Button warning variant and Badge tones", () => {
  assert.match(css, /\.ci-button--warning \{/);
  for (const tone of ["success", "warning", "danger", "info", "primary"]) {
    assert.match(css, new RegExp(`\\.ci-badge\\[data-tone="${tone}"\\]`), `badge tone ${tone}`);
  }
});

test("no class literal pairs a solid bg-accent/bg-primary with text-white (lime needs dark ink)", () => {
  // `--color-accent` / `--color-primary` are the kit's lime (#d8ff00): white on it is ~1.1:1.
  // Solid token = `bg-accent` / `bg-primary` followed by whitespace, a quote or the end —
  // `bg-accent/10`, `bg-accent-light`, `bg-primary/20` are tints and stay out of scope.
  const SOLID = /(?<![\w/:-])bg-(?:accent|primary)(?=[\s"'`]|$)/;
  const WHITE = /(?<![\w/:-])text-white(?=[\s"'`]|$)/;
  const LITERAL = /"[^"]*"|'[^'\n]*'|`[^`]*`/g;
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx")) {
        const src = fs.readFileSync(full, "utf8");
        for (const m of src.matchAll(LITERAL)) {
          if (SOLID.test(m[0]) && WHITE.test(m[0])) {
            const line = src.slice(0, m.index).split("\n").length;
            offenders.push(`${path.relative(ROOT, full)}:${line}`);
          }
        }
      }
    }
  };
  walk(path.join(ROOT, "src"));
  assert.deepEqual(offenders, [], `solid accent surface with white ink:\n${offenders.join("\n")}`);
});

test("<html> opts into the kit theme surface", () => {
  assert.match(read("src/app/layout.tsx"), /<html[^>]*className="ci-theme"/);
});

// Guards kept from design-grid-background.test.ts that are still true after the bridge
// (they protect files this task does not touch).
test("flow surfaces still express state with --orch-status-* tokens, not fixed hex", () => {
  const combo = read("src/app/(dashboard)/dashboard/combos/live/ComboLiveStudio.tsx");
  const engine = read("src/app/(dashboard)/dashboard/compression/studio/nodes/EngineNode.tsx");
  const edges = read("src/shared/components/flow/edgeStyles.ts");
  const badge = read("src/shared/components/TokenHealthBadge.tsx");
  for (const [name, src] of Object.entries({ combo, engine, edges, badge })) {
    assert.ok(src.includes("var(--orch-status-"), `${name} reads the status tokens`);
  }
  // EngineNode keeps the categorical LAYER_COLORS palette (hex by design); its state colors
  // are the tokens above, so the forbidden literal there is the old warning hex.
  for (const [name, src] of Object.entries({ combo, edges, badge })) {
    assert.ok(!src.includes('"#22c55e"'), `${name} hardcodes no success hex`);
  }
  assert.ok(!engine.includes('"#f59e0b"'), "engine hardcodes no warning hex");
});

// ── Guards carried verbatim in spirit from design-grid-background.test.ts (383c5dc5d479) that
// stay true after the bridge; the grid/14px/gradient/STATUS_HEX ones were obsolete by design.
test("DashboardLayout content shell is fluid up to ~4K before centering", () => {
  const dashboardLayout = read("src/shared/components/layouts/DashboardLayout.tsx");
  assert.ok(
    dashboardLayout.includes("max-w-[3840px] mx-auto"),
    "content wrapper caps at 3840px (4K) and centers only beyond that"
  );
  assert.ok(!dashboardLayout.includes("max-w-7xl"), "the old 1280px max-w-7xl cap is gone");
});

test("DataTable is theme-aware via --table-* tokens, no color literal, no dead fallbacks", () => {
  const dt = read("src/shared/components/DataTable.tsx");
  assert.ok(dt.includes("var(--table-header-bg)"), "header uses the token");
  assert.ok(dt.includes("var(--table-row-zebra)"), "zebra uses the token");
  assert.ok(dt.includes("var(--color-border)"), "header border uses the brand token");
  assert.ok(!/rgba\(|#[0-9a-fA-F]{3,6}/.test(dt), "DataTable hardcodes no color literal");
  assert.ok(
    !dt.includes("--text-secondary") && !dt.includes("--bg-table-header"),
    "the dead var fallbacks are gone"
  );
});

test("every flow surface expresses state with --orch-status-* tokens; categorical palettes stay", () => {
  const combo = read("src/app/(dashboard)/dashboard/combos/live/ComboLiveStudio.tsx");
  const engine = read("src/app/(dashboard)/dashboard/compression/studio/nodes/EngineNode.tsx");
  const waterfall = read("src/app/(dashboard)/dashboard/compression/studio/WaterfallInspector.tsx");
  const cockpit = read("src/app/(dashboard)/dashboard/compression/studio/CompressionCockpit.tsx");
  const io = read("src/app/(dashboard)/dashboard/compression/studio/nodes/IoNode.tsx");
  const strategy = read("src/app/(dashboard)/dashboard/combos/live/nodes/StrategyNode.tsx");

  // Combo live studio: active/error provider pills + the run outcome tri-state.
  assert.ok(combo.includes("FLOW_EDGE_COLORS.active"), "combo active pill uses the flow palette");
  assert.ok(combo.includes("FLOW_EDGE_COLORS.error"), "combo error pill uses the flow palette");
  assert.ok(combo.includes('"var(--orch-status-success)"'), "combo succeeded = success token");
  assert.ok(combo.includes('"var(--orch-status-error)"'), "combo exhausted = error token");
  assert.ok(combo.includes('"var(--orch-status-warning)"'), "combo pending = warning token");
  assert.ok(!combo.includes('"#ef4444"'), "combo studio hardcodes no error hex");
  assert.ok(!combo.includes('"#f59e0b"'), "combo studio hardcodes no warning hex");

  // Compression engine node: savings ramp + the running state.
  assert.ok(engine.includes('"var(--orch-status-success)"'), "engine savings>=30 = success token");
  assert.ok(
    engine.includes('"var(--orch-status-warning)"'),
    "engine savings>=15 / running = warning"
  );
  assert.ok(engine.includes('"var(--orch-status-muted)"'), "engine no-savings = muted token");
  assert.ok(
    engine.includes("flowColorAlpha("),
    "engine glow uses color-mix, not a hex alpha suffix"
  );
  assert.ok(!engine.includes("#f59e0b40"), "the 8-bit alpha suffix is gone (invalid on a var())");

  // Waterfall inspector: same ramp + the skipped/idle state + the total savings.
  assert.ok(waterfall.includes('"var(--orch-status-success)"'), "waterfall success token");
  assert.ok(waterfall.includes('"var(--orch-status-warning)"'), "waterfall warning token");
  assert.ok(waterfall.includes('"var(--orch-status-muted)"'), "waterfall skipped = muted token");
  assert.ok(!waterfall.includes('"#22c55e"'), "waterfall hardcodes no success hex");
  assert.ok(!waterfall.includes('"#6b7280"'), "waterfall hardcodes no muted hex");

  // Cockpit header + IoNode savings readout.
  assert.ok(cockpit.includes('"var(--orch-status-success)"'), "cockpit savings = success token");
  assert.ok(!cockpit.includes('"#22c55e"'), "cockpit hardcodes no success hex");
  assert.ok(io.includes('"var(--orch-status-success)"'), "IoNode savings = success token");

  // Deliberately NOT migrated — categorical/brand palettes, not state.
  assert.ok(strategy.includes("STRATEGY_COLORS"), "strategy hues stay a categorical palette");
  assert.ok(engine.includes("LAYER_COLORS"), "layer pills stay a categorical palette");
  assert.ok(
    io.includes('isInput ? "#6366f1" : "#22c55e"'),
    "IoNode keeps its indigo/green input-output identity pair"
  );
});

test("@theme inline still exposes bg-surface-2 and rounded-card", () => {
  const theme = block("@theme inline {");
  assert.match(theme, /--color-surface-2:\s*var\(--surface-2\);/);
  assert.match(theme, /--radius-card:\s*var\(--radius\);/);
});

test("cn() still dedupes via tailwind-merge and DataTable paints an opaque surface", () => {
  assert.match(read("src/shared/utils/cn.ts"), /twMerge\(clsx\(/);
  assert.ok(read("src/shared/components/DataTable.tsx").includes("var(--color-surface)"));
});
