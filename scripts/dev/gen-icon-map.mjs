#!/usr/bin/env node
// Lista os nomes Material Symbols em uso (ligaduras, props icon=/iconRight=/emptyIcon= e
// `icon: "..."` em constantes) e imprime um esqueleto de ICON_MAP para preencher à mão.
//   node scripts/dev/gen-icon-map.mjs           # esqueleto TS com os nomes que faltam no mapa atual
//   node scripts/dev/gen-icon-map.mjs --names   # só os nomes, um por linha (usado pelo teste de cobertura)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIRS = ["src/app", "src/shared"];
const PATTERNS = [
  /material-symbols-outlined[^>]*>\s*([a-z][a-z0-9_]+)\s*</g, // <span className="material-symbols-outlined">name</span>
  /\b(?:icon|iconRight|emptyIcon|leadingIcon)=\"([a-z][a-z0-9_]+)\"/g, // prop icon="name"
  /\bicon:\s*\"([a-z][a-z0-9_]+)\"/g, // { icon: "name" } (sidebar sections, tabs)
  /\?\s*\"([a-z][a-z0-9_]+)\"\s*:\s*\"([a-z][a-z0-9_]+)\"/g, // cond ? "a" : "b" inside an icon slot
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!/node_modules|__tests__/.test(e.name)) walk(p, out);
    } else if (/\.(tsx?|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
}

export function collectNames(root = ROOT) {
  const names = new Set();
  for (const dir of DIRS)
    for (const file of walk(path.join(root, dir))) {
      const text = fs.readFileSync(file, "utf8");
      if (!/material-symbols-outlined|icon[:=]/.test(text)) continue;
      for (const re of PATTERNS)
        for (const m of text.matchAll(re)) for (const g of m.slice(1)) if (g) names.add(g);
    }
  return [...names].sort();
}

function existingMap() {
  const file = path.join(ROOT, "src/shared/constants/iconMap.ts");
  if (!fs.existsSync(file)) return new Set();
  return new Set(
    [...fs.readFileSync(file, "utf8").matchAll(/^\s+"?([a-z][a-z0-9_]+)"?:\s/gm)].map((m) => m[1])
  );
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const names = collectNames();
  if (process.argv.includes("--names")) {
    console.log(names.join("\n"));
    process.exit(0);
  }
  const have = existingMap();
  const missing = names.filter((n) => !have.has(n));
  console.log(
    `// ${names.length} Material names in use; ${missing.length} missing from ICON_MAP. Paste into iconMap.ts and replace null with a Lucide import.`
  );
  for (const n of missing) console.log(`  ${n}: null,`);
}
