import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("standalone pages use the Keak lockup instead of the gradient hub glyph", () => {
  for (const p of [
    "src/app/login/page.tsx",
    "src/shared/components/ErrorPageScaffold.tsx",
    "src/app/status/page.tsx",
    "src/app/maintenance/page.tsx",
    "src/app/offline/page.tsx",
  ]) {
    const src = read(p);
    assert.ok(src.includes("OmniRouteLockup"), `${p} renders OmniRouteLockup`);
    assert.ok(!src.includes("material-symbols-outlined"), `${p} has no Material span left`);
    assert.ok(!/from-primary to-primary-hover/.test(src), `${p} dropped the coral gradient`);
  }
});
