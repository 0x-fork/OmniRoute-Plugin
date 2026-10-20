import test from "node:test";
import assert from "node:assert/strict";
import { transformSource } from "../../scripts/dev/codemod-material-icons.mjs";

test("static ligature span becomes <Icon name> with size from text-[Npx] and a11y preserved", () => {
  const input = `export function A() {\n  return <span className="material-symbols-outlined text-[16px] text-text-muted" aria-hidden="true">search</span>;\n}\n`;
  const { code, converted, leftovers } = transformSource(input, "A.tsx");
  assert.equal(converted, 1);
  assert.deepEqual(leftovers, []);
  assert.match(code, /import Icon from "@\/shared\/components\/Icon";/);
  assert.match(code, /<Icon name="search" size=\{16\} className="text-text-muted" \/>/);
  assert.doesNotMatch(code, /material-symbols-outlined/);
});

test("aria-label becomes ariaLabel; dynamic content becomes name={expr}; existing import is reused", () => {
  const input = `import Icon from "@/shared/components/Icon";\nconst x = <span aria-label="Close" className="material-symbols-outlined">close</span>;\nconst y = <span className="material-symbols-outlined text-[20px]">{item.icon}</span>;\n`;
  const { code, converted } = transformSource(input, "B.tsx");
  assert.equal(converted, 2);
  assert.equal(code.match(/import Icon from/g)!.length, 1);
  assert.match(code, /<Icon name="close" ariaLabel="Close" \/>/);
  assert.match(code, /<Icon name=\{item\.icon\} size=\{20\} \/>/);
});

test("a span the codemod cannot parse is reported, not mangled", () => {
  const input = `const z = <span className={cn("material-symbols-outlined", active && "fill-1")} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>;\n`;
  const { code, converted, leftovers } = transformSource(input, "C.tsx");
  assert.equal(converted, 0);
  assert.equal(code, input);
  assert.deepEqual(leftovers, [{ file: "C.tsx", line: 1 }]);
});

test("leftover detection does not leak regex state between files", () => {
  // A long first file whose manual span sits far into the text, then a short second file whose
  // manual span sits before that offset — a global regex `.test()` would miss the second one.
  const first = `${"const pad = 1;\n".repeat(40)}const a = <span className={cn("material-symbols-outlined", x)}>{icon}</span>;\n`;
  const second = `const b = <span className={cn("material-symbols-outlined", y)}>{icon}</span>;\n`;
  const one = transformSource(first, "first.tsx");
  const two = transformSource(second, "second.tsx");
  assert.equal(one.leftovers.length, 1);
  assert.equal(two.leftovers.length, 1);
  assert.deepEqual(two.leftovers, [{ file: "second.tsx", line: 1 }]);
});
