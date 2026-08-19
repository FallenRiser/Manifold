import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NuSvrLab } from "@/components/labs/NuSvrLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "ν-SVR: controlling the support vectors — Manifold",
  description:
    "ε is hard to set — it lives in the units of y, and you rarely know the noise scale in advance. ν-SVR replaces it with ν, a knob in [0,1] that directly bounds the fraction of support vectors and errors, letting the tube width tune itself.",
};

export default function NuSvrPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 3 · a variant", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>ν-SVR: controlling the support vectors</>}
        intro={<>
          The awkward thing about <M>{String.raw`\varepsilon`}</M> is that you must set it in the units of{" "}
          <M>{String.raw`y`}</M>, before you know the noise scale. ν-SVR swaps it for a dimensionless dial with a
        guarantee attached — and lets the tube width become something the model learns.
        </>}
      />

      <div className="lesson">
        <h2>The problem with ε</h2>
        <p>
          In standard <Link href="/learn/support-vector-regression/the-epsilon-insensitive-loss" style={inlineLink}>ε-SVR</Link>,
          the tube half-width <M>{String.raw`\varepsilon`}</M> is a raw number in the target&rsquo;s units. Pick it too
          large and the tube swallows the signal; too small and nearly every point becomes a support vector. Getting
          it right means knowing the noise level in advance — exactly what you are usually trying to discover. You
          end up grid-searching a parameter with no natural scale.
        </p>

        <h2>ν-SVR: dial a fraction instead</h2>
        <p>
          Schölkopf&rsquo;s <strong>ν-SVR</strong> reparameterises the problem. It <em>removes</em>{" "}
          <M>{String.raw`\varepsilon`}</M> from your hands and makes it a variable the optimiser chooses, adding a
          new hyperparameter <M>{String.raw`\nu \in (0, 1]`}</M> that trades off the tube width against violations:
        </p>
        <MathBlock>{String.raw`\min_{w,\,b,\,\xi,\,\varepsilon}\ \tfrac{1}{2}\lVert w\rVert^2 + C\!\left(\nu\,\varepsilon + \tfrac{1}{n}\sum_i (\xi_i + \xi_i^*)\right)`}</MathBlock>
        <p>
          Now <M>{String.raw`\varepsilon`}</M> is inside the objective, multiplied by <M>{String.raw`\nu`}</M>. The
          optimiser shrinks the tube on its own until further shrinking costs more in violations than it saves — the
          width tunes itself to the data&rsquo;s noise scale.
        </p>

        <Callout color="var(--c-regression)" title={<>The ν guarantee</>}>
          The elegant result Schölkopf proved: <M>{String.raw`\nu`}</M> is simultaneously
            <strong> an upper bound on the fraction of points that are errors</strong> (lie outside the tube) and
            <strong> a lower bound on the fraction that are support vectors</strong>. Set{" "}
            <M>{String.raw`\nu = 0.1`}</M> and you are telling the model: &ldquo;at most ~10% of my data may fall outside
            the tube, and at least ~10% will define it.&rdquo; A hyperparameter with a directly interpretable meaning.
        </Callout>

        <p>
          Watch the guarantee hold. Drag <M>{String.raw`\nu`}</M> below and the model finds the tube width for you;
          the readout always keeps <strong>error fraction ≤ ν ≤ support-vector fraction</strong>, and the fit stays
          sensible throughout:
        </p>
        <NuSvrLab />

        <h2>Why that is easier to reason about</h2>
        <ul style={ul}>
          <li><strong>It is dimensionless.</strong> <M>{String.raw`\nu \in (0,1]`}</M> means the same thing whether <M>{String.raw`y`}</M> is in dollars or nanometres — unlike <M>{String.raw`\varepsilon`}</M>, which you must rescale with the target.</li>
          <li><strong>It encodes a prior you actually have.</strong> You often have a rough sense of what fraction of your data are outliers or noise; you rarely know the noise standard deviation to three digits.</li>
          <li><strong>It caps model size.</strong> Because <M>{String.raw`\nu`}</M> lower-bounds the support-vector fraction, it puts a floor on sparsity you can set deliberately — handy when prediction cost matters.</li>
        </ul>

        <h2>In code</h2>
        <p>
          scikit-learn exposes it as a drop-in estimator. The kernel, <M>{String.raw`C`}</M>, and{" "}
          <M>{String.raw`\gamma`}</M> behave exactly as in ε-SVR; only the tube knob changes:
        </p>
        <CodeBlock fromScratch={code} />

        <Callout color="var(--c-regression)" title={<>Which to use?</>}>
          They fit the <em>same</em> family of models — every ν-SVR solution corresponds to some ε-SVR solution and
            vice versa. Reach for <strong>ν-SVR</strong> when you want to control sparsity or the error fraction
            directly, or when <M>{String.raw`\varepsilon`}</M> has no natural scale. Stick with{" "}
            <strong>ε-SVR</strong> when you genuinely know the tolerance you want (e.g. &ldquo;errors under 0.5&nbsp;mm are
            fine&rdquo;) — there, setting <M>{String.raw`\varepsilon`}</M> directly is the clearer statement.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "What does ν-SVR do with the tube width ε?",
              options: ["Turns it into a variable the optimiser chooses, controlled indirectly by ν", "Fixes it at zero", "Makes it infinitely wide"],
              answer: 0,
              explain: "ε moves inside the objective (multiplied by ν), so the model learns the tube width instead of you setting it in the units of y.",
            },
            {
              q: "The parameter ν ∈ (0,1] bounds…",
              options: ["The fraction of errors (above) and the fraction of support vectors (below)", "The kernel width", "The learning rate"],
              answer: 0,
              explain: "ν is an upper bound on the fraction of out-of-tube points and a lower bound on the support-vector fraction — a directly interpretable dial.",
            },
            {
              q: "A practical reason to prefer ν over ε is…",
              options: ["ν is dimensionless and encodes a prior you often have (the rough outlier fraction)", "ν makes the model linear", "ν removes the kernel"],
              answer: 0,
              explain: "You rarely know the noise scale of y in advance (needed for ε), but you often have a sense of what fraction of points are outliers (which ν sets).",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/hyperparameters-c-epsilon-gamma", label: <>← Hyperparameters: C, ε, γ</> }} next={{ href: "/learn/support-vector-regression/kernel-ridge-vs-svr", label: <>Next up · Kernel ridge vs SVR →</> }} />
      </div>
    </article>
  );
}

const code = `from sklearn.svm import NuSVR
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

# nu replaces epsilon: bound the SV / error fraction at ~20%
model = make_pipeline(
    StandardScaler(),
    NuSVR(kernel="rbf", nu=0.2, C=10, gamma="scale"),
).fit(X_train, y_train)

sv_frac = model[-1].support_.shape[0] / len(y_train)
print("support-vector fraction:", round(sv_frac, 3))  # >= nu`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
