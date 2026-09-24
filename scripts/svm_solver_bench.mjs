// How long does one MarginLab solve take?
//
// The lab re-solves on every pointermove, so the iteration count is a budget question as well as
// an accuracy one: scripts/svm_sv_tolerance.mjs shows 4000 iterations under-converge at the top
// of the C dial and ring no support vectors. This says what the fix costs.
//
//     node scripts/svm_solver_bench.mjs
import { fitSVM } from "../src/components/labs/svmSolver.ts";

const START = [
  { x: -1.9, z: 0.9, y: -1 }, { x: -1.5, z: 1.8, y: -1 }, { x: -2.3, z: -0.2, y: -1 },
  { x: -0.9, z: 1.2, y: -1 }, { x: -1.2, z: 0.1, y: -1 }, { x: -2.0, z: 1.9, y: -1 },
  { x: -0.6, z: 2.1, y: -1 },
  { x: 1.7, z: -0.8, y: 1 }, { x: 1.2, z: -1.7, y: 1 }, { x: 2.2, z: 0.2, y: 1 },
  { x: 0.8, z: -1.1, y: 1 }, { x: 1.9, z: -1.9, y: 1 }, { x: 2.4, z: -1.0, y: 1 },
  { x: 0.6, z: -2.2, y: 1 },
];

console.log(`\n  ${START.length} points, C = 100 (the worst case for convergence)\n`);
console.log(`  ${"iters".padStart(8)}${"ms / solve".padStart(13)}${"solves / frame @60fps".padStart(24)}`);
for (const it of [4000, 12000, 20000, 40000]) {
  fitSVM(START, 100, it); // warm
  const t0 = performance.now();
  const N = 40;
  for (let k = 0; k < N; k++) fitSVM(START, 100, it);
  const ms = (performance.now() - t0) / N;
  console.log(
    `  ${String(it).padStart(8)}${ms.toFixed(3).padStart(13)}${(16.7 / ms).toFixed(1).padStart(24)}`,
  );
}
console.log("\n  A drag needs one solve per pointermove, so anything under ~4 ms is comfortable.\n");
