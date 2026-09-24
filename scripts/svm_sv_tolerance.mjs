// How close to z = 1 do the closest points actually land?
//
// MarginLab rings the support vectors, and "support vector" is defined by y(w.x+b) <= 1. With an
// exact QP that test is exact. With Pegasos it is not: the closest points land a hair ABOVE 1, so
// a 1e-6 tolerance rings nothing at all and the lab claims a boundary held up by zero points.
// This picks the tolerance by measuring where the closest points actually sit.
//
//     node scripts/svm_sv_tolerance.mjs
import { fitSVM, SV_TOL } from "../src/components/labs/svmSolver.ts";

const START = [
  { x: -1.9, z: 0.9, y: -1 }, { x: -1.5, z: 1.8, y: -1 }, { x: -2.3, z: -0.2, y: -1 },
  { x: -0.9, z: 1.2, y: -1 }, { x: -1.2, z: 0.1, y: -1 }, { x: -2.0, z: 1.9, y: -1 },
  { x: -0.6, z: 2.1, y: -1 },
  { x: 1.7, z: -0.8, y: 1 }, { x: 1.2, z: -1.7, y: 1 }, { x: 2.2, z: 0.2, y: 1 },
  { x: 0.8, z: -1.1, y: 1 }, { x: 1.9, z: -1.9, y: 1 }, { x: 2.4, z: -1.0, y: 1 },
  { x: 0.6, z: -2.2, y: 1 },
];
// Pulled further apart, which is the state the lab lands in after the reader drags a point out.
const WIDE = START.map((p) => ({ ...p, x: p.x - 0.55 * p.y }));

console.log(
  `\n  ${"data".padEnd(6)}${"C".padStart(6)}${"iters".padStart(8)}${"min z".padStart(11)}` +
    `${"margin".padStart(9)}${"1e-6".padStart(7)}${"1e-2".padStart(7)}${"3e-2".padStart(7)}${"1e-1".padStart(7)}`,
);
// MUST match the range MarginLab's slider exposes (log10 C from -2 to 2). Testing a narrower
// range is how a tolerance got chosen that still rang nothing at the top of the dial.
const C_RANGE = [0.01, 0.1, 1, 10, 31.6, 100];

for (const [name, data] of [["start", START], ["wide", WIDE]]) {
  for (const C of C_RANGE) {
    for (const iters of [4000, 20000]) {
      const f = fitSVM(data, C, iters);
      const zs = data
        .map((q) => q.y * (f.w[0] * q.x + f.w[1] * q.z + f.b))
        .sort((a, b) => a - b);
      const n = (t) => zs.filter((z) => z <= 1 + t).length;
      console.log(
        `  ${name.padEnd(6)}${String(C).padStart(6)}${String(iters).padStart(8)}` +
          `${zs[0].toFixed(6).padStart(11)}${f.margin.toFixed(4).padStart(9)}` +
          `${String(n(1e-6)).padStart(7)}${String(n(1e-2)).padStart(7)}${String(n(3e-2)).padStart(7)}${String(n(1e-1)).padStart(7)}`,
      );
    }
  }
}
// Guard, not just a report: a state where the lab rings nothing is a lab showing a boundary held
// up by no points, which is the opposite of what the page is teaching.
// Deliberately calls fitSVM WITHOUT an iteration count, so the guard tests the configuration the
// lab actually ships rather than one of the exploratory rows above.
let ringedNothing = 0;
for (const data of [START, WIDE]) {
  for (const C of C_RANGE) {
    if (fitSVM(data, C).sv.filter(Boolean).length === 0) ringedNothing++;
  }
}

console.log(`\n  shipped SV_TOL = ${SV_TOL}; states ringing nothing: ${ringedNothing}`);
if (ringedNothing) {
  console.log("\nFAIL -- some states ring no support vectors at the shipped tolerance.\n");
  process.exit(1);
}
console.log("\nclean -- every state rings at least one support vector.\n");
