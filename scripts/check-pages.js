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
//   R3  A page rendering <Worked> or <Practice> must be covered by
//       scripts/math_check.py, which recomputes every published answer
//       independently.  Several hundred hand-written maths answers are the
//       largest source of silently-wrong numbers this site can have: a sign
//       error passes tsc, passes R1 and R2, and passes a careful read.
//   R4  A page with a <LessonHeader> must wrap its body in className="lesson".
//       Every heading, paragraph and list style lives under .lesson in
//       globals.css; without the wrapper the page compiles, renders, and shows
//       every h2 as plain 16px body text. Three SVM pages shipped like that.
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

// R3 setup: which pages scripts/math_check.py says it verifies.  Read out of the
// PAGES map rather than guessed, so adding a page to one and not the other fails.
const CHECKER = path.join(ROOT, "scripts", "math_check.py");
const checkedPages = new Set();
if (fs.existsSync(CHECKER)) {
  const src = fs.readFileSync(CHECKER, "utf8");
  const block = /PAGES\s*=\s*\{([\s\S]*?)\}/.exec(src);
  if (block) for (const m of block[1].matchAll(/"([^"]+page\.tsx)"/g)) checkedPages.add(m[1]);
}

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

  // R3  worked examples and problem sets publish answers; answers must be verified.
  const teaches = /<Worked[\s>]/.test(src) || /<Practice[\s>]/.test(src);
  if (teaches && !checkedPages.has(rel)) {
    violations.push(
      `R3  ${rel}  renders <Worked>/<Practice> but is not listed in scripts/math_check.py's ` +
        `PAGES map — every published answer must be recomputed independently.`
    );
  }

  // R4  the body styles only apply inside .lesson.
  if (/<LessonHeader[\s>]/.test(src) && !/className="lesson[" ]/.test(src)) {
    violations.push(
      `R4  ${rel}  has a <LessonHeader> but no className="lesson" wrapper — its headings, ` +
        `paragraphs and lists will render unstyled.`
    );
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
