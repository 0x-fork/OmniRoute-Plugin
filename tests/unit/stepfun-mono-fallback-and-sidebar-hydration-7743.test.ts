import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Regression guards for PR #7743:
//  1) @lobehub/icons v5.13+ dropped the Stepfun `Color` sub-component. Importing it
//     causes a build-time module-not-found error that breaks the whole dashboard.
//     Lock in the Mono fallback so a future bump can't silently re-import it.
//  2) DashboardLayout must not read localStorage synchronously during the initial
//     `useState` render — that produces a client/server markup mismatch (hydration
//     error) because the server always renders the `false` (collapsed=false) branch.
//     The fix defers the localStorage read to a `useEffect`.

const lobeProviderIconsSrc = fs.readFileSync(
  new URL("../../src/shared/components/lobeProviderIcons.ts", import.meta.url),
  "utf8"
);

// The localStorage-backed collapse state belongs to the legacy shell (UI_KIT_SHELL=false) since
// trilha F; the kit shell's collapse state comes from the `ci_sidebar_state` cookie read on the
// server, so its first client render matches the server markup by construction (tests below).
const dashboardLayoutSrc = fs.readFileSync(
  new URL("../../src/shared/components/layouts/legacy/DashboardLayoutLegacy.tsx", import.meta.url),
  "utf8"
);
const readSrc = (relative: string) =>
  fs.readFileSync(new URL(`../../${relative}`, import.meta.url), "utf8");

test("lobeProviderIcons never imports the removed Stepfun Color sub-component", () => {
  assert.doesNotMatch(
    lobeProviderIconsSrc,
    /@lobehub\/icons\/es\/Stepfun\/components\/Color/,
    "Stepfun/components/Color does not exist in @lobehub/icons v5.13+ and must not be imported"
  );
});

test("lobeProviderIcons maps both Stepfun mono and color slots to StepfunMonoIcon", () => {
  const stepfunEntry = lobeProviderIconsSrc.match(
    /Stepfun:\s*{\s*mono:\s*(\w+),\s*color:\s*(\w+)\s*}/
  );
  assert.ok(stepfunEntry, "Stepfun entry must exist in LOBE_ICON_COMPONENTS");
  const [, mono, color] = stepfunEntry;
  assert.equal(mono, "StepfunMonoIcon");
  assert.equal(color, "StepfunMonoIcon", "color slot must fall back to the Mono icon");
});

test("DashboardLayout does not read localStorage synchronously inside the collapsed useState initializer", () => {
  const collapsedStateMatch = dashboardLayoutSrc.match(
    /const \[collapsed, setCollapsed\] = useState\(([^)]*)\)/
  );
  assert.ok(collapsedStateMatch, "collapsed useState declaration must exist");
  assert.equal(
    collapsedStateMatch[1].trim(),
    "false",
    "collapsed must initialize to a constant so server and first client render match (no hydration mismatch)"
  );
});

test("the kit shell reads no localStorage for the collapse state; the server passes the cookie", () => {
  for (const file of [
    "src/shared/components/layouts/DashboardShell.tsx",
    "src/shared/components/layouts/DashboardLayout.tsx",
  ]) {
    assert.doesNotMatch(readSrc(file), /localStorage/, `${file} must not read localStorage`);
  }
  const serverLayout = readSrc("src/app/(dashboard)/layout.tsx");
  assert.match(serverLayout, /\(await cookies\(\)\)\.get\("ci_sidebar_state"\)\?\.value !== "0"/);
  assert.match(serverLayout, /sidebarDefaultOpen=\{sidebarDefaultOpen\}/);
  assert.match(
    readSrc("src/shared/components/layouts/DashboardShell.tsx"),
    /<SidebarProvider[\s\S]*?defaultOpen=\{sidebarDefaultOpen\}/
  );
});

test("DashboardLayout defers the sidebar-collapsed localStorage read to a useEffect", () => {
  const effectIndex = dashboardLayoutSrc.indexOf("useEffect(() => {");
  assert.ok(effectIndex >= 0, "a useEffect must exist");
  const effectBody = dashboardLayoutSrc.slice(
    effectIndex,
    dashboardLayoutSrc.indexOf("}, []);", effectIndex)
  );
  assert.match(effectBody, /localStorage\.getItem\(SIDEBAR_COLLAPSED_KEY\)/);
  assert.match(effectBody, /setCollapsed\(true\)/);
});
