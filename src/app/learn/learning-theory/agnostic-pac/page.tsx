import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";

export const metadata = {
  title: "Agnostic PAC & the Bayes floor — Manifold",
  description:
    "Drop the assumption that a perfect hypothesis exists and the goal changes from 'be right' to 'be nearly as good as the best in your class'. The error then splits cleanly into approximation and estimation — the theoretical twin of bias and variance.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static decomposition figure: the three risk levels stacked on one axis, with
// the two gaps named. Module-scope constants, fixed coordinates, server
// component — no hydration surface. Values are illustrative positions on an
// unlabelled axis, not claimed measurements of anything.
const F = { w: 380, h: 168, x0: 30, x1: 350, y: 66 };
const LEVELS = [
  { at: 0.10, label: "R*", sub: "Bayes — irreducible", color: "var(--ink)" },
  { at: 0.28, label: "R(h*)", sub: "best in H", color: "var(--c-metrics)" },
  { at: 0.52, label: "R(ĥ)", sub: "what you got", color: "var(--brand-2)" },
];
const fx = (t: number) => F.x0 + t * (F.x1 - F.x0);

function DecompositionFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Where your error actually comes from
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        two gaps, two different remedies
      </div>
      <svg viewBox={`0 0 ${F.w} ${F.h}`} style={{ width: "100%", maxWidth: F.w, height: "auto", display: "block" }}>
        <line x1={F.x0} y1={F.y} x2={F.x1} y2={F.y} stroke="var(--border-strong)" strokeWidth={1} />
        <text x={F.x1} y={F.y + 30} fontSize={9.5} fill="var(--faint)" textAnchor="end">risk →</text>

        {/* approximation gap */}
        <line x1={fx(0.10)} y1={F.y - 26} x2={fx(0.28)} y2={F.y - 26} stroke="var(--c-metrics)" strokeWidth={1.5} />
        <text x={fx(0.19)} y={F.y - 31} fontSize={9.5} fill="var(--c-metrics)" textAnchor="middle">approximation</text>
        <text x={fx(0.19)} y={F.y - 42} fontSize={9} fill="var(--faint)" textAnchor="middle">is H rich enough?</text>

        {/* estimation gap */}
        <line x1={fx(0.28)} y1={F.y - 26} x2={fx(0.52)} y2={F.y - 26} stroke="var(--brand-2)" strokeWidth={1.5} />
        <text x={fx(0.40)} y={F.y - 31} fontSize={9.5} fill="var(--brand-2)" textAnchor="middle">estimation</text>
        <text x={fx(0.40)} y={F.y - 42} fontSize={9} fill="var(--faint)" textAnchor="middle">enough data to find it?</text>

        {LEVELS.map((l) => (
          <g key={l.label}>
            <line x1={fx(l.at)} y1={F.y - 26} x2={fx(l.at)} y2={F.y + 10} stroke={l.color} strokeWidth={2} />
            <text x={fx(l.at)} y={F.y + 26} fontSize={11} fill={l.color} textAnchor="middle">{l.label}</text>
            <text x={fx(l.at)} y={F.y + 39} fontSize={9} fill="var(--faint)" textAnchor="middle">{l.sub}</text>
          </g>
        ))}

        <text x={F.x0} y={F.h - 8} fontSize={9.5} fill="var(--muted)">
          bigger H pushes R(h*) left — and R(ĥ) further right
        </text>
      </svg>
    </div>
  );
}

export default function AgnosticPacPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The PAC framework", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>Agnostic PAC &amp; the Bayes floor</>}
        intro={<>Real data is noisy and real hypothesis classes are wrong. Drop the pretence that a perfect
          hypothesis is sitting in your class and the goal has to change — into one that turns out to be far more
          useful, and that splits your error into two pieces with two different cures.</>}
      />

      <div className="lesson">
        <h2>Nobody is ever in the realizable case</h2>
        <p>
          The realizable assumption says some <M>{String.raw`h \in \mathcal H`}</M> has zero error. Two independent
          things break it. Your class is almost certainly <em>wrong</em> — no linear boundary exactly separates loan
          defaulters. And the labels themselves are almost certainly <em>noisy</em> — two applicants with identical
          features can have different outcomes, because the outcome depends on things you didn&rsquo;t measure.
          The second problem is fatal in a way the first isn&rsquo;t: when the same <M>x</M> can carry both labels,{" "}
          <strong>no function of <M>x</M> whatsoever has zero error</strong>, however rich your class.
        </p>
        <p>
          So we go <strong>agnostic</strong> — we assume nothing about the target. The guarantee weakens from
          &ldquo;you&rsquo;ll be nearly right&rdquo; to <em>&ldquo;you&rsquo;ll be nearly as good as the best your
          class can do&rdquo;</em>:
        </p>
        <MathBlock>{String.raw`R(\hat h) \;\le\; \inf_{h \in \mathcal H} R(h) \;+\; \varepsilon \qquad \text{with probability} \ge 1-\delta.`}</MathBlock>
        <p>
          This is a <strong>relative</strong> promise, and that&rsquo;s exactly what makes it honest. If your class
          is hopeless, the guarantee is still satisfied — it just guarantees something hopeless. Learning theory
          keeps its promises by being careful about what it promises.
        </p>

        <h2>The floor beneath everything: Bayes risk</h2>
        <p>
          Before we decompose anything, we need the lowest error any function could possibly achieve. Given{" "}
          <M>{String.raw`\eta(x) = P(y = 1 \mid x)`}</M>, the best possible rule is to predict the more likely label
          at each point, and the error that rule incurs is the <strong>Bayes risk</strong>:
        </p>
        <MathBlock>{String.raw`R^\star = \mathbb E_x\big[\min(\eta(x),\, 1 - \eta(x))\big]`}</MathBlock>
        <p>
          <M>{String.raw`R^\star`}</M> is not a failure of your model; it is a property of the <em>problem</em>. If
          two identical inputs genuinely carry different labels 20% of the time, no algorithm ever invented gets
          below 20%. We build this up properly in the k-NN track&rsquo;s{" "}
          <Link href="/learn/k-nearest-neighbors/the-bayes-classifier-and-bayes-error" style={link}>Bayes classifier page</Link>,
          which also proves the striking fact that plain 1-NN gets within a factor of two of it.
        </p>

        <h2>The decomposition</h2>
        <p>
          Now write the excess risk of your learned <M>{String.raw`\hat h`}</M> over the Bayes floor and add and
          subtract the best-in-class risk <M>{String.raw`R(h^*)`}</M>, where{" "}
          <M>{String.raw`h^* = \arg\min_{h\in\mathcal H} R(h)`}</M>:
        </p>
        <MathBlock>{String.raw`R(\hat h) - R^\star \;=\; \underbrace{\big[R(\hat h) - R(h^*)\big]}_{\text{estimation error}} \;+\; \underbrace{\big[R(h^*) - R^\star\big]}_{\text{approximation error}}`}</MathBlock>

        <DecompositionFigure />

        <p>
          Two terms, two entirely different problems, two entirely different fixes:
        </p>
        <ul>
          <li>
            <strong>Approximation error</strong> is the price of your class being too poor to contain the truth. It
            depends only on <M>{String.raw`\mathcal H`}</M> and <M>{String.raw`\mathcal D`}</M> —{" "}
            <em>not on your sample at all</em>. More data will not reduce it by one iota. The only cure is a richer
            class.
          </li>
          <li>
            <strong>Estimation error</strong> is the price of having finite data: you couldn&rsquo;t reliably find{" "}
            <M>{String.raw`h^*`}</M> among all the impostors that looked equally good on <M>n</M> points. This is
            what every bound in this track bounds, and it shrinks with more data — while <em>growing</em> with a
            richer class.
          </li>
        </ul>
        <p>
          And there is the tension in its purest form. Enlarging <M>{String.raw`\mathcal H`}</M> pushes
          approximation error down and estimation error up. You cannot minimise both by choosing a class; you can
          only choose where to sit on the trade. If that feels familiar, it should — this is{" "}
          <strong>bias and variance, stated in terms of risk rather than squared error</strong>. Approximation is
          bias&rsquo;s theoretical twin; estimation is variance&rsquo;s. The{" "}
          <Link href="/learn/polynomial-regression/bias-variance-and-the-degree" style={link}>polynomial
          track&rsquo;s treatment</Link> is the same idea you can watch move under a slider.
        </p>

        <Proof title="why ERM's excess risk is at most twice the uniform gap" color={GRAY}>
          <p>
            Here is the result that makes uniform convergence pay off, and it costs four lines. Let{" "}
            <M>{String.raw`\hat h`}</M> be the empirical risk minimizer — the hypothesis with the lowest{" "}
            <em>training</em> error — and suppose uniform convergence holds:{" "}
            <M>{String.raw`|\hat R_S(h) - R(h)| \le \varepsilon`}</M> for every{" "}
            <M>{String.raw`h \in \mathcal H`}</M> simultaneously. Then:
          </p>
          <MathBlock>{String.raw`R(\hat h) \;\overset{(1)}{\le}\; \hat R_S(\hat h) + \varepsilon \;\overset{(2)}{\le}\; \hat R_S(h^*) + \varepsilon \;\overset{(3)}{\le}\; R(h^*) + 2\varepsilon.`}</MathBlock>
          <p>
            <strong>(1)</strong> is uniform convergence applied to <M>{String.raw`\hat h`}</M> — legal precisely
            because the guarantee covers <em>every</em> hypothesis, including one chosen using the data.{" "}
            <strong>(2)</strong> is the definition of <M>{String.raw`\hat h`}</M>: it minimises empirical risk, so
            no hypothesis has smaller empirical risk than it — in particular{" "}
            <M>{String.raw`\hat R_S(\hat h) \le \hat R_S(h^*)`}</M>. <strong>(3)</strong> is uniform convergence
            again, applied this time to <M>{String.raw`h^*`}</M>.
          </p>
          <p>
            So <M>{String.raw`R(\hat h) - R(h^*) \le 2\varepsilon`}</M>: the estimation error of ERM is at most{" "}
            <strong>twice</strong> the uniform convergence gap. The factor of two is not slack — it is structural,
            and you can see exactly where each half comes from. You pay <M>{String.raw`\varepsilon`}</M> once
            because the winner&rsquo;s training score flattered it, and <M>{String.raw`\varepsilon`}</M> again
            because the true champion&rsquo;s training score may have understated <em>it</em>. Two hypotheses, two
            chances for the sample to mislead you.
          </p>
          <p>
            The consequence is the engine of the whole subject: <strong>bound the uniform gap and you have
            automatically bounded ERM&rsquo;s excess risk.</strong> Every remaining chapter is a different, sharper
            way of bounding that same supremum — by counting behaviours (VC), by measuring noise-fitting ability
            (Rademacher), or by sidestepping it entirely (stability).
          </p>
        </Proof>

        <Callout color={GRAY} title={<>The diagnostic this hands you</>}>
          High training error <em>and</em> high test error means approximation error dominates — your class is too
          poor, and more data is the wrong lever. Low training error with high test error means estimation error
          dominates — your class is rich enough but you can&rsquo;t pin down the right member, so more data,
          regularization, or a smaller class is the lever. This is the formal version of the underfit/overfit
          diagnosis, and it&rsquo;s exactly what the asteroid capstone&rsquo;s{" "}
          <Link href="/learn/asteroid-hazard-capstone/decision-tree" style={link}>train/test curve</Link> reads off
          in practice.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning-theory/sample-complexity", label: <>← Sample complexity</> }}
          next={{ href: "/learn/learning-theory/empirical-risk-minimization", label: <>Next up · Empirical risk minimization →</> }}
        />
      </div>
    </article>
  );
}
