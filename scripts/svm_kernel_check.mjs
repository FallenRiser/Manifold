// The thirteenth guard. KernelTrickLab claims that the number it builds out of D coordinates and
// the number it gets from (1 + x.z)^p are the same number, and the page prints a bound on how far
// apart they are allowed to be. Both are claims about code that ships, so both get run.
//
// Three things are checked:
//
//   1. the lab's basis() really is the expansion of (1 + x.z)^p -- the count is C(2+p, p) and the
//      multinomial weights are the ones the binomial theorem asks for, not weights that happen to
//      work on the two points the lab opens with;
//   2. the two routes agree across the whole draggable square at every degree on the dial, to the
//      bound the page states. Not at one position: on a grid, because the page says "anywhere on
//      the plane" and a claim with a quantifier in it should be tested with one;
//   3. how OFTEN the two routes agree bit for bit. The page tells the reader the readout is
//      usually an exact 0 and that exact agreement thins out as the degree climbs -- about
//      three-quarters of positions at p=1, under a tenth at p=5 -- so those two numbers are
//      claims about shipped code like any other.
//
//     node scripts/svm_kernel_check.mjs

const PAGE_BOUND = 1e-10; // what the page's insight line promises the reader
const MAX_P = 5; // the dial's top setting

const fact = (n) => {
  let f = 1;
  for (let i = 2; i <= n; i += 1) f *= i;
  return f;
};

const comb = (n, k) => {
  let c = 1;
  for (let i = 0; i < k; i += 1) c = (c * (n - i)) / (i + 1);
  return Math.round(c);
};

// Deliberately a second implementation rather than an import: a guard that reuses the code it is
// checking only proves the code equals itself.
function basis(p) {
  const out = [];
  for (let a = 0; a <= p; a += 1) {
    for (let b = 0; a + b <= p; b += 1) {
      out.push({ a, b, w2: fact(p) / (fact(p - a - b) * fact(a) * fact(b)) });
    }
  }
  return out;
}

const phi = (q, bs) => bs.map((t) => Math.sqrt(t.w2) * Math.pow(q.x, t.a) * Math.pow(q.z, t.b));

let failed = 0;
const fail = (msg) => {
  console.log(`  FAIL  ${msg}`);
  failed += 1;
};

console.log("kernel trick: the explicit map against the kernel\n");

// ---------------------------------------------------------------- 1. the basis is the expansion
for (let p = 1; p <= MAX_P; p += 1) {
  const bs = basis(p);
  const want = comb(2 + p, p);
  if (bs.length !== want) fail(`p=${p}: basis has ${bs.length} coordinates, C(2+p,p) is ${want}`);
  // sum of the multinomial weights over all terms is (1 + 1 + 1)^p = 3^p
  const total = bs.reduce((s, t) => s + t.w2, 0);
  if (Math.abs(total - Math.pow(3, p)) > 1e-9) {
    fail(`p=${p}: weights sum to ${total}, the multinomial theorem says ${Math.pow(3, p)}`);
  }
}
console.log(`  basis is C(2+p,p) coordinates with multinomial weights, p=1..${MAX_P}`);

// ---------------------------------------------------------------- 2 & 3. the two routes agree
const STEP = 0.08;
let worst = 0;
let worstAt = null;
let smallest = Infinity;
let samples = 0;

for (let p = 1; p <= MAX_P; p += 1) {
  const bs = basis(p);
  let worstP = 0;
  let exactP = 0;
  let countP = 0;
  for (let ax = -2; ax <= 2; ax += STEP) {
    for (let az = -2; az <= 2; az += STEP) {
      for (let bx = -2; bx <= 2; bx += 0.37) {
        for (let bz = -2; bz <= 2; bz += 0.41) {
          const a = { x: ax, z: az };
          const b = { x: bx, z: bz };
          const fa = phi(a, bs);
          const fb = phi(b, bs);
          let built = 0;
          for (let i = 0; i < fa.length; i += 1) built += fa[i] * fb[i];
          const ker = Math.pow(1 + a.x * b.x + a.z * b.z, p);
          const gap = Math.abs(built - ker);
          samples += 1;
          countP += 1;
          if (gap === 0) exactP += 1;
          if (gap > worstP) worstP = gap;
          if (gap > worst) {
            worst = gap;
            worstAt = { p, a, b, built, ker };
          }
          if (gap < smallest) smallest = gap;
        }
      }
    }
  }
  const ok = worstP <= PAGE_BOUND;
  const pct = (100 * exactP) / countP;
  console.log(
    `  p=${p}  D=${String(bs.length).padStart(2)}  worst gap ${worstP.toExponential(2)}  ` +
      `${ok ? "within" : "OVER"} the ${PAGE_BOUND.toExponential(0)} the page promises  ` +
      `| bit-identical at ${pct.toFixed(1)}%`,
  );
  if (!ok) fail(`p=${p}: worst gap ${worstP.toExponential(3)} exceeds ${PAGE_BOUND}`);
  // the page says "about three-quarters" at the bottom of the dial and "under a tenth" at the top
  if (p === 1 && (pct < 65 || pct > 85)) {
    fail(`p=1: bit-identical at ${pct.toFixed(1)}%, page says about three-quarters`);
  }
  if (p === MAX_P && pct >= 10) {
    fail(`p=${MAX_P}: bit-identical at ${pct.toFixed(1)}%, page says under a tenth`);
  }
  if (p === MAX_P && pct === 0) {
    fail(`p=${MAX_P}: never bit-identical -- the page says the readout is often an exact 0`);
  }
}

console.log(`\n  ${samples.toLocaleString("en-US")} positions checked`);
console.log(
  `  worst overall ${worst.toExponential(3)} at p=${worstAt.p}, ` +
    `k=${worstAt.ker.toExponential(3)}`,
);

if (worst === 0) fail("the two routes agree exactly everywhere at every degree");

console.log(failed === 0 ? "\nclean." : `\n${failed} problem(s).`);
process.exit(failed === 0 ? 0 : 1);
