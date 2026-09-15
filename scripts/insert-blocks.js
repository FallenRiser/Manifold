// Content-pass helper: splice JSX blocks into lesson pages from a spec file.
//
//   node scripts/insert-blocks.js <spec.json>
//
// A spec is a list of edits:
//   { file, imports: [...], after?: "substring", before?: "substring",
//     replaceFrom?: "substring", replaceTo?: "substring", block: "...jsx..." }
//
// Exactly one of `after`, `before` or the replaceFrom/replaceTo pair positions
// the block. Anchors are matched as plain substrings and must be unique — the
// script refuses ambiguous or missing anchors rather than guessing, because a
// silent mis-splice in a 200-line page is very hard to see afterwards.
//
// Imports are appended after the last existing top-level import, skipped if
// already present. Idempotent: an edit whose block is already in the file is a
// no-op, so re-running a spec is safe.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

let changed = 0, skipped = 0;
const problems = [];

function unique(src, anchor, label, file) {
  const first = src.indexOf(anchor);
  if (first < 0) { problems.push(`${file}: ${label} anchor not found: ${JSON.stringify(anchor.slice(0, 60))}`); return -1; }
  if (src.indexOf(anchor, first + 1) >= 0) { problems.push(`${file}: ${label} anchor is not unique: ${JSON.stringify(anchor.slice(0, 60))}`); return -1; }
  return first;
}

for (const e of spec) {
  const file = path.join(ROOT, e.file);
  if (!fs.existsSync(file)) { problems.push(`${e.file}: no such file`); continue; }
  const raw = fs.readFileSync(file, "utf8");
  // Pages in this repo are CRLF. Work in LF so anchors written with \n match,
  // and restore the file's own ending on write.
  const crlf = raw.includes("\r\n");
  let src = crlf ? raw.replace(/\r\n/g, "\n") : raw;

  // Idempotency: a distinctive line from the block, not its first line — blocks
  // routinely open with <p>, which every page already contains.
  const marker = e.id || e.block.split("\n").map((l) => l.trim()).sort((a, b) => b.length - a.length)[0];
  if (marker && marker.length > 24 && src.includes(marker)) { skipped++; continue; }

  if (e.replaceFrom) {
    const a = unique(src, e.replaceFrom, "replaceFrom", e.file);
    const b = unique(src, e.replaceTo, "replaceTo", e.file);
    if (a < 0 || b < 0) continue;
    src = src.slice(0, a) + e.block + src.slice(b + e.replaceTo.length);
  } else if (e.after) {
    const a = unique(src, e.after, "after", e.file);
    if (a < 0) continue;
    src = src.slice(0, a + e.after.length) + "\n" + e.block + src.slice(a + e.after.length);
  } else if (e.before) {
    const a = unique(src, e.before, "before", e.file);
    if (a < 0) continue;
    src = src.slice(0, a) + e.block + "\n" + src.slice(a);
  } else {
    problems.push(`${e.file}: edit has no anchor`);
    continue;
  }

  for (const imp of e.imports || []) {
    if (src.includes(imp)) continue;
    const lines = src.split("\n");
    let last = -1;
    for (let i = 0; i < lines.length; i++) if (/^import /.test(lines[i])) last = i;
    if (last < 0) { problems.push(`${e.file}: no import block`); continue; }
    lines.splice(last + 1, 0, imp);
    src = lines.join("\n");
  }

  fs.writeFileSync(file, crlf ? src.replace(/\n/g, "\r\n") : src);
  changed++;
}

console.log(`${changed} file(s) edited, ${skipped} already up to date`);
if (problems.length) {
  for (const p of problems) console.log("  ! " + p);
  process.exit(1);
}
