import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FEATURE_FLAG_DEFINITIONS } from "../../src/shared/constants/featureFlagDefinitions.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

test("UI_KIT_SHELL is a runtime boolean flag, default true on the integration branch", () => {
  const def = FEATURE_FLAG_DEFINITIONS.find((d) => d.key === "UI_KIT_SHELL");
  assert.ok(def, "flag defined");
  assert.equal(def.category, "runtime");
  assert.equal(def.type, "boolean");
  assert.equal(def.defaultValue, "true");
  assert.equal(def.requiresRestart, false);
  assert.equal(def.warningLevel, "info");
  assert.equal(def.descriptionI18nKey, "featureFlagUiKitShellDescription");
  for (const locale of ["en", "pt-BR"]) {
    const messages = JSON.parse(
      fs.readFileSync(path.join(ROOT, `src/i18n/messages/${locale}.json`), "utf8")
    );
    assert.equal(
      typeof messages.featureFlagUiKitShellDescription,
      "string",
      `${locale} has the description`
    );
  }
});

test("isUiKitShellEnabled honours the env override (kill switch)", async () => {
  const { isUiKitShellEnabled } = await import("../../src/shared/utils/featureFlags.ts");
  const prev = process.env.UI_KIT_SHELL;
  try {
    delete process.env.UI_KIT_SHELL;
    assert.equal(isUiKitShellEnabled(), true);
    process.env.UI_KIT_SHELL = "false";
    assert.equal(isUiKitShellEnabled(), false);
  } finally {
    if (prev === undefined) delete process.env.UI_KIT_SHELL;
    else process.env.UI_KIT_SHELL = prev;
  }
});

test("isUiKitShellEnabled falls back to the definition default when the flag read throws", async () => {
  const { isUiKitShellEnabled } = await import("../../src/shared/utils/featureFlags.ts");
  const logs: unknown[][] = [];
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    logs.push(args);
  };
  try {
    const result = isUiKitShellEnabled(() => {
      throw new Error("db read failed");
    });
    assert.equal(result, true, "a throwing read must not disable the kit shell nor throw");
    assert.ok(
      logs.some((args) => String(args).includes("Failed to resolve UI_KIT_SHELL")),
      "the failure is logged with the flag key"
    );
  } finally {
    console.error = origError;
  }
});
