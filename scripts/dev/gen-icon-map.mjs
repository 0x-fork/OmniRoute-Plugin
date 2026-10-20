#!/usr/bin/env node
// Lista os nomes Material Symbols em uso (ligaduras, props icon=/iconRight=/emptyIcon= e
// `icon: "..."` em constantes) e imprime um esqueleto de ICON_MAP para preencher à mão.
// Só nomes do vocabulário real (node_modules/material-symbols/index.d.ts) são emitidos — strings
// de aparência parecida (`true`, `asc`, `amber`, `anthropic`…) nunca entram no mapa.
//   node scripts/dev/gen-icon-map.mjs           # esqueleto TS com os nomes que faltam no mapa atual
//   node scripts/dev/gen-icon-map.mjs --names   # só os nomes, um por linha (usado pelo teste de cobertura)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIRS = ["src/app", "src/shared"];
const PATTERNS = [
  /material-symbols-outlined[^>]*>\s*([a-z][a-z0-9_]+)\s*</g, // <span className="material-symbols-outlined">name</span>
  /\b(?:icon|iconRight|emptyIcon|leadingIcon)=\"([a-z][a-z0-9_]+)\"/g, // prop icon="name"
  /\bicon:\s*\"([a-z][a-z0-9_]+)\"/g, // { icon: "name" } (sidebar sections, tabs)
  /<Icon\b[^>]*\bname=\"([a-z][a-z0-9_]+)\"/g, // <Icon name="name" /> (already converted by the codemod)
];
// Ternários (`cond ? "a" : "b"`) só contam quando estão num slot de ícone: o conteúdo de um span
// material-symbols-outlined ou a expressão de uma prop icon=/iconRight=/emptyIcon=/leadingIcon={…}.
const SLOT_PATTERNS = [
  /material-symbols-outlined[^>]*>([^<]*)</g, // <span className="material-symbols-outlined">{cond ? "a" : "b"}</span>
  /\b(?:icon|iconRight|emptyIcon|leadingIcon)=\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, // icon={cond ? "a" : "b"}
  /<Icon\b[^>]*\bname=\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, // <Icon name={cond ? "a" : "b"} />
];
const TERNARY_RE = /\?\s*\"([a-z][a-z0-9_]+)\"\s*:\s*\"([a-z][a-z0-9_]+)\"/g;
const VOCABULARY_FILE = "node_modules/material-symbols/index.d.ts";
// Pre-Symbols ("Material Icons") names that index.d.ts does not declare but the bundled
// material-symbols-outlined.woff2 still ligates (checked in its GSUB ligature table,
// material-symbols@0.47.0, 2026-10-19). Only the ones in use are listed; add a name here only
// after confirming the font renders it — new code should prefer the canonical Symbols name
// (expand_more → keyboard_arrow_down, push_pin → keep, emoji_events → trophy, …).
export const LEGACY_LIGATURES = [
  "auto_awesome",
  "auto_fix_high",
  "auto_fix_normal",
  "business",
  "cloud_queue",
  "do_not_disturb",
  "emoji_events",
  "error_outline",
  "expand_less",
  "expand_more",
  "file_download",
  "file_upload",
  "generating_tokens",
  "insert_drive_file",
  "push_pin",
  "restore",
  "tips_and_updates",
];

/** The names the installed `material-symbols` package declares (`type MaterialSymbols = ["123", …]`). */
export function loadDtsNames(root = ROOT) {
  const file = path.join(root, VOCABULARY_FILE);
  if (!fs.existsSync(file)) {
    throw new Error(`${VOCABULARY_FILE} not found under ${root} — run npm install first`);
  }
  const text = fs.readFileSync(file, "utf8");
  const start = text.indexOf("type MaterialSymbols = [");
  const end = text.indexOf("];", start);
  if (start < 0 || end < 0) throw new Error(`${VOCABULARY_FILE}: MaterialSymbols tuple not found`);
  return new Set([...text.slice(start, end).matchAll(/"([^"]+)"/g)].map((m) => m[1]));
}

/** The vocabulary the scanner accepts: loadDtsNames() plus LEGACY_LIGATURES. */
export function loadMaterialNames(root = ROOT) {
  const names = loadDtsNames(root);
  for (const n of LEGACY_LIGATURES) names.add(n);
  return names;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!/node_modules|__tests__/.test(e.name)) walk(p, out);
    } else if (/\.(tsx?|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
}

/** Material names used in one source text (sorted, vocabulary-filtered). */
export function collectNamesFromSource(text, vocabulary) {
  const names = new Set();
  const add = (g) => {
    if (g && vocabulary.has(g)) names.add(g);
  };
  if (/material-symbols-outlined|icon[:=]|<Icon\b/.test(text)) {
    for (const re of PATTERNS)
      for (const m of text.matchAll(re)) for (const g of m.slice(1)) add(g);
    for (const re of SLOT_PATTERNS)
      for (const slot of text.matchAll(re))
        for (const m of slot[1].matchAll(TERNARY_RE)) for (const g of m.slice(1)) add(g);
  }
  return [...names].sort();
}

export function collectNames(root = ROOT) {
  const vocabulary = loadMaterialNames(root);
  const names = new Set();
  for (const dir of DIRS)
    for (const file of walk(path.join(root, dir)))
      for (const n of collectNamesFromSource(fs.readFileSync(file, "utf8"), vocabulary))
        names.add(n);
  return [...names].sort();
}

function existingMap() {
  const file = path.join(ROOT, "src/shared/constants/iconMap.ts");
  if (!fs.existsSync(file)) return new Set();
  return new Set(
    [...fs.readFileSync(file, "utf8").matchAll(/^\s+"?([a-z][a-z0-9_]+)"?:\s/gm)].map((m) => m[1])
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
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
