// Does MarginVsTruthLab actually demonstrate the effect it is on the page to demonstrate?
//
// The lab exists to show two things: the max-margin boundary lands closer to the truth than the
// perceptron's, and the size of that advantage is governed by the clear band between the classes.
// Neither is guaranteed by the code compiling. A change to the sampler, the perceptron's
// iteration cap or the sweep resolution could quietly flatten the effect, and the lab would go on
// drawing two confident lines that no longer make the point -- which has happened on this project
// before, in labs whose numbers nobody checked after the fact.
//
// So this runs the lab's own functions over many samples and asserts the effect survives.
//
//     node scripts/svm_truthlab_check.mjs
import {
  angleBetween, maxMarginFit, perceptronFit, sampleWithBand,
} from "../src/components/labs/svmSolver.ts";

const SEEDS = 150;

function trial(n, band) {
  let mm = 0;
  let pc = 0;
  let closer = 0;
  let used = 0;
  for (let s = 1; s <= SEEDS; s++) {
    const { wt, pts } = sampleWithBand(s, n, band, 3);
    const pos = pts.filter((p) => p.y === 1).length;
    if (pos === 0 || pos === pts.length) continue;
    const a = maxMarginFit(pts);
    const b = perceptronFit(pts);
    if (!a || Math.hypot(b.w[0], b.w[1]) === 0) continue;
    const ea = angleBetween(a.w, wt);
    const eb = angleBetween(b.w, wt);
    mm += ea;
    pc += eb;
    closer += ea < eb ? 1 : 0;
    used++;
  }
  return { mm: mm / used, pc: pc / used, closer: (100 * closer) / used, used };
}

console.log(`\n  ${SEEDS} samples per row, angles in degrees from the true boundary.\n`);
console.log(`  ${"n".padStart(4)}${"band".padStart(7)}${"max-margin".padStart(13)}`
  + `${"perceptron".padStart(13)}${"mm closer".padStart(12)}`);

const rows = [];
for (const [n, band] of [[12, 0.6], [24, 0.6], [48, 0.6], [24, 0.1], [24, 0.6], [24, 1.6]]) {
  const r = trial(n, band);
  rows.push({ n, band, ...r });
  console.log(`  ${String(n).padStart(4)}${band.toFixed(2).padStart(7)}`
    + `${r.mm.toFixed(2).padStart(13)}${r.pc.toFixed(2).padStart(13)}`
    + `${(r.closer.toFixed(0) + "%").padStart(12)}`);
}

const fails = [];
// 1. The headline: on average the max-margin boundary is nearer the truth, everywhere on the dials.
for (const r of rows) {
  if (!(r.mm < r.pc)) fails.push(`n=${r.n} band=${r.band}: max-margin ${r.mm.toFixed(2)} is not below perceptron ${r.pc.toFixed(2)}`);
  if (r.used < SEEDS * 0.8) fails.push(`n=${r.n} band=${r.band}: only ${r.used} usable samples`);
}
// 2. The mechanism the page draws its conclusion from: a wider band means a bigger advantage.
const narrow = rows.find((r) => r.n === 24 && r.band === 0.1);
const wide = rows.find((r) => r.n === 24 && r.band === 1.6);
const gapNarrow = narrow.pc - narrow.mm;
const gapWide = wide.pc - wide.mm;
console.log(`\n  advantage at band 0.10: ${gapNarrow.toFixed(2)} deg`);
console.log(`  advantage at band 1.60: ${gapWide.toFixed(2)} deg`);
if (!(gapWide > gapNarrow * 1.5)) {
  fails.push(`widening the band did not widen the advantage (${gapNarrow.toFixed(2)} -> ${gapWide.toFixed(2)})`);
}

if (fails.length) {
  console.log("\nFAIL -- the lab no longer shows what the page says it shows:");
  for (const f of fails) console.log(`  - ${f}`);
  console.log();
  process.exit(1);
}
console.log("\nclean -- the lab still demonstrates its effect on every setting tested.\n");
