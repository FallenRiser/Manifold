import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ConvexityLab } from "@/components/labs/ConvexityLab";

export const metadata = {
  title: "Convex sets & convex functions — Manifold",
  description:
    "A convex function has a single valley and no traps — which is why convex losses are the ones we can optimize with confidence. The test is simple: the chord between any two points never dips below the curve.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ConvexityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Convex sets &amp; convex functions</>}
        intro={<>Why can we trust gradient descent on some problems and not others? The dividing line is convexity. A
          convex loss has exactly one valley, so downhill always leads home; a non-convex one can trap you in a local
          dip. It&rsquo;s the property that separates &ldquo;solved&rdquo; from &ldquo;hard.&rdquo;</>}
      />

      <div className="lesson">
        <h2>The chord test</h2>
        <p>
          A function is <strong>convex</strong> if, for any two points on its graph, the straight chord between them
          lies on or above the curve. Formally, for any <M>{String.raw`t\in[0,1]`}</M>:
        </p>
        <MathBlock>{String.raw`f\big(t\,a + (1-t)\,b\big) \;\le\; t\,f(a) + (1-t)\,f(b).`}</MathBlock>
        <p>
          The left side is the curve; the right side is the chord. &ldquo;Curve never above chord&rdquo; is the whole
          definition — a bowl that holds water. A <strong>convex set</strong> is the same idea for regions: the line
          segment between any two points in the set stays inside it.
        </p>

        <PredictPrompt
          accent={AMBER}
          prompt={<>For the double-well (non-convex) function, will you be able to find two points whose chord dips
            <em> below</em> the curve?</>}
          options={["Yes, easily", "No, chords always stay above", "Only if the points are identical"]}
        />

        <LabFrame
          accent={AMBER}
          tryThis={<>On the convex parabola, drag the two points anywhere — can you ever get the chord to dip below?
            Switch to the non-convex double-well and try again.</>}
          insight={<>On the convex curve the chord is always on or above it, no matter where you drag. On the
            double-well you can straddle the hump and the chord cuts underneath — the visual signature of
            non-convexity, and of the local minima that trap naive optimizers.</>}
        >
          <ConvexityLab />
        </LabFrame>

        <h2>Why convexity is the prize</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Every local minimum is global.</strong> There&rsquo;s only one valley, so <Link href="/learn/math-foundations/gradient-descent" style={link}>gradient descent</Link> can&rsquo;t get stuck in a bad one — downhill always reaches the best answer.</li>
          <li><strong>A zero gradient means you&rsquo;re done.</strong> On a convex function, <M>{String.raw`\nabla f = 0`}</M> certifies the global optimum; no need to wonder if a better point hides elsewhere.</li>
          <li><strong>It&rsquo;s checkable.</strong> A twice-differentiable function is convex exactly when its <Link href="/learn/math-foundations/spd-matrices" style={link}>Hessian is positive semidefinite</Link> everywhere — curvature that never turns downward.</li>
        </ul>

        <h2>Who&rsquo;s convex and who isn&rsquo;t</h2>
        <p>
          <strong>Convex:</strong> linear and ridge/lasso regression, logistic regression, SVMs — their losses are
          bowls, which is why they train reliably to a unique answer. <strong>Non-convex:</strong> neural networks,
          k-means, most deep models — riddled with local minima and saddles, which is why training them is an art of
          good initialisation, momentum, and stochasticity rather than a guarantee. Knowing which camp a model is in
          tells you how much to trust its training.
        </p>

        <Callout color={AMBER} title={<>The practical upshot</>}>
          When you can <em>formulate</em> a problem convexly — a well-chosen loss, a convex surrogate for a nasty
          objective — you buy certainty: one minimum, reachable by descent, no restarts needed. Half of classical ML
          is the search for convex formulations of problems that look hopeless at first. It&rsquo;s worth a lot.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/chain-rule", label: <>← The chain rule</> }}
          next={{ href: "/learn/math-foundations/gradient-descent", label: <>Next up · Gradient descent →</> }}
        />
      </div>
    </article>
  );
}
