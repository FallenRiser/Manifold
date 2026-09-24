// Curriculum inventory — the mechanical half of docs/depth-audit.md.
//
// Parses every src/lib/*Track.ts outline, resolves each page href to its page.tsx, and counts what
// is actually on the page: prose words (JSX text + long prop strings; template literals, i.e. code
// samples, excluded), imported labs and figures, inline <svg>, CodeBlock, CodeOutput, Proof,
// Callout, PredictPrompt, Quiz, MathBlock.
//
// NOTE on the word count: prose reaches pages two ways — as JSX text and as long string props
// (body="...", intro="..."). Counting only the first undercounts card-style pages badly (the linear
// regression failure gallery reads as 33 words instead of ~400). Both are counted here.
//
//   node scripts/inventory.js     ->  results/inventory.json
//
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const LIB = path.join(ROOT, 'src/lib');
const trackFiles = fs.readdirSync(LIB).filter(f => /Track\.ts$/.test(f));
const out = [];
for (const tf of trackFiles) {
  const src = fs.readFileSync(path.join(LIB, tf), 'utf8');
  const chapters = [];
  const chapRe = /\{\s*title:\s*"([^"]+)",\s*(?:tier:\s*(\d)\s*,\s*)?pages:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;
  let m;
  while ((m = chapRe.exec(src))) {
    const [, title, tier, body] = m;
    const pages = [];
    const pRe = /\{\s*title:\s*"([^"]+)"(?:,\s*href:\s*"([^"]+)")?\s*\}/g;
    let p;
    while ((p = pRe.exec(body))) pages.push({ title: p[1], href: p[2] });
    chapters.push({ title, tier: tier ? +tier : null, pages });
  }
  out.push({ file: tf, chapters });
}
function pageFile(href) {
  const c = path.join(ROOT, 'src/app', href, 'page.tsx');
  return fs.existsSync(c) ? c : null;
}
function analyze(fp) {
  const s = fs.readFileSync(fp, 'utf8');
  const imports = [...s.matchAll(/import\s+\{([^}]*)\}\s+from\s+"([^"]+)"/g)]
    .flatMap(m => m[1].split(',').map(x => x.trim()).map(n => ({ n, from: m[2] })))
    // default imports too: `import Foo from "@/components/labs/Foo"`
    .concat([...s.matchAll(/import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+"([^"]+)"/g)]
      .map(m => ({ n: m[1], from: m[2] })))
    // `X as Y` — Y is what the JSX actually renders
    .map(i => ({ ...i, n: i.n.split(/\s+as\s+/).pop().trim() }))
    .filter(i => i.n);
  // capstone/pedagogy holds DecisionPoint and GuessSlider: prompts, not pictures. A page
  // carrying only those still has nothing to look at, and counting them as figures is what
  // made the asteroid capstone read as 0 pages without a visual when 15 of its 24 have none.
  const isFig = (i) => /components\/(figures|capstone)\//.test(i.from) && !/capstone\/pedagogy/.test(i.from);
  const isLab = (i) => /components\/(labs|fire|sail|boss)\//.test(i.from) || /Lab$/.test(i.n);
  // An import is not a visual until it is rendered. Strip the import block, then require the tag.
  const body = s.replace(/^import[\s\S]*?from\s+"[^"]+";?$/gm, '');
  const rendered = (i) => new RegExp('<' + i.n + '(?![A-Za-z0-9_])').test(body);
  const labs = imports.filter(i => isLab(i) && rendered(i)).map(i => i.n);
  const figs = imports.filter(i => isFig(i) && rendered(i)).map(i => i.n);
  const noCode = s.replace(/`[\s\S]*?`/g, ' ');
  const jsxText = (noCode.match(/>[^<>{}]{3,}</g) || []).join(' ');
  const propText = (noCode.match(/"[^"\n]{45,}"/g) || [])
    .filter(x => / [a-z]+ [a-z]+ /.test(x) && !/^"(https?:|\/|@\/|#|var\()/.test(x))
    .join(' ');
  const words = ((jsxText + ' ' + propText).replace(/[<>]/g, ' ').match(/[A-Za-z][A-Za-z'\u2019-]+/g) || []).length;
  const count = (re) => (s.match(re) || []).length;
  return {
    bytes: s.length, words,
    labs: [...new Set(labs)], figs: [...new Set(figs)],
    code: count(/<CodeBlock/g), codeOut: count(/<CodeOutput/g),
    // standalone measured panels: <CodeOutput source="..."> with no code on the page.
    // A codeOut that is neither attached nor sourced is the defect scripts/check-pages.js R1 catches.
    codeOutSrc: count(/<CodeOutput source=/g), proof: count(/<Proof/g),
    callout: count(/<Callout/g), predict: count(/<PredictPrompt/g), quiz: count(/<Quiz/g),
    term: count(/<Term/g), svg: count(/<svg/g), math: count(/<(MathBlock|M)\b/g),
  };
}
const rows = [];
for (const t of out) for (const ch of t.chapters) for (const pg of ch.pages) {
  const fp = pg.href ? pageFile(pg.href) : null;
  const a = fp ? analyze(fp) : null;
  rows.push({ track: t.file.replace(/Track\.ts$/, ''), chapter: ch.title, tier: ch.tier, page: pg.title, href: pg.href || '', built: !!fp, ...(a || {}) });
}
fs.writeFileSync(path.join(ROOT, 'results', 'inventory.json'), JSON.stringify(rows, null, 1));
console.log('rows', rows.length, 'built', rows.filter(r => r.built).length);
