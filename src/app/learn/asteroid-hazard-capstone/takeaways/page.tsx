import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { SkyPanel } from "@/components/figures/SkyPanel";
import { AnalystQuestion, TransferBox } from "@/components/capstone/pedagogy";
import { asset } from "@/lib/asset";

export const metadata = {
  title: "Verdict, playbook & notebook — Manifold",
  description:
    "The verdict: a random forest at PR-AUC 0.478 on the honest grouped split — a genuine +0.19 over the size-rule baseline, at the information ceiling three features allow. Plus the full 20-rule Data-Science Playbook to reuse on any dataset, a reproducible notebook, and an interview-style defence.",
};

const SPACE = "var(--c-space)";

const PLAYBOOK: { phase: string; rules: string[] }[] = [
  {
    phase: "Frame the field",
    rules: [
      "Research the domain — find the data dictionary, the target's official definition, and units, before forming opinions.",
      "Read the target's definition literally — a feature that helped define the label is a gimme or leakage; measure lift beyond it.",
      "Write falsifiable hypotheses before you model — a committed prediction beats post-hoc storytelling.",
    ],
  },
  {
    phase: "First contact & integrity",
    rules: [
      "Meet the data in five minutes (shape, dtypes, head, missingness), then answer “what is one row?”",
      "Audit integrity — dead columns, class balance, and whether an entity repeats across rows.",
      "Hunt redundancy — correlate everything; ±1 or a constant ratio means one feature in disguise.",
    ],
  },
  {
    phase: "Explore to hypotheses",
    rules: [
      "Measure skew before transforming; match the transform to what each variable already is.",
      "Measure each feature's separation, then re-measure conditioned on the dominant feature.",
      "Turn every plot into a falsifiable number and record a verdict; prize the revisions.",
    ],
  },
  {
    phase: "Lock the harness",
    rules: [
      "Choose the metric from the cost of each error — rare positives favour PR-AUC.",
      "Lock the split by group structure before modelling; measure the leakage gap.",
      "Baseline first — judge every model by its margin over the simplest sensible rule, not chance.",
    ],
  },
  {
    phase: "Model, rung by rung",
    rules: [
      "Start with an interpretable model and read its parameters before its score.",
      "Diagnose overfitting by the train–test gap across a capacity knob; tune to the peak.",
      "Bag a high-variance model to cut variance, then re-confirm the lift on the honest harness.",
      "Treat a stronger model class as a hypothesis; keep it only if it beats simpler by more than noise.",
      "Pick the model by margin over baseline weighed against cost; on a plateau, ship the simplest.",
      "A threshold is a cost decision, not a default — sweep it, set it from real costs, expose it as a knob.",
    ],
  },
  {
    phase: "Interpret & hand off",
    rules: [
      "Interpret with an unbiased method (permutation/SHAP) and triangulate across methods and the domain.",
      "Name the limits and trace them to the data; a plateau is usually an information ceiling more data fixes.",
    ],
  },
];

const DEFEND: { q: string; a: React.ReactNode }[] = [
  {
    q: "Your best PR-AUC is 0.478 — is that actually good?",
    a: <>Judged against the right bar, yes. Chance (prevalence) is 0.097 and the sensible size-rule baseline is 0.289; 0.478 is <strong>+0.19 over the baseline</strong> — a near-doubling of the honest signal. And the forest and boosting converging there says it&rsquo;s the ceiling these three features allow, not a model that gave up. &ldquo;Good&rdquo; is always relative to a baseline and a ceiling, not an absolute number.</>,
  },
  {
    q: "Why a grouped split? What would a random split have told you?",
    a: <>Because one object appears in up to 43 rows, a random split leaks the same asteroid into train and test. The <em>same</em> forest scores 0.566 under a random split and 0.478 under the honest grouped one — that 0.088 is pure memorisation. I report 0.478 and discard 0.566; a random split would have had me ship a model 0.088 worse than advertised.</>,
  },
  {
    q: "Why PR-AUC instead of accuracy or ROC-AUC?",
    a: <>The problem is 9.73% positive with an asymmetric cost (a missed hazard dwarfs a false alarm). Accuracy rewards a do-nothing model at 90.3%; ROC-AUC is anaesthetised by the easy negatives and clusters every real model between 0.88 and 0.91. PR-AUC keeps its eyes on the rare class and spreads the models five times wider — it&rsquo;s the only metric here with the resolution to choose.</>,
  },
  {
    q: "The forest's built-in importance said velocity mattered most. Did you believe it?",
    a: <>No — impurity importance is biased toward high-cardinality features, and velocity has many more distinct values. Permutation importance (unbiased) says miss distance matters far more than velocity, which agrees with both the logistic coefficients and the conditional-AUC analysis. Three methods that fail differently converge; the lone dissenter had a known bias.</>,
  },
  {
    q: "Why isn't gradient boosting better than the forest?",
    a: <>They tie (0.472 vs 0.478, inside noise). With only three features and most signal being the blunt size gate, there&rsquo;s little residual structure for boosting&rsquo;s sequential correction to exploit. A tie between a stronger and a simpler model is evidence you&rsquo;re at the data&rsquo;s ceiling — the signal to stop tuning, not to search harder.</>,
  },
  {
    q: "What can this model never do?",
    a: <>Reproduce the label perfectly. The PHA flag needs MOID (minimum orbit intersection distance), which our data lacks — the forest proxies it with a single flyby&rsquo;s miss distance. That missing half of the definition is exactly why the score plateaus near 0.48. The fix is more <em>data</em> (orbital elements), not more model.</>,
  },
];

export default function TakeawaysPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 6 · Interpret & hand off", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>Verdict, playbook &amp; notebook</>}
        intro={<>
          The last mile: state the verdict without hedging, hand over the transferable artifact this whole capstone was
          really about — the Playbook — and make every number reproducible. Then prove to yourself the thinking
          transferred, on data nobody framed for you.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <SkyPanel motif seed={5}>
          <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--space-faint)", fontWeight: 600, marginBottom: 8 }}>
            The verdict
          </div>
          <div style={{ fontSize: 19, lineHeight: 1.5, color: "var(--space-ink)", maxWidth: "42ch" }}>
            A <strong>random forest</strong> at <strong>PR-AUC 0.478</strong> on the honest grouped split — a genuine{" "}
            <strong>+0.19</strong> over the size-rule baseline, and at the information ceiling three features allow.
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--space-ink-soft)", marginTop: 12, maxWidth: "52ch" }}>
            A dumb &ldquo;is it big?&rdquo; rule looked brilliant on ROC-AUC (0.87) and collapsed on the honest metric
            (0.28). The real work was choosing a metric and a split that couldn&rsquo;t lie, then wringing the bounded,
            genuine lift out of miss distance once size had done the obvious. That is the whole capstone.
          </div>
        </SkyPanel>

        <AnalystQuestion>
          What did I learn here that I can <em>reuse</em> on the next dataset — and can I hand someone a reproducible,
          defensible result?
        </AnalystQuestion>

        <h2>The Data-Science Playbook</h2>
        <p>
          This is the real deliverable — not the 0.478, but the twenty transferable moves that produced it. Each was
          banked one page at a time; here they are as one checklist you can paste into your next project, in any field.
        </p>
        <div style={{ display: "grid", gap: 14, margin: "18px 0 6px" }}>
          {PLAYBOOK.map((group, gi) => {
            const start = PLAYBOOK.slice(0, gi).reduce((n, g) => n + g.rules.length, 0);
            return (
              <div key={group.phase} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", overflow: "hidden" }}>
                <div style={{ fontSize: 11.5, letterSpacing: "0.07em", textTransform: "uppercase", color: SPACE, fontWeight: 600, padding: "9px 14px", background: "color-mix(in srgb, var(--c-space) 6%, var(--surface))", borderBottom: "1px solid var(--border)" }}>
                  {group.phase}
                </div>
                <ol style={{ margin: 0, padding: "8px 0" }}>
                  {group.rules.map((r, i) => (
                    <li key={i} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "6px 14px", listStyle: "none" }}>
                      <span className="font-display" style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: SPACE, width: 20 }}>{start + i + 1}</span>
                      <span style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.55 }}>{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>

        <h2 id="reproduce-it-yourself">Reproduce every number</h2>
        <p>
          Don&rsquo;t take our word for a single figure. The bundled dataset and the full analysis — every stage from
          integrity to the operating point, as one runnable notebook — are yours. Run it top to bottom; it reproduces
          each published number deterministically.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "0 0 1.4rem" }}>
          {[
            { href: "/capstone/neo-hazard-capstone.ipynb", name: "neo-hazard-capstone.ipynb", desc: "the full pipeline as a Jupyter notebook — integrity, the leakage experiment, the models, interpretation, and the operating point" },
            { href: "/capstone/neo_v2.csv", name: "neo_v2.csv", desc: "90,836 near-Earth-object approaches (the raw dataset, landmines included)" },
          ].map((f) => (
            <a key={f.name} href={asset(f.href)} download style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textDecoration: "none" }}>
              <span className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--brand)" }}>↓ {f.name}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{f.desc}</span>
            </a>
          ))}
        </div>

        <h2>Defend it: the interview test</h2>
        <p>
          A capstone you can&rsquo;t defend is a tutorial you followed. Answer each of these out loud — the questions a
          skeptical panel actually asks — then check yourself.
        </p>
        {DEFEND.map((d) => (
          <details key={d.q} style={detailsBox}>
            <summary style={summaryRow}>{d.q}</summary>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--muted)", padding: "8px 2px 4px" }}>{d.a}</div>
          </details>
        ))}

        <Callout color={SPACE} title={<>Now prove the thinking transferred</>}>
          The 0.478 stays here; the Playbook comes with you. The final two pages are your graduation — the same twenty
          moves on two datasets nobody framed for you: one near (pulsars — new features, familiar sky) and one far (bank
          marketing — a cold field with a different trap). Framing questions, no answers. If you can run the Playbook
          there, you didn&rsquo;t read a capstone — you acquired one.
        </Callout>

        <TransferBox>
          Before opening the transfer tests, screenshot or copy the Playbook above. Try to run it from memory on the next
          two datasets, peeking only when stuck. The rules you reach for <em>without</em> looking are the ones that truly
          transferred.
        </TransferBox>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/limits", label: <>← Limits: what it can never know</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/transfer-near", label: <>Next up · Transfer test I · Pulsars →</> }}
        />
      </div>
    </article>
  );
}

const detailsBox: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", margin: "0 0 8px" };
const summaryRow: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: "var(--ink)", cursor: "pointer" };
