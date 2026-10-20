import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Pure-Node scan instead of `grep -rl`: grep exits 1 when nothing matches, which makes
// execFileSync throw on exactly the passing case.
function filesContaining(dir: string, needle: string): string[] {
  const hits: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) hits.push(...filesContaining(full, needle));
    else if (
      /\.(js|css|html|json|map)$/.test(entry.name) &&
      fs.readFileSync(full, "utf8").includes(needle)
    ) {
      hits.push(path.relative(ROOT, full));
    }
  }
  return hits;
}

test(
  "a basePath build references no absolute /brand/ asset and bundles the fonts",
  { skip: !process.env.RUN_BUILD_TESTS && "set RUN_BUILD_TESTS=1" },
  () => {
    execFileSync("npm", ["run", "build"], {
      cwd: ROOT,
      env: { ...process.env, OMNIROUTE_BASE_PATH: "/omni" },
      stdio: "inherit",
      timeout: 2_400_000,
    });
    const out = path.join(ROOT, ".build", "next", "static");
    const hits = filesContaining(out, '"/brand/');
    assert.deepEqual(hits, [], `absolute /brand/ references found:\n${hits.join("\n")}`);
    const fonts = fs
      .readdirSync(path.join(out, "media"))
      .filter((f) => /inter|instrument|plex/i.test(f));
    assert.ok(
      fonts.length >= 3,
      `expected the three font families in static/media, got ${fonts.join(", ")}`
    );
  }
);
