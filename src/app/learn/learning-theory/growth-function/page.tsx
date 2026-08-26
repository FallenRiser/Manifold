import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";

export const metadata = {
  title: "The growth function & Sauer's lemma — Manifold",
  description:
    "The growth function counts how many labelings a class can produce on n points. Sauer's lemma proves it undergoes a phase transition at the VC dimension: exponential below it, polynomial above — and that single switch is what makes generalization possible.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static figure: the phase transition. Below d the growth function is 2^n;
// above it, it is bounded by n^d. Both curves plotted on a log-y axis so the
// change from a straight line (exponential) to a bending one (polynomial) is
// visible as a change of SHAPE, not just of slope. Computed at module scope
// with rounded coords — server component, no hydration surface.
const D_VC = 5;
const N_MAX = 40;
const GW = 380, GH = 200, GP = { l: 42, r: 14, t: 16, b: 34 };
const gx0 = GP.l, gx1 = GW - GP.r, gy0 = GH - GP.b, gy1 = GP.t;
const LOG_MAX = 12; // log2 of the largest value plotted

const gpx = (n: number) => gx0 + (n / N_MAX) * (gx1 - gx0);
const gpy = (log2v: number) => gy0 - Math.min(LOG_MAX, Math.max(0, log2v)) / LOG_MAX * (gy0 - gy1);

// log2 of 2^n, and log2 of the Sauer bound sum_{i<=d} C(n,i)
function log2Sauer(n: number, d: number) {
  let s = 0;
  for (let i = 0; i <= Math.min(d, n); i++) {
    let c = 1;
    for (let k = 0; k < i; k++) c = (c * (n - k)) / (k + 1);
    s += c;
  }
  return Math.log2(s);
}

const EXP_PTS: string[] = [];
const SAUER_PTS: string[] = [];
for (let n = 1; n <= N_MAX; n++) {
  EXP_PTS.push(`${gpx(n).toFixed(2)},${gpy(n).toFixed(2)}`);
  SAUER_PTS.push(`${gpx(n).toFixed(2)},${gpy(log2Sauer(n, D_VC)).toFixed(2)}`);
}

function GrowthFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        The phase transition at <M>{String.raw`d = 5`}</M>
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        log scale — a straight line here means genuinely exponential growth
      </div>
      <svg viewBox={`0 0 ${GW} ${GH}`} style={{ width: "100%", maxWidth: GW, height: "auto", display: "block" }}>
        <rect x={gx0} y={gy1} width={gx1 - gx0} height={gy0 - gy1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={gpx(D_VC)} y1={gy1} x2={gpx(D_VC)} y2={gy0} stroke="var(--brand-2)" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
        <text x={gpx(D_VC) + 4} y={gy1 + 12} fontSize={9.5} fill="var(--brand-2)">n = d</text>

        <polyline points={EXP_PTS.join(" ")} fill="none" stroke="var(--faint)" strokeWidth={1.5} strokeDasharray="4 3" />
        <polyline points={SAUER_PTS.join(" ")} fill="none" stroke="var(--ink)" strokeWidth={2} />

        <text x={gpx(26)} y={gpy(26) - 6} fontSize={9.5} fill="var(--faint)">2ⁿ — if it never stopped</text>
        <text x={gpx(21)} y={gpy(log2Sauer(21, D_VC)) + 16} fontSize={9.5} fill="var(--ink)">actual bound: polynomial</text>

        {[0, 4, 8, 12].map((v) => (
          <text key={v} x={gx0 - 6} y={gpy(v) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">2^{v}</text>
        ))}
        {[0, 10, 20, 30, 40].map((v) => (
          <text key={v} x={gpx(v)} y={gy0 + 14} fontSize={9.5} fill="var(--faint)" textAnchor="middle">{v}</text>
        ))}
        <text x={(gx0 + gx1) / 2} y={gy0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">sample size n</text>
      </svg>
    </div>
  );
}

export default function GrowthFunctionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Measuring capacity", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>The growth function &amp; Sauer&rsquo;s lemma</>}
        intro={<>VC dimension is a single number describing where a class stops being able to do anything it likes.
          This page shows what happens <em>past</em> that point — a phase transition so abrupt it&rsquo;s the reason
          learning is possible at all.</>}
      />

      <div className="lesson">
        <h2>Counting behaviours, properly</h2>
        <p>
          The <strong>growth function</strong> <M>{String.raw`\Pi_{\mathcal H}(n)`}</M> is the largest number of
          distinct labelings <M>{String.raw`\mathcal H`}</M> can produce on <em>any</em> sample of <M>n</M> points:
        </p>
        <MathBlock>{String.raw`\Pi_{\mathcal H}(n) \;=\; \max_{x_1,\dots,x_n} \big|\{(h(x_1), \dots, h(x_n)) : h \in \mathcal H\}\big|`}</MathBlock>
        <p>
          This is the honest replacement for <M>{String.raw`|\mathcal H|`}</M> in the union bound — the count of
          hypotheses your sample can actually distinguish. Two facts follow immediately from the definition:{" "}
          <M>{String.raw`\Pi_{\mathcal H}(n) \le 2^n`}</M> always, since there are only{" "}
          <M>{String.raw`2^n`}</M> possible labelings; and{" "}
          <M>{String.raw`\Pi_{\mathcal H}(n) = 2^n`}</M> exactly when some <M>n</M>-point set is shattered. So VC
          dimension is precisely <em>the last <M>n</M> at which the growth function is still maximal</em>:
        </p>
        <MathBlock>{String.raw`\text{VCdim}(\mathcal H) \;=\; \max\{n : \Pi_{\mathcal H}(n) = 2^n\}`}</MathBlock>

        <h2>The transition</h2>
        <p>
          Here is where it gets surprising. You might expect the growth function to keep rising steeply past the VC
          dimension — slower than <M>{String.raw`2^n`}</M>, perhaps, but still exponential. It does not.{" "}
          <strong>The moment <M>n</M> exceeds <M>d</M>, growth collapses from exponential to polynomial</strong>,
          with no intermediate regime.
        </p>

        <GrowthFigure />

        <p>
          That collapse is <strong>Sauer&rsquo;s lemma</strong> (also Sauer–Shelah, and independently Vapnik and
          Chervonenkis). For a class of VC dimension <M>d</M>:
        </p>
        <MathBlock>{String.raw`\Pi_{\mathcal H}(n) \;\le\; \sum_{i=0}^{d} \binom{n}{i} \;\le\; \Big(\frac{en}{d}\Big)^{d} \quad \text{for } n \ge d.`}</MathBlock>
        <p>
          A class either shatters sets of every size — infinite VC dimension, no useful bound — or, past a single
          finite threshold, the number of behaviours it can express is bounded by a polynomial of degree{" "}
          <M>d</M>. There is nothing in between. That dichotomy is one of the genuinely beautiful results in the
          subject, and it is what makes everything else work.
        </p>

        <Proof title="Sauer's lemma, by induction (the shifting argument)" color={GRAY}>
          <p>
            We prove the sharper form: if <M>{String.raw`\text{VCdim}(\mathcal H) \le d`}</M> then{" "}
            <M>{String.raw`\Pi_{\mathcal H}(n) \le \sum_{i=0}^{d}\binom{n}{i}`}</M>. Induction on{" "}
            <M>{String.raw`n + d`}</M>.
          </p>
          <p>
            <strong>Base cases.</strong> For <M>{String.raw`n = 0`}</M> there is exactly one labeling (the empty
            one) and the sum is <M>{String.raw`\binom{0}{0} = 1`}</M>. For <M>{String.raw`d = 0`}</M>, no single
            point is shattered, meaning every point gets the same label from every hypothesis, so there is exactly
            one labeling and the sum is again 1. Both hold.
          </p>
          <p>
            <strong>Inductive step.</strong> Fix a sample <M>{String.raw`C = \{x_1, \dots, x_n\}`}</M> and let{" "}
            <M>{String.raw`\mathcal H|_C`}</M> be the set of labelings <M>{String.raw`\mathcal H`}</M> realizes on
            it. Split off the last point: let <M>{String.raw`C' = \{x_1, \dots, x_{n-1}\}`}</M> and define two
            collections of labelings of <M>{String.raw`C'`}</M>.
          </p>
          <p>
            <M>{String.raw`\mathcal H_1 = \mathcal H|_{C'}`}</M> — every labeling of the first{" "}
            <M>{String.raw`n-1`}</M> points that occurs at all.
          </p>
          <p>
            <M>{String.raw`\mathcal H_2`}</M> — the labelings of <M>{String.raw`C'`}</M> that occur{" "}
            <em>twice</em> in <M>{String.raw`\mathcal H|_C`}</M>, once extended by{" "}
            <M>{String.raw`x_n \mapsto 0`}</M> and once by <M>{String.raw`x_n \mapsto 1`}</M>.
          </p>
          <p>
            Every labeling in <M>{String.raw`\mathcal H|_C`}</M> is counted exactly once this way — a pattern on{" "}
            <M>{String.raw`C'`}</M> that extends in one way contributes 1 to{" "}
            <M>{String.raw`|\mathcal H_1|`}</M>, and one that extends both ways contributes 1 to each. So
          </p>
          <MathBlock>{String.raw`|\mathcal H|_C| \;=\; |\mathcal H_1| + |\mathcal H_2|.`}</MathBlock>
          <p>
            <strong>Bounding the first term.</strong> <M>{String.raw`\mathcal H_1`}</M> is a class on{" "}
            <M>{String.raw`n-1`}</M> points with VC dimension at most <M>d</M>, so by induction{" "}
            <M>{String.raw`|\mathcal H_1| \le \sum_{i=0}^{d}\binom{n-1}{i}`}</M>.
          </p>
          <p>
            <strong>Bounding the second term — the clever half.</strong> Claim:{" "}
            <M>{String.raw`\text{VCdim}(\mathcal H_2) \le d - 1`}</M>. Suppose <M>{String.raw`\mathcal H_2`}</M>{" "}
            shattered some set <M>{String.raw`B \subseteq C'`}</M> with <M>{String.raw`|B| = d`}</M>. By the
            definition of <M>{String.raw`\mathcal H_2`}</M>, every one of its labelings extends to{" "}
            <M>{String.raw`x_n`}</M> <em>both</em> ways. So <M>{String.raw`\mathcal H`}</M> would shatter{" "}
            <M>{String.raw`B \cup \{x_n\}`}</M>, a set of size <M>{String.raw`d+1`}</M> — contradicting{" "}
            <M>{String.raw`\text{VCdim}(\mathcal H) \le d`}</M>. Hence, by induction,{" "}
            <M>{String.raw`|\mathcal H_2| \le \sum_{i=0}^{d-1}\binom{n-1}{i}`}</M>.
          </p>
          <p>
            <strong>Combine, using Pascal&rsquo;s rule</strong>{" "}
            <M>{String.raw`\binom{n-1}{i} + \binom{n-1}{i-1} = \binom{n}{i}`}</M>:
          </p>
          <MathBlock>{String.raw`|\mathcal H|_C| \le \sum_{i=0}^{d}\binom{n-1}{i} + \sum_{i=0}^{d-1}\binom{n-1}{i} = \sum_{i=0}^{d}\left[\binom{n-1}{i} + \binom{n-1}{i-1}\right] = \sum_{i=0}^{d}\binom{n}{i}.`}</MathBlock>
          <p>
            Since <M>C</M> was arbitrary, the bound holds for the maximum, completing the induction. The final
            simplification to <M>{String.raw`(en/d)^d`}</M> is a standard estimate of the partial binomial sum.
          </p>
          <p>
            The load-bearing idea is worth stating plainly: <strong>a labeling that extends both ways is a labeling
            with one extra degree of freedom, and freedom is exactly what VC dimension budgets.</strong> Every
            &ldquo;doubled&rdquo; pattern spends a unit of shattering capacity, so there can only be so many.
          </p>
        </Proof>

        <h2>Why this rescues everything</h2>
        <p>
          Recall the union bound gave <M>{String.raw`\varepsilon \sim \sqrt{\ln M / n}`}</M>. Replace{" "}
          <M>M</M> with the growth function and use Sauer:
        </p>
        <MathBlock>{String.raw`\ln \Pi_{\mathcal H}(n) \;\le\; d \ln\frac{en}{d} \;=\; O(d \log n)`}</MathBlock>
        <p>
          The numerator grows like <M>{String.raw`d\log n`}</M> while the denominator grows like <M>n</M>, so the
          whole bound behaves like <M>{String.raw`\sqrt{d\log n / n} \to 0`}</M>. <strong>Learning
          works.</strong> Had the growth function stayed exponential — <M>{String.raw`\ln 2^n = n\ln 2`}</M> — the
          ratio would be <M>{String.raw`\sqrt{\ln 2}`}</M>, a constant that never shrinks no matter how much data
          you collect. That is the entire difference between a class you can learn and one you cannot, and
          Sauer&rsquo;s lemma is the hinge it turns on.
        </p>

        <Callout color={GRAY} title={<>The one-sentence version</>}>
          A class with finite VC dimension can only express polynomially many behaviours on <M>n</M> points, and
          polynomially many behaviours can be union-bounded away by exponentially concentrated averages.{" "}
          <strong>Polynomial loses to exponential</strong> — that race, and its outcome, is the mathematical
          content of &ldquo;generalization is possible&rdquo;.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning-theory/vc-dimension", label: <>← Shattering &amp; VC dimension</> }}
          next={{ href: "/learn/learning-theory/the-vc-bound", label: <>Next up · The VC generalization bound →</> }}
        />
      </div>
    </article>
  );
}
