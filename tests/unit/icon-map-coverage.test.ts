import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

test("every Material Symbols name used in src/ has an entry in ICON_MAP (Lucide or explicit null)", async () => {
  const out = execFileSync(process.execPath, ["scripts/dev/gen-icon-map.mjs", "--names"], {
    cwd: ROOT,
  }).toString();
  const names = out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  assert.ok(
    names.length > 250,
    `the scanner found ${names.length} names; expected the ~330 in use`
  );
  const { ICON_MAP } = await import("../../src/shared/constants/iconMap.ts");
  const missing = names.filter((n) => !(n in ICON_MAP));
  assert.deepEqual(
    missing,
    [],
    `names without an ICON_MAP entry (run: npm run gen:icon-map):\n${missing.join("\n")}`
  );
});

test("the generator never emits a name outside the Material Symbols vocabulary", async () => {
  const { collectNames, loadMaterialNames } = await import("../../scripts/dev/gen-icon-map.mjs");
  const vocabulary = loadMaterialNames(ROOT);
  assert.ok(
    vocabulary.size > 3000,
    `expected the full Material vocabulary, got ${vocabulary.size}`
  );
  const names = collectNames(ROOT);
  assert.ok(!names.includes("true") && !names.includes("anthropic"), "non-icon strings leaked");
  for (const n of names) assert.ok(vocabulary.has(n), `"${n}" is not a Material Symbols name`);
});
