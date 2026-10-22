import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// F4 whole-tree P6 sweep (KEA-7886). The per-lote greps only covered the files each lote was
// assigned, so leftovers sat in unassigned files (CompressionSettingsTab, MitmProxyTab, shell
// widgets, landing icons). This guard runs the same greps on the whole app tree. Every kept
// exception is listed here with its reason; anything new fails.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const LEGACY = "src/shared/components/layouts/legacy/"; // removed by F4-A (Task 41)

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/node_modules|__tests__/.test(entry.name)) walk(p, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) out.push(p);
  }
  return out;
}

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");
const files = (...dirs: string[]) =>
  dirs.flatMap((d) => walk(path.join(ROOT, d))).filter((f) => !rel(f).startsWith(LEGACY));
const APP = files("src/app", "src/shared/components");
const DASHBOARD = files("src/app/(dashboard)", "src/shared/components");

function countBy(list: string[], re: RegExp): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of list) {
    const n = (fs.readFileSync(f, "utf8").match(re) ?? []).length;
    if (n) out[rel(f)] = n;
  }
  return out;
}

test("no Material Symbols ligature span is left in the app tree", () => {
  const hits = countBy(APP, /material-symbols-outlined/g);
  // Icon.tsx: the unmapped-name fallback branch, removed with the font by F4-A.
  delete hits["src/shared/components/Icon.tsx"];
  assert.deepEqual(hits, {});
});

test("no raw <select>, <textarea> or <table> outside the adapters (dashboard + shared)", () => {
  const hits = countBy(DASHBOARD, /<(select|textarea|table)\b/g);
  // The Select adapter renders the native <select class="ci-select-native"> branch.
  delete hits["src/shared/components/Select.tsx"];
  // Comment-only mentions of "<select>" (no JSX): ModelSelectField, StudioConfigPane.
  for (const f of Object.keys(hits)) {
    const jsx = fs
      .readFileSync(path.join(ROOT, f), "utf8")
      .split("\n")
      .filter((l) => /<(select|textarea|table)\b/.test(l) && !/^\s*(\/\/|\*|\{\/\*)/.test(l));
    if (jsx.length === 0) delete hits[f];
  }
  assert.deepEqual(hits, {});
});

test("every raw <button>/<input> left in the dashboard tree carries its kit-exception comment", () => {
  // Adapters wrap the native element on purpose.
  const ADAPTERS = new Set([
    "src/shared/components/Select.tsx",
    "src/shared/components/Checkbox.tsx",
    "src/shared/components/Collapsible.tsx",
    "src/shared/components/ModelSelectField.tsx",
  ]);
  const unexplained: string[] = [];
  for (const f of DASHBOARD) {
    if (ADAPTERS.has(rel(f))) continue;
    const lines = fs.readFileSync(f, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!/<(button|input)\b/.test(line) || /^\s*(\/\/|\*|\{\/\*)/.test(line)) return;
      const before = lines.slice(Math.max(0, i - 12), i + 1).join("\n");
      if (!/native|kit-exception|raw <button>|hidden|real button/i.test(before))
        unexplained.push(`${rel(f)}:${i + 1}`);
    });
  }
  assert.deepEqual(unexplained, []);
});

test("hard-coded palette hues and dark: variants only where the exception is documented", () => {
  const HUE =
    /\b(?:text|bg|border|ring|from|to|via|fill|stroke|outline|divide|accent|decoration|shadow|placeholder|caret)-(?:red|green|blue|amber|yellow|emerald|rose|slate|gray|zinc|neutral|indigo|violet|purple|orange|cyan|sky|teal|lime|pink|fuchsia|stone)-\d/g;
  // Category legend dots: 13 categories vs 5 chart tokens, shared by three files (lote 2b).
  const HUE_ALLOWED: Record<string, number> = {
    "src/app/(dashboard)/dashboard/providers/components/CategoryDot.tsx": 1,
    "src/app/(dashboard)/dashboard/providers/components/NoAuthProvidersSection.tsx": 1,
    "src/app/(dashboard)/dashboard/providers/components/ProviderCard.tsx": 11,
    "src/app/(dashboard)/dashboard/providers/components/ProviderSummaryCard.tsx": 13,
    "src/app/(dashboard)/dashboard/providers/page.tsx": 17,
  };
  assert.deepEqual(countBy(DASHBOARD, HUE), HUE_ALLOWED);

  const DARK_ALLOWED: Record<string, number> = {
    // Typography plugin colours flip with prose-invert (no kit prose).
    "src/app/(dashboard)/dashboard/agent-skills/components/SkillPreviewPane.tsx": 1,
    // Partner brand inks (Kimi, Cheaper Inference): dark brand hex on a dark surface (lote 2b).
    "src/app/(dashboard)/dashboard/combos/KimiComboPresetCard.tsx": 1,
    "src/app/(dashboard)/dashboard/providers/components/ProviderCard.tsx": 2,
  };
  assert.deepEqual(countBy(DASHBOARD, /(?<=["'`\s])dark:[a-z]/g), DARK_ALLOWED);
});

test("no hand-rolled role=dialog outside the Modal adapter", () => {
  const hits = countBy(DASHBOARD, /role=["{']*dialog/g);
  delete hits["src/shared/components/Modal.tsx"]; // doc comment on the kit DialogContent
  // In-container dialog kept on purpose: pinned tests use window Escape/backdrop (lote 6 #1).
  delete hits["src/shared/components/RequestLoggerDetail.tsx"];
  assert.deepEqual(hits, {});
});
