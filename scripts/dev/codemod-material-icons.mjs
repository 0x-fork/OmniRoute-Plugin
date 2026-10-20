#!/usr/bin/env node
// Codemod: <span className="material-symbols-outlined ..." ...>name</span>  →  <Icon name="name" ... />
// Só converte o padrão simples (className como string literal). Spans com className dinâmico
// (cn(...), template) ou com style={} ficam para conversão manual e são listados em `leftovers`.
// `title="…"` vira `ariaLabel` (role="img" + aria-label); o tooltip de hover some — o lote
// recoloca `title` no wrapper quando o tooltip importava.
// `pointer-events-none` (e `shrink-0`) é descartado do span porque o adapter já o recoloca.
//   node scripts/dev/codemod-material-icons.mjs src/app/\(dashboard\)/dashboard/health [--write]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SPAN_RE =
  /<span((?:\s+(?:className="[^"]*"|aria-hidden(?:="true"|=\{true\})?|aria-label="[^"]*"|title="[^"]*"))*)\s*>\s*([a-z][a-z0-9_]+|\{[^{}]+\})\s*<\/span>/g;
// No `g` flag: used with .test() only — a global regex keeps lastIndex between files and masks leftovers.
const ANY_MATERIAL_SPAN_RE = /<span[^>]*material-symbols-outlined[^>]*>/;
const IMPORT = 'import Icon from "@/shared/components/Icon";';

export function transformSource(source, file) {
  let converted = 0;
  const code = source.replace(SPAN_RE, (full, attrs, content) => {
    if (!/className="[^"]*material-symbols-outlined[^"]*"/.test(attrs)) return full;
    const cls = /className="([^"]*)"/.exec(attrs)[1].split(/\s+/).filter(Boolean);
    let size;
    const rest = [];
    for (const c of cls) {
      if (c === "material-symbols-outlined" || c === "pointer-events-none" || c === "shrink-0")
        continue;
      const px = /^text-\[(\d+)px\]$/.exec(c);
      if (px) {
        size = px[1];
        continue;
      }
      rest.push(c);
    }
    const ariaLabel = /aria-label="([^"]*)"/.exec(attrs)?.[1];
    const title = /title="([^"]*)"/.exec(attrs)?.[1];
    const name = content.startsWith("{") ? `name=${content}` : `name="${content}"`;
    const props = [name];
    if (size) props.push(`size={${size}}`);
    if (ariaLabel) props.push(`ariaLabel="${ariaLabel}"`);
    else if (title) props.push(`ariaLabel="${title}"`);
    if (rest.length) props.push(`className="${rest.join(" ")}"`);
    converted += 1;
    return `<Icon ${props.join(" ")} />`;
  });
  const leftovers = [];
  if (ANY_MATERIAL_SPAN_RE.test(code)) {
    code.split("\n").forEach((line, i) => {
      if (/<span[^>]*material-symbols-outlined/.test(line)) leftovers.push({ file, line: i + 1 });
    });
  }
  let out = code;
  if (
    converted > 0 &&
    !out.includes(IMPORT) &&
    !/import Icon from ["']@\/shared\/components["']/.test(out)
  ) {
    const useClient = /^"use client";\r?\n/.exec(out);
    const insertAt = useClient ? useClient[0].length : 0;
    out = out.slice(0, insertAt) + (useClient ? "\n" : "") + IMPORT + "\n" + out.slice(insertAt);
  }
  return { code: out, converted, leftovers };
}

function walk(p, out = []) {
  const st = fs.statSync(p);
  if (st.isDirectory())
    for (const e of fs.readdirSync(p)) {
      if (e !== "node_modules" && e !== "__tests__") walk(path.join(p, e), out);
    }
  else if (/\.tsx$/.test(p) && !/\.test\.tsx$/.test(p)) out.push(p);
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const targets = args.filter((a) => !a.startsWith("--"));
  if (!targets.length) {
    console.error("uso: codemod-material-icons.mjs <dir|arquivo>... [--write]");
    process.exit(1);
  }
  let total = 0;
  const allLeft = [];
  for (const file of targets.flatMap((t) => walk(t))) {
    const src = fs.readFileSync(file, "utf8");
    if (!src.includes("material-symbols-outlined")) continue;
    const { code, converted, leftovers } = transformSource(src, file);
    total += converted;
    allLeft.push(...leftovers);
    if (converted && write) fs.writeFileSync(file, code);
    if (converted && !write) console.log(`${file}: ${converted} span(s) convertible`);
  }
  console.log(
    `${write ? "converted" : "would convert"} ${total} span(s); ${allLeft.length} left for manual conversion`
  );
  for (const l of allLeft) console.log(`  manual: ${l.file}:${l.line}`);
  process.exit(allLeft.length ? 2 : 0);
}
