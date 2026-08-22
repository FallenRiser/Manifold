import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Model comparison — did complexity earn its keep? — Manifold",
  description:
    "One honest scoreboard, one metric, one split. PR-AUC climbs 0.289 (size rule) → 0.309 (logistic) → 0.435 (tuned tree) → 0.478 (random forest) ≈ 0.472 (boosting). The forest wins, complexity paid off up to bagging and then stopped — and ROC-AUC, clustered at ~0.88–0.91, would have hidden every one of these distinctions.",
};

const SPACE = "var(--c-space)";

// Grouped-split scoreboard (scripts/neo_cases.py). PR-AUC is the committed metric.
const ROWS = [
  { name: "Majority (chance)", pr: 0.1, kind: "floor" as const },
  { name: "Size rule (−H)", pr: 0.289, kind: "baseline" as const },
  { name: "Logistic", pr: 0.309, kind: "model" as const },
  { name: "Tuned tree (d=8)", pr: 0.435, kind: "model" as const },
  { name: "Random forest", pr: 0.478, kind: "winner" as const },
  { name: "Hist boosting", pr: 0.472, kind: "model" as const },
];
const BASE = 0.289;
const AXIS = 0.55;

function Scoreboard() {
  const pct = (v: number) => `${(v / AXIS) * 100}%`;
  const color = (k: string) => (k === "winner" ? SPACE : k === "baseline" ? "var(--ink)" : k === "floor" ? "var(--faint)" : "var(--muted)");
  return (
    <div style={{ margin: "20px 0 6px", padding: "16px 18px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ display: "grid", gap: 10 }}>
        {ROWS.map((r) => {
          const margin = r.pr - BASE;
          return (
            <div key={r.name} style={{ display: "grid", gridTemplateColumns: "128px 1fr 96px", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12.5, color: r.kind === "winner" ? SPACE : "var(--ink)", fontWeight: r.kind === "winner" ? 600 : 400, textAlign: "right" }}>{r.name}</span>
              <div style={{ position: "relative", height: 20, background: "var(--surface)", borderRadius: 5, border: "1px solid var(--border)" }}>
                <div style={{ position: "absolute", left: pct(BASE), top: -3, bottom: -3, width: 2, background: "var(--ink)", opacity: 0.5 }} />
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(r.pr), background: color(r.kind), borderRadius: 5, opacity: r.kind === "floor" ? 0.5 : 1 }} />
              </div>
              <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>
                {r.pr.toFixed(3)}
                {r.kind !== "floor" && r.kind !== "baseline" && (
                  <span style={{ color: margin > 0 ? "var(--good)" : "var(--bad)", marginLeft: 5 }}>
                    {margin >= 0 ? "+" : ""}{margin.toFixed(3)}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 10, textAlign: "right" }}>
        PR-AUC on the grouped split · vertical line = size-rule baseline (0.289) · +/− = margin over it
      </div>
    </div>
  );
}

export default function ModelComparisonPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>Model comparison — did complexity earn its keep?</>}
        intro={<>
          Five models climbed on one locked harness. Now we lay them side by side and ask the only question that matters:
          which one do we ship, and did each added layer of complexity actually <em>pay</em> for itself in the metric we
          committed to?
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Which model wins on the metric I chose — and did every step up in complexity buy enough lift to justify its
          cost?
        </AnalystQuestion>

        <h2>The scoreboard</h2>
        <p>
          One metric (PR-AUC), one split (grouped), every model measured the same way. Read it as margins over the size
          rule — because beating &ldquo;is it big?&rdquo; is the whole job.
        </p>

        <Scoreboard />

        <h2>Reading the climb, rung by rung</h2>
        <ul style={ul}>
          <li><strong>Logistic (+0.020).</strong> Barely beat the one-liner — a linear boundary can&rsquo;t use the leftover signal. Cheap, interpretable, but not the answer.</li>
          <li><strong>Tuned tree (+0.146).</strong> The big jump. Bending non-linearly is what unlocked the kinematic signal among big objects. Complexity clearly earned its keep here.</li>
          <li><strong>Random forest (+0.189).</strong> The winner. Averaging tamed the tree&rsquo;s variance for another solid gain — and it needed essentially no tuning.</li>
          <li><strong>Hist boosting (+0.183).</strong> Tied the forest. A stronger class with nothing extra to exploit; it does not justify its added tuning burden here.</li>
        </ul>

        <Callout color={SPACE} title={<>The verdict: random forest — and where complexity stopped paying</>}>
          Complexity paid handsomely from the size rule up to the forest (+0.189 in total), then flat-lined: boosting
          bought nothing over bagging. So we ship the <strong>random forest at PR-AUC 0.478</strong> — the best honest
          score, cheap to train, and no worse than the more elaborate model. The general shape — big gains, then a plateau
          — is the normal signature of a modelling climb, and the plateau is the signal to stop.
        </Callout>

        <h2>The quiet vindication of the metric choice</h2>
        <p>
          One more thing the scoreboard hides unless you go looking: on <strong>ROC-AUC</strong>, every real model here
          scores between about <strong>0.877 and 0.906</strong> — a spread of three-hundredths that would have made them
          look interchangeable. On PR-AUC the same models spread from 0.309 to 0.478, a gap five times larger.{" "}
          <em>The metric we chose back in Act 4 is the reason this comparison has any resolution at all.</em> Had we
          graded on ROC-AUC, we&rsquo;d have declared a near-tie and possibly shipped the wrong model.
        </p>

        <TransferBox>
          Compare every candidate on <em>one</em> honest harness and the <em>one</em> metric you committed to, and read
          results as margin over a sensible baseline. Expect a climb that plateaus — and when it does, prefer the
          simplest model on the plateau (cheapest to run, easiest to explain and monitor). The most complex model that
          merely ties a simpler one is a liability, not an achievement.
        </TransferBox>

        <PlaybookRule n={17}>
          Pick the model by <strong>margin over baseline weighed against cost</strong>, on one honest harness and your
          chosen metric. Complexity must <em>earn</em> its keep; on a plateau, ship the simplest model that reaches it.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/gradient-boosting", label: <>← Gradient boosting</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/operating-point", label: <>Next up · Choosing the operating point →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
