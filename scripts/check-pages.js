// House-rules linter for lesson pages.  `node scripts/check-pages.js`
//
// Enforces the invariants that the depth audit (docs/depth-audit.md §0.3) found
// broken across the site.  Each rule below is here because it was violated in
// production, not because it sounded good.
//
//   R1  A <CodeOutput> with no <CodeBlock> on the page must carry source="...".
//       The attached form is styled to join the code block above it (negative
//       top margin, no top border), so alone it renders detached — and it
//       publishes a number whose code the reader cannot see.
//   R2  Every source="..." must point at a file that actually exists.  This is
//       house rule #1 (every number is reproduced by something in the repo)
//       turned from a promise into a check.
//
// Exit 0 = clean.  Exit 1 = violations, listed.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "src", "app");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === "page.tsx") out.push(p);
  }
  return out;
}

const violations = [];
const pages = walk(APP);

for (const file of pages) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const hasCodeBlock = /<CodeBlock[\s>]/.test(src);

  // Every <CodeOutput ...> opening tag on the page.
  for (const m of src.matchAll(/<CodeOutput(\s[^>]*)?>/g)) {
    const attrs = m[1] || "";
    const srcAttr = /\ssource="([^"]+)"/.exec(attrs);
    const line = src.slice(0, m.index).split("\n").length;

    if (!srcAttr && !hasCodeBlock) {
      violations.push(
        `R1  ${rel}:${line}  <CodeOutput> with no <CodeBlock> on the page — ` +
          `add source="scripts/....py" naming what produced these numbers.`
      );
    }
    if (srcAttr && !fs.existsSync(path.join(ROOT, srcAttr[1]))) {
      violations.push(`R2  ${rel}:${line}  source="${srcAttr[1]}" does not exist in the repo.`);
    }
  }
}

console.log(`checked ${pages.length} pages`);
if (violations.length === 0) {
  console.log("clean — no house-rule violations.");
  process.exit(0);
}
for (const v of violations) console.log("  " + v);
console.log(`\n${violations.length} violation(s).`);
process.exit(1);
