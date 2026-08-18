import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The ε-insensitive loss — Manifold",
  description:
    "The loss that defines SVR: zero for errors within ε, then linear beyond. See how it differs from squared and absolute loss, and why 'flat then linear' produces both sparsity and robustness.",
};

// Three loss functions of the residual r: epsilon-insensitive (eps=0.5),
// absolute |r|, and squared r^2. Analytic, rounded at module scope.
const EPS = 0.5;
const RS = Array.from({ length: 81 }, (_, i) => -1.2 + (2.4 * i) / 80);
const eInsens = (r: number) => Math.max(0, Math.abs(r) - EPS);
const absL = (r: number) => Math.abs(r);
const sqL = (r: number) => r * r;
const W = 360, H = 200, padL = 24, padB = 24, padT = 12, padR = 12;
const YMAX = 1.5;
const px = (r: number) => Math.round((padL + ((r + 1.2) / 2.4) * (W - padL - padR)) * 100) / 100;
const py = (v: number) => Math.round((H - padB - Math.min(v, YMAX) / YMAX * (H - padB - padT)) * 100) / 100;
const line = (f: (r: number) => number) => RS.map((r) => `${px(r)},${py(f(r))}`).join(" ");

export default function EpsInsensitiveLossPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · the ε-insensitive idea", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>The ε-insensitive loss</>}
        intro={<>
          Every regression method is defined by what it considers an &ldquo;error.&rdquo; SVR&rsquo;s answer is
        deliberately lenient: nothing within ε of the truth counts at all. That single choice reshapes the whole
        model.
        </>}
      />

      <div className="lesson">
        <h2>The definition</h2>
        <p>The ε-insensitive loss ignores any residual smaller than ε, then grows linearly:</p>
        <MathBlock>{String.raw`L_\varepsilon(y, \hat{y}) = \max\big(0,\ |y - \hat{y}| - \varepsilon\big) = \begin{cases} 0 & |y - \hat{y}| \le \varepsilon \\ |y - \hat{y}| - \varepsilon & \text{otherwise} \end{cases}`}</MathBlock>
        <p>
          It has a <strong>flat dead zone</strong> of width <M>{String.raw`2\varepsilon`}</M> where the loss is
          exactly zero, and beyond that it rises like absolute error. Compare it to the two losses you already
          know:
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Three loss functions of the residual: squared loss is a parabola, absolute loss a V, and the epsilon-insensitive loss is flat within epsilon then linear.">
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <line x1={px(0)} y1={padT} x2={px(0)} y2={H - padB} stroke="var(--border)" strokeWidth={1} />
            {/* epsilon markers */}
            <line x1={px(-EPS)} y1={py(0)} x2={px(-EPS)} y2={padT} stroke="var(--faint)" strokeWidth={0.8} strokeDasharray="2 3" />
            <line x1={px(EPS)} y1={py(0)} x2={px(EPS)} y2={padT} stroke="var(--faint)" strokeWidth={0.8} strokeDasharray="2 3" />
            <polyline points={line(sqL)} fill="none" stroke="var(--c-fundamentals)" strokeWidth={2} />
            <polyline points={line(absL)} fill="none" stroke="var(--faint)" strokeWidth={1.8} strokeDasharray="4 3" />
            <polyline points={line(eInsens)} fill="none" stroke="var(--c-regression)" strokeWidth={2.8} />
            <text x={px(0)} y={py(0) + 12} fontSize={8.5} fill="var(--faint)" textAnchor="middle">−ε   0   +ε</text>
            <text x={px(0.95)} y={py(sqL(0.95)) - 3} fontSize={9} fill="var(--c-fundamentals)">squared</text>
            <text x={px(1.05)} y={py(absL(1.05)) + 2} fontSize={9} fill="var(--faint)">|r|</text>
            <text x={px(0.55)} y={py(eInsens(0.9)) - 3} fontSize={9} fill="var(--c-regression)">ε-insensitive</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            Squared loss (parabola) punishes every deviation and explodes on outliers. Absolute loss (V) is linear
            but still penalises everything. The ε-insensitive loss is <strong>flat inside the tube</strong> and
            linear outside — free in the middle, bounded-slope at the edges.
          </figcaption>
        </figure>

        <h2>Two consequences, straight from the shape</h2>
        <ul style={ul}>
          <li>
            <strong>The flat zone → sparsity.</strong> A point with zero loss exerts zero force on the fit, so it
            can be dropped entirely. Only points outside the tube (where the loss is nonzero) constrain the
            model — the <em>support vectors</em>. Squared and absolute loss are never flat, so they keep every
            point.
          </li>
          <li>
            <strong>The linear tails → robustness.</strong> Beyond ε the loss grows like <M>{String.raw`|r|`}</M>,
            not <M>{String.raw`r^2`}</M>, so a distant outlier contributes a bounded gradient instead of a
            runaway one. SVR won&rsquo;t let a handful of bad points hijack the fit the way least squares does.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>ε is a tolerance you set, not a parameter you fit</>}>
          <M>{String.raw`\varepsilon`}</M> encodes &ldquo;how close is close enough&rdquo; — a modelling decision
            about the precision you care about, often in the units of <M>{String.raw`y`}</M>. Bigger ε means a
            wider dead zone: fewer support vectors, a simpler and flatter model, but coarser predictions. It&rsquo;s
            a genuine knob, tuned alongside the others, and unique to SVR — kernel ridge has no equivalent.
        </Callout>

        <h2>Where it comes from: the SVM, transposed</h2>
        <p>
          The ε-insensitive loss is the regression mirror of the support vector machine&rsquo;s hinge loss. An SVM
          classifier ignores points comfortably on the correct side of the margin and only cares about the ones
          near or across the boundary. SVR ignores points comfortably inside the tube and only cares about the
          ones near or across its edge. Same &ldquo;only the hard cases matter&rdquo; philosophy, applied to a
          continuous target.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "The ε-insensitive loss assigns what cost to a residual of size 0.3 when ε = 0.5?",
              options: ["Zero — it's inside the tube", "0.3", "0.09"],
              answer: 0,
              explain: "Any residual with |r| ≤ ε costs nothing. Only the excess beyond ε, max(0, |r|−ε), is penalised.",
            },
            {
              q: "Why does the ε-insensitive loss produce a sparse model?",
              options: ["Points inside the tube have zero loss and zero influence, so they can be dropped", "It uses fewer features", "It regularises the weights to zero"],
              answer: 0,
              explain: "A flat (zero) loss region means those points exert no force on the fit — only support vectors outside the tube constrain it.",
            },
            {
              q: "Compared to squared loss, the ε-insensitive loss handles outliers better because…",
              options: ["Its tails grow linearly, so a distant point's influence is bounded", "It ignores all large errors entirely", "It squares the residual twice"],
              answer: 0,
              explain: "Linear (|r|) tails give a bounded gradient, unlike squared loss where one far point can dominate. SVR is robust, not blind — big errors still count, just not quadratically.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression", label: <>← Regression with a tube</> }} next={{ href: "/learn/support-vector-regression/the-tube-and-support-vectors", label: <>Next up · The tube &amp; support vectors →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
