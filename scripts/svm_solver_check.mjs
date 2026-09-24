// Does the browser's SVM solver draw the boundary it claims to?
//
// The MarginLab labels what it draws "the maximum-margin boundary". Believing that needs TWO
// links, and this script checks both:
//
//   1. PORT      the shipped TypeScript must reproduce the Python Pegasos exactly -- same
//                algorithm, so any difference is a porting bug.
//   2. OPTIMUM   Pegasos must land on the boundary sklearn's QP finds. Pegasos is iterative and
//                sklearn solves the program properly, so a small angle is expected; degrees are
//                not, and would mean the lab is drawing some other line.
//
//     python scripts/svm_cases.py solver     # records both answers -> results/svm_solver_case.json
//     node scripts/svm_solver_check.mjs
//
// Node 22+ strips the types, so this imports the .ts directly.
import { readFileSync } from "node:fs";
import { fitSVM } from "../src/components/labs/svmSolver.ts";

const cases = JSON.parse(
  readFileSync(new URL("../results/svm_solver_case.json", import.meta.url), "utf8"),
);

const MAX_PORT = 1e-6; // same algorithm: this should be numerical noise or nothing at all
const MAX_ANGLE = 1.0; // iterative vs QP: a fraction of a degree is fine, degrees are not
const MAX_MARGIN_REL = 0.02;

const angleBetween = (a, b) => {
  const dot = a[0] * b[0] + a[1] * b[1];
  const n = Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]);
  return (Math.acos(Math.min(1, Math.max(-1, dot / n))) * 180) / Math.PI;
};

let worstPort = 0;
let worstAngle = 0;
let worstMargin = 0;
let bad = 0;

console.log(`\n${cases.length} recorded cases.\n`);
console.log(
  `  ${"dataset / C".padEnd(24)}${"port".padStart(11)}${"vs sklearn".padStart(12)}${"margin ts".padStart(11)}${"margin qp".padStart(11)}${"rel".padStart(9)}`,
);

for (const c of cases) {
  const pts = c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }));
  const got = fitSVM(pts, c.C);

  // 1. port: against the Python Pegasos that produced this case
  const port = Math.max(
    Math.abs(got.w[0] - c.w[0]),
    Math.abs(got.w[1] - c.w[1]),
    Math.abs(got.b - c.b),
  );
  // 2. optimum: against sklearn's QP
  const angle = angleBetween(got.w, c.sw);
  const marginQp = 2 / Math.hypot(c.sw[0], c.sw[1]);
  const rel = Math.abs(got.margin - marginQp) / marginQp;

  worstPort = Math.max(worstPort, port);
  worstAngle = Math.max(worstAngle, angle);
  worstMargin = Math.max(worstMargin, rel);

  const ok = port <= MAX_PORT && angle <= MAX_ANGLE && rel <= MAX_MARGIN_REL;
  if (!ok) bad++;

  console.log(
    `  ${`${c.name}  C=${c.C}`.padEnd(24)}${port.toExponential(1).padStart(11)}${angle
      .toFixed(3)
      .padStart(12)}${got.margin.toFixed(4).padStart(11)}${marginQp
      .toFixed(4)
      .padStart(11)}${rel.toFixed(4).padStart(9)}${ok ? "" : "   <- OFF"}`,
  );
}

console.log(
  `\n  worst port error ${worstPort.toExponential(2)} (limit ${MAX_PORT.toExponential(0)})` +
    `\n  worst angle vs sklearn ${worstAngle.toFixed(3)} deg (limit ${MAX_ANGLE})` +
    `\n  worst margin error ${(worstMargin * 100).toFixed(2)}% (limit ${MAX_MARGIN_REL * 100}%)`,
);

if (bad) {
  console.log(`\nFAIL -- ${bad} case(s) disagree; the lab is not drawing the maximum-margin boundary.`);
  process.exit(1);
}
console.log("\nclean -- the lab is a faithful port AND lands on sklearn's boundary.");
