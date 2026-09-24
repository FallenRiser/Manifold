// Page 14's guard. SmoStepLab is not a picture of SMO, it runs one: the same two-variable
// step, the same L/H clip, the same maximal-violating-pair rule as scripts/svm_cases.py sections
// 50-53. A lab that DEMONSTRATES an algorithm is worth nothing if it is demonstrating a
// different algorithm, so this holds it against sklearn's answers on the identical points,
// recorded by `python scripts/svm_cases.py clipbox` into results/svm_smo_case.json.
//
// Six things:
//
//   1. the 24 points the lab generates are the 24 points the script generated. The Lehmer
//      recurrence stays under 2^53, so this is exact -- any drift is a bug, not rounding, and
//      the limit is 0.
//   2. run to convergence, the lab reaches sklearn's dual objective, support count and pinned
//      count. The objective is compared tightly; the multipliers are NOT, because an SMO and an
//      interior-point QP take different routes through a degenerate solution (page 13's guard
//      learned this the hard way). The counts are exact.
//   3. the objective never decreases. This is the page's convergence argument, so it is checked
//      on every step of every run rather than asserted: one decrease anywhere fails.
//   4. eta is never positive, over every pair of the lab's Gram matrix. Positive semi-definite
//      is what makes the division safe.
//   5. the clip is real -- a run where nothing is ever clipped would draw the page's central
//      picture and never show it, so at least one step must land on L or H.
//   6. picking the pair at random still converges to the same objective, and takes more steps.
//      That is the page's ablation; if the two rules ever came out equal the lab would be
//      teaching something false.
//
//     node scripts/svm_smo_check.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(ROOT, "results", "svm_smo_case.json");

if (!fs.existsSync(CASES)) {
  console.log(`missing ${CASES}\nrun:  python scripts/svm_cases.py clipbox`);
  process.exit(1);
}
const ref = JSON.parse(fs.readFileSync(CASES, "utf8"));

let bad = 0;
const fail = (m) => {
  console.log(`  FAIL  ${m}`);
  bad += 1;
};

// ---- the lab's own data generator and step, transcribed from SmoStepLab.tsx -----------------
// Transcribed rather than imported because the component is a client module full of JSX; the
// arithmetic below is the part that has to be right, and it is checked against the file's text
// at the bottom so a change there cannot silently stop being checked here.
const N = 24;
const TOL = 1e-6;
function rand(seed) {
  let s = (seed % 2147483646) + 1;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}
function makeData() {
  const u = rand(11);
  const out = [];
  for (let i = 0; i < N; i += 1) {
    const y = i % 2 === 0 ? 1 : -1;
    let t = 0;
    for (let k = 0; k < 6; k += 1) t += u();
    let t2 = 0;
    for (let k = 0; k < 6; k += 1) t2 += u();
    const cx = y > 0 ? 0.95 : -0.95;
    out.push({
      x: Math.round((cx + ((t - 3) / 1.2247) * 0.62) * 1000) / 1000,
      z: Math.round(((t2 - 3) / 1.2247) * 0.82 * 1000) / 1000,
      y,
    });
  }
  return out;
}

const PTS = makeData();
const GRAM = PTS.map((p) => PTS.map((q) => p.x * q.x + p.z * q.z));

const objective = (a) => {
  let o = 0;
  for (let i = 0; i < N; i += 1) {
    o += a[i];
    for (let j = 0; j < N; j += 1) o -= 0.5 * a[i] * a[j] * PTS[i].y * PTS[j].y * GRAM[i][j];
  }
  return o;
};

const errors = (a) =>
  PTS.map((_, k) => {
    let f = 0;
    for (let m = 0; m < N; m += 1) if (a[m] !== 0) f += a[m] * PTS[m].y * GRAM[m][k];
    return f - PTS[k].y;
  });

function plan(a, C, byRule, tick) {
  const g = errors(a);
  const ups = [];
  const dns = [];
  for (let k = 0; k < N; k += 1) {
    if ((a[k] < C - 1e-12 && PTS[k].y > 0) || (a[k] > 1e-12 && PTS[k].y < 0)) ups.push(k);
    if ((a[k] < C - 1e-12 && PTS[k].y < 0) || (a[k] > 1e-12 && PTS[k].y > 0)) dns.push(k);
  }
  if (!ups.length || !dns.length) return null;
  const top = ups.reduce((b, k) => (-g[k] > -g[b] ? k : b), ups[0]);
  const bot = dns.reduce((b, k) => (-g[k] < -g[b] ? k : b), dns[0]);
  if (-g[top] - -g[bot] < TOL) return null;
  let i;
  let j;
  if (byRule) {
    i = top;
    j = bot;
  } else {
    const u = rand(tick * 7919 + 13);
    i = ups[Math.floor(u() * ups.length) % ups.length];
    j = dns[Math.floor(u() * dns.length) % dns.length];
    for (let t = 0; t < 24 && i === j; t += 1) j = dns[Math.floor(u() * dns.length) % dns.length];
  }
  if (i === j) return null;
  const yi = PTS[i].y;
  const yj = PTS[j].y;
  const eta = 2 * GRAM[i][j] - GRAM[i][i] - GRAM[j][j];
  const [L, H] =
    yi !== yj
      ? [Math.max(0, a[j] - a[i]), Math.min(C, C + a[j] - a[i])]
      : [Math.max(0, a[i] + a[j] - C), Math.min(C, a[i] + a[j])];
  if (eta >= -1e-15 || H - L < 1e-14) return null;
  const raw = a[j] - (yj * (g[i] - g[j])) / eta;
  const aj = Math.min(H, Math.max(L, raw));
  const ai = a[i] + yi * yj * (a[j] - aj);
  return { i, j, aj, ai, clipped: raw < L - 1e-12 || raw > H + 1e-12 };
}

function run(C, byRule, cap = 20000) {
  let a = new Array(N).fill(0);
  let steps = 0;
  let clips = 0;
  let drops = 0;
  let prev = 0;
  for (; steps < cap; steps += 1) {
    const p = plan(a, C, byRule, steps);
    if (!p) break;
    a = a.slice();
    a[p.i] = p.ai;
    a[p.j] = p.aj;
    if (p.clipped) clips += 1;
    const o = objective(a);
    if (o < prev - 1e-9) drops += 1;
    prev = o;
  }
  return { a, steps, clips, drops, obj: objective(a) };
}

// ---- 1. the same points ---------------------------------------------------------------------
let worst = 0;
for (let k = 0; k < N; k += 1) {
  worst = Math.max(
    worst,
    Math.abs(PTS[k].x - ref.points[k].x),
    Math.abs(PTS[k].z - ref.points[k].z),
    Math.abs(PTS[k].y - ref.points[k].y),
  );
}
if (worst !== 0) fail(`the lab's points differ from the script's by ${worst} (must be exactly 0)`);

// ---- 4. eta is never positive ---------------------------------------------------------------
let etaMax = -Infinity;
for (let i = 0; i < N; i += 1) {
  for (let j = 0; j < N; j += 1) {
    if (i !== j) etaMax = Math.max(etaMax, 2 * GRAM[i][j] - GRAM[i][i] - GRAM[j][j]);
  }
}
if (etaMax > 0) fail(`eta reaches ${etaMax.toExponential(2)} > 0 -- the Gram matrix is not PSD`);

// ---- 2, 3, 5, 6 ------------------------------------------------------------------------------
const OBJ_LIMIT = 1e-6;
for (const [key, c] of Object.entries(ref.cases)) {
  const r = run(c.C, true);
  const d = Math.abs(r.obj - c.objective);
  if (d > OBJ_LIMIT) {
    fail(`${key}: dual objective ${r.obj.toFixed(9)} against sklearn's ${c.objective.toFixed(9)}`);
  }
  const nsv = r.a.filter((v) => v > 1e-6).length;
  const pin = r.a.filter((v) => v > c.C - 1e-6).length;
  if (nsv !== c.nsv) fail(`${key}: ${nsv} support vectors against sklearn's ${c.nsv}`);
  if (pin !== c.npinned) fail(`${key}: ${pin} pinned at C against sklearn's ${c.npinned}`);
  if (r.drops > 0) fail(`${key}: the objective fell on ${r.drops} step(s) -- it never may`);
  if (r.clips === 0) fail(`${key}: no step was ever clipped, so the lab cannot draw the clip`);

  const rr = run(c.C, false);
  if (Math.abs(rr.obj - c.objective) > 1e-3) {
    fail(`${key}: the random rule did not converge (${rr.obj.toFixed(6)} vs ${c.objective.toFixed(6)})`);
  }
  if (rr.drops > 0) fail(`${key}: random rule, objective fell on ${rr.drops} step(s)`);
  if (rr.steps <= r.steps) {
    fail(`${key}: the random rule took ${rr.steps} steps against the rule's ${r.steps} -- the page claims it is worse`);
  }
  console.log(
    `  ${key.padEnd(7)} rule ${String(r.steps).padStart(4)} steps (${r.clips} clipped)` +
      `   random ${String(rr.steps).padStart(5)} steps   objective ${r.obj.toFixed(6)}` +
      `   ${nsv} SVs, ${pin} pinned`,
  );
}

// ---- the transcription is still a transcription ----------------------------------------------
const src = fs.readFileSync(path.join(ROOT, "src", "components", "labs", "SmoStepLab.tsx"), "utf8");
for (const needle of [
  "s = (s * 48271) % 2147483647",
  "const N = 24",
  "const TOL = 1e-6",
  "if (-g[top] - -g[bot] < TOL) return null",
  "const raw = a[j] - (yj * (g[i] - g[j])) / eta",
  "Math.max(0, a[j] - a[i]), Math.min(C, C + a[j] - a[i])",
  "Math.max(0, a[i] + a[j] - C), Math.min(C, a[i] + a[j])",
]) {
  if (!src.includes(needle)) {
    fail(`SmoStepLab.tsx no longer contains \`${needle}\` -- this guard is checking a copy that has drifted`);
  }
}

console.log(`  eta over every pair: max ${etaMax.toExponential(3)} (never positive)`);
console.log("  the lab's 24 points match the script's exactly, and the objective never falls");
if (bad) {
  console.log(`\nsvm_smo_check: ${bad} failure(s)`);
  process.exit(1);
}
console.log("\nsvm_smo_check: clean");
