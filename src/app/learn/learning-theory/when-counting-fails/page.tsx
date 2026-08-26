import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When counting hypotheses fails — Manifold",
  description:
    "Every bound so far contains ln|H|, and every real model has infinitely many hypotheses. The fix is to stop counting hypotheses and start counting the distinct behaviours they can produce on your actual sample.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static figure: uncountably many thresholds, finitely many behaviours. The
// points are fixed; the vertical rules are candidate thresholds; the shaded
// bands are the regions inside which every threshold produces the identical
// labeling. Module scope, fixed coords, server component.
const PTS = [72, 132, 196, 268, 320];
const FW = 380, FH = 128, AX = 62;

function BehavioursFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Infinitely many thresholds, six behaviours
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        every threshold inside one band labels the sample identically
      </div>
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", maxWidth: FW, height: "auto", display: "block" }}>
        {/* the six gaps: before p1, between each pair, after p5 */}
        {[[30, PTS[0]], [PTS[0], PTS[1]], [PTS[1], PTS[2]], [PTS[2], PTS[3]], [PTS[3], PTS[4]], [PTS[4], 356]].map(([a, b], i) => (
          <rect key={i} x={a} y={AX - 26} width={b - a} height={52} rx={4}
            fill="var(--c-metrics)" fillOpacity={i % 2 === 0 ? 0.13 : 0.06} />
        ))}
        <line x1={30} y1={AX} x2={356} y2={AX} stroke="var(--border-strong)" strokeWidth={1} />
        {PTS.map((x, i) => (
          <circle key={i} cx={x} cy={AX} r={6} fill="var(--ink)" />
        ))}
        {/* a few sample thresholds inside one band, all equivalent */}
        {[152, 166, 180].map((x, i) => (
          <line key={i} x1={x} y1={AX - 22} x2={x} y2={AX + 22} stroke="var(--brand-2)" strokeWidth={1.5} strokeDasharray="3 2" />
        ))}
        <text x={166} y={AX - 30} fontSize={9.5} fill="var(--brand-2)" textAnchor="middle">three different thresholds</text>
        <text x={166} y={AX + 38} fontSize={9.5} fill="var(--brand-2)" textAnchor="middle">one identical labeling</text>
        <text x={FW / 2} y={FH - 6} fontSize={10} fill="var(--muted)" textAnchor="middle">
          5 points ⇒ exactly 6 distinct labelings, not ∞
        </text>
      </svg>
    </div>
  );
}

export default function WhenCountingFailsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Measuring capacity", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 6 minutes"
        title={<>When counting hypotheses fails</>}
        intro={<>Every bound so far has an <M>{String.raw`\ln|\mathcal H|`}</M> in it, and every model you have
          ever trained has <M>{String.raw`|\mathcal H| = \infty`}</M>. This short page is the pivot: the one change
          of perspective that rescues the entire theory.</>}
      />

      <div className="lesson">
        <h2>The bound goes to infinity; reality doesn&rsquo;t</h2>
        <p>
          Take the simplest infinite class imaginable — <strong>threshold classifiers</strong> on the real line,{" "}
          <M>{String.raw`h_t(x) = \mathbb 1[x > t]`}</M>, one hypothesis per real number <M>t</M>. Our bound says
          you need
        </p>
        <MathBlock>{String.raw`n \;\ge\; \frac{\ln|\mathcal H| + \ln(1/\delta)}{\varepsilon} \;=\; \frac{\infty + \ln(1/\delta)}{\varepsilon} \;=\; \infty.`}</MathBlock>
        <p>
          Infinitely many examples to learn a single threshold. Meanwhile, anyone can learn a threshold from about
          twenty points, and you could do it by hand. The theory isn&rsquo;t merely loose here; it is{" "}
          <em>useless</em>, and by exactly the same argument it&rsquo;s useless for linear regression, logistic
          regression, SVMs, trees with continuous splits, and every neural network ever trained.
        </p>
        <p>
          When a theorem gives an absurd answer to an easy question, the assumption is wrong. Here the culprit is
          identifiable and singular: <strong>we counted hypotheses.</strong>
        </p>

        <h2>The sample cannot tell most of them apart</h2>
        <p>
          Go back to why <M>{String.raw`\ln|\mathcal H|`}</M> appeared. It came from a union bound over the class —
          we charged ourselves once for every hypothesis that might fool us. But two hypotheses that assign{" "}
          <em>identical labels to every point in the sample</em> cannot fool us differently. Their empirical risks
          are the same number. They are, as far as the entire argument is concerned, the same hypothesis, and
          charging twice for them is double-counting.
        </p>
        <p>
          So how many <em>genuinely different</em> threshold classifiers are there, on a specific sample of{" "}
          <M>n</M> points? The threshold can fall before all of them, between the first and second, between the
          second and third, and so on, or after all of them. Thresholds within the same gap produce byte-identical
          predictions.
        </p>

        <BehavioursFigure />

        <p>
          Uncountably many hypotheses collapse to exactly <M>{String.raw`n + 1`}</M> distinguishable behaviours.
          Substitute that for <M>{String.raw`|\mathcal H|`}</M> and the sample complexity becomes{" "}
          <M>{String.raw`(\ln(n+1) + \ln(1/\delta))/\varepsilon`}</M> — small, sane, and matching the twenty-odd
          points your intuition already quoted.
        </p>

        <Callout color={GRAY} title={<>The shift, stated once</>}>
          <strong>Capacity is not how many hypotheses a class contains. It is how many distinct patterns the class
          can paint on a finite sample.</strong> A class with infinitely many members can have tiny capacity
          (thresholds); this is the single idea that makes learning theory apply to real models. Everything in the
          rest of this chapter is a way of measuring that number.
        </Callout>

        <h2>Two ways to measure it, and one warning</h2>
        <p>
          The rest of this chapter develops the two standard measures, and they answer subtly different questions.
        </p>
        <ul>
          <li>
            <strong>The growth function and VC dimension</strong> count behaviours in the <em>worst case</em> over
            all possible samples. They are combinatorial, distribution-free, and give bounds that hold no matter
            what data you get — which is also why they can be pessimistic.
          </li>
          <li>
            <strong>Rademacher complexity</strong> instead measures how well the class can fit <em>random
            noise</em> on your actual data distribution. It&rsquo;s distribution-dependent, so it gives tighter
            bounds — and it&rsquo;s the one you can actually estimate from data you have.
          </li>
        </ul>
        <p>
          One warning before we start. It is tempting to read &ldquo;capacity&rdquo; as &ldquo;number of
          parameters&rdquo;, and for many familiar models the two do coincide. But the identification is false in
          general — there are one-parameter classes with infinite capacity, and we&rsquo;ll build one explicitly on
          the{" "}
          <Link href="/learn/learning-theory/vc-dimension" style={link}>next page</Link>. Parameters are a
          convenient proxy, never the definition. Modern over-parameterized networks are exactly where that
          distinction stops being pedantry and starts being the whole puzzle — which the{" "}
          <Link href="/learn/learning-theory/when-the-bounds-break" style={link}>final chapter</Link> takes head on.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/empirical-risk-minimization", label: <>← Empirical risk minimization</> }}
          next={{ href: "/learn/learning-theory/vc-dimension", label: <>Next up · Shattering &amp; VC dimension →</> }}
        />
      </div>
    </article>
  );
}
