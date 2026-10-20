import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

test(
  "a basePath build references no absolute /brand/ asset and bundles the fonts",
  { skip: !process.env.RUN_BUILD_TESTS && "set RUN_BUILD_TESTS=1" },
  () => {
    execFileSync("npm", ["run", "build"], {
      cwd: ROOT,
      env: { ...process.env, OMNIROUTE_BASE_PATH: "/omni" },
      stdio: "inherit",
      timeout: 900_000,
    });
    const out = path.join(ROOT, ".build", "next", "static");
    const hits = execFileSync("grep", ["-rl", '"/brand/', out]).toString().trim();
    assert.equal(hits, "", `absolute /brand/ references found:\n${hits}`);
    const fonts = fs
      .readdirSync(path.join(out, "media"))
      .filter((f) => /inter|instrument|plex/i.test(f));
    assert.ok(
      fonts.length >= 3,
      `expected the three font families in static/media, got ${fonts.join(", ")}`
    );
  }
);
