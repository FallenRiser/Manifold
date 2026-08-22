import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Interpretation: does the model agree with reality? — Manifold",
  description:
    "A good score isn't understanding. Permutation importance — an unbiased measure — shows the forest leans on size most, then miss distance, then velocity, resolving the impurity-importance bias flagged earlier and agreeing with the logistic coefficients and the conditional analysis. Three independent methods converge, so we can trust what the model learned.",
};

const SPACE = "var(--c-space)";

// Permutation importance (drop in PR-AUC when a feature is shuffled), grouped test,
// from scripts/neo_cases.py section 9. Static bar figure.
const PERM = [
  { f: "absolute_magnitude", v: 0.378, note: "size — the gate" },
  { f: "miss_distance", v: 0.15, note: "how close it passes" },
  { f: "relative_velocity", v: 0.048, note: "how fast" },
];
const MAXV = 0.4;

export default function InterpretationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 6 · Interpret & hand off", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Interpretation: does the model agree with reality?</>}
        intro={<>
          A winning score is not the same as understanding. Before we trust the forest with a decision, we ask whether
          the logic it learned matches the physics we know — and we resolve the one loose thread from the forest page:
          which kinematic feature it <em>really</em> relies on.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Does the model&rsquo;s internal logic agree with what I know about the domain — and which features is it{" "}
          <em>truly</em> relying on, measured without bias?
        </AnalystQuestion>

        <h2>The move: use an unbiased importance, and cross-check it</h2>
        <p>
          On the forest page we saw the built-in <em>impurity</em> importance rank velocity above miss distance — and we
          flagged it as suspect, because impurity importance is biased toward high-cardinality features (velocity has
          far more distinct values, hence more split opportunities). The fix is <strong>permutation importance</strong>:
          shuffle one feature&rsquo;s values in the test set, and measure how much the score drops. If a feature matters,
          scrambling it should hurt; if it doesn&rsquo;t, nothing happens. It measures reliance on <em>held-out</em>{" "}
          performance, so cardinality can&rsquo;t game it.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`permutation importance (drop in test PR-AUC when shuffled)
  absolute_magnitude   -0.378   (+/- 0.001)
  miss_distance        -0.150   (+/- 0.003)
  relative_velocity    -0.048   (+/- 0.005)

impurity importance said:  velocity 0.195 > miss 0.163  (biased!)
permutation importance says: miss 0.150 >> velocity 0.048`}</CodeOutput>

        <figure style={{ margin: "20px 0 6px", padding: "16px 18px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
          <div style={{ display: "grid", gap: 12 }}>
            {PERM.map((p) => (
              <div key={p.f}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                  <span style={{ color: "var(--ink)" }}><code>{p.f}</code> <span style={{ color: "var(--faint)" }}>· {p.note}</span></span>
                  <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>−{p.v.toFixed(3)}</span>
                </div>
                <div style={{ height: 14, background: "var(--surface)", borderRadius: 4, border: "1px solid var(--border)", overflow: "hidden" }}>
                  <div style={{ width: `${(p.v / MAXV) * 100}%`, height: "100%", background: SPACE }} />
                </div>
              </div>
            ))}
          </div>
          <figcaption style={cap}>
            Permutation importance: how much test PR-AUC falls when each feature is scrambled. Size dominates; miss
            distance is a clear second; velocity is a distant third — the opposite of what impurity importance implied.
          </figcaption>
        </figure>

        <Callout color={SPACE} title={<>Three independent methods now agree</>}>
          This is the moment the story locks. <strong>Conditional AUC</strong> (Act 3), the <strong>logistic
          coefficients</strong> (Act 5), and now <strong>permutation importance</strong> all say the same thing: once
          size has done its work, <em>miss distance matters far more than velocity</em>. Only the biased impurity
          importance disagreed — and we now know exactly why. When several methods that fail in <em>different</em> ways
          converge on one answer, that answer is trustworthy. The lone dissenter was the one with a known bias, so we
          set it aside with confidence rather than hand-waving.
        </Callout>

        <h2>Does the logic match the physics?</h2>
        <p>
          Now read the ranking as a sanity check against the domain, and it lands perfectly. The model leans hardest on{" "}
          <strong>size</strong> — exactly the gate half of the PHA definition it can see directly. Among the kinematics it
          leans on <strong>miss distance</strong> over velocity — precisely because miss distance is the best proxy it has
          for the <em>orbit-closeness</em> half of the definition it <em>can&rsquo;t</em> see (MOID is missing). The
          forest, given no physics, reconstructed the shape of the official rule from the data alone. That agreement
          between a black box and first principles is the strongest evidence yet that the 0.478 is real understanding, not
          a fluke of the split.
        </p>

        <TransferBox>
          Never let a score stand in for understanding. Interrogate any model with an <em>unbiased</em> importance
          (permutation, or SHAP) rather than the convenient built-in, and cross-check it against a simpler model and the
          domain. Convergence across methods that are wrong in different ways is your best signal of truth; a lone
          method disagreeing is a prompt to ask <em>why</em>, not to average them.
        </TransferBox>

        <PlaybookRule n={19}>
          <strong>Interpret with an unbiased method and triangulate.</strong> Confirm the model&rsquo;s logic with
          permutation/SHAP importance, cross-checked against a simple model and the domain — trust the answer several
          different methods agree on.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/operating-point", label: <>← Choosing the operating point</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/limits", label: <>Next up · Limits: what it can never know →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.inspection import permutation_importance

r = permutation_importance(rf, Xte, yte, scoring="average_precision",
                           n_repeats=10, random_state=0)
for f, m in sorted(zip(features, r.importances_mean), key=lambda z: -z[1]):
    print(f, round(m, 3))`;

const cap: React.CSSProperties = { marginTop: 10, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 };
