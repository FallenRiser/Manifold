import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Distributions & transforms — Manifold",
  description:
    "The shape of each variable decides whether it needs a transform — and the reflex to log every 'astronomical' quantity is wrong here. Absolute magnitude is already a log scale, miss distance is already symmetric, and only relative velocity earns a log. Check skew before you transform.",
};

const SPACE = "var(--c-space)";

// Normalised histogram bar heights from scripts/neo_cases.py (rounded); a static,
// server-rendered mini-histogram — no interactivity, so no client component needed.
const H_BINS = [0, 0, 0, 0, 0.004, 0.013, 0.049, 0.109, 0.278, 0.511, 0.76, 0.833, 0.782, 0.976, 1, 0.881, 0.596, 0.295, 0.111, 0.034, 0.01, 0.001];
const VEL_RAW = [0.114, 0.596, 1, 0.901, 0.844, 0.685, 0.496, 0.307, 0.195, 0.107, 0.064, 0.036, 0.019, 0.009, 0.005, 0.001, 0.001, 0, 0, 0, 0, 0];
const VEL_LOG = [0, 0, 0, 0, 0, 0, 0.001, 0.002, 0.003, 0.006, 0.017, 0.035, 0.089, 0.216, 0.448, 0.729, 0.879, 1, 0.69, 0.243, 0.039, 0.001];
const MISS_BINS = [1, 0.77, 0.66, 0.59, 0.57, 0.57, 0.58, 0.57, 0.6, 0.62, 0.64, 0.65, 0.65, 0.67, 0.67, 0.67, 0.64, 0.67, 0.68, 0.67, 0.68, 0.68];

function Histo({ bins, label, note, accent }: { bins: number[]; label: string; note: string; accent: string }) {
  const w = 200, h = 76, n = bins.length, bw = w / n;
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${w} ${h + 4}`} width="100%" height="auto" role="img" aria-label={`${label}: ${note}`}>
        {bins.map((v, i) => (
          <rect key={i} x={i * bw + 0.6} y={h - v * h} width={bw - 1.2} height={Math.max(v * h, 0.6)} rx={0.8} fill={accent} opacity={0.82} />
        ))}
        <line x1={0} y1={h + 0.5} x2={w} y2={h + 0.5} stroke="var(--border-strong)" strokeWidth={1} />
      </svg>
      <figcaption style={{ marginTop: 6 }}>
        <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>{note}</div>
      </figcaption>
    </figure>
  );
}

export default function DistributionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 3 · Explore & analyse", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Distributions &amp; transforms</>}
        intro={<>
          With the data trusted and trimmed to three real features, the first exploratory move is to look at the{" "}
          <em>shape</em> of each one. Shape decides whether a variable needs a transform — and this is exactly where a
          popular reflex quietly does damage.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          What shape is each variable — and does that shape actually <em>demand</em> a transform, or am I about to apply
          one out of habit?
        </AnalystQuestion>

        <h2>Why shape matters, and the reflex to distrust</h2>
        <p>
          Heavy skew and long tails can hurt: a few extreme values dominate a distance metric, tilt a least-squares fit,
          and squash every plot into an unreadable corner. So &ldquo;log-transform the skewed, heavy-tailed
          quantities&rdquo; becomes a reflex — and for revenue, populations, or file sizes it&rsquo;s usually right. The
          reflex here would be: <em>&ldquo;these are astronomical quantities spanning orders of magnitude — log them
          all.&rdquo;</em> Resist it. The correct move is to <strong>measure the skew and understand what each variable
          already is</strong>, then transform only what earns it.
        </p>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{`skew (raw):
  absolute_magnitude  -0.14     <- already near-symmetric
  relative_velocity    0.91     <- right-skewed
  miss_distance       -0.04     <- already near-symmetric

skew after log:
  relative_velocity   ~symmetric (bell)    <- log HELPS
  miss_distance       -1.96 (worse!)       <- log HURTS`}</CodeOutput>

        <div style={grid}>
          <Histo bins={H_BINS} accent={SPACE} label="absolute_magnitude (H)" note="Already a bell. Leave it — H is a magnitude, i.e. already a log scale." />
          <Histo bins={VEL_RAW} accent="var(--muted)" label="relative_velocity (raw)" note="Right-skewed, long tail. A transform is worth trying." />
          <Histo bins={VEL_LOG} accent="var(--good)" label="relative_velocity (log₁₀)" note="Log turns it into a clean bell — this is the one that earns it." />
          <Histo bins={MISS_BINS} accent={SPACE} label="miss_distance" note="Already flat/symmetric. Logging it would CREATE skew, not remove it." />
        </div>

        <h2>Reading the three shapes honestly</h2>
        <ul style={ul}>
          <li>
            <strong><code>absolute_magnitude</code> is already a bell.</strong> Skew −0.14. This surprises people until
            they remember what magnitude <em>is</em>: an astronomical magnitude is defined on a logarithmic brightness
            scale. It&rsquo;s already the log of the physical quantity. Logging it again would be logging a log —
            meaningless. Leave it alone.
          </li>
          <li>
            <strong><code>relative_velocity</code> is genuinely right-skewed</strong> (skew 0.91) with a long fast tail.
            A log turns it into a clean, near-symmetric bell. This is the one feature where the reflex is
            correct — and we&rsquo;d apply the transform inside the pipeline, fit on training data only.
          </li>
          <li>
            <strong><code>miss_distance</code> is already flat/symmetric</strong> (skew −0.04) — close approaches are
            spread fairly evenly out to the ~7.5 million km horizon of the dataset. Applying a log here would take a
            symmetric variable and <em>introduce</em> a −1.96 left skew. The reflex would have actively made it worse.
          </li>
        </ul>

        <Callout color={SPACE} title={<>One of three earns a transform — the reflex would have harmed two</>}>
          Had we &ldquo;logged all the astronomical quantities,&rdquo; we&rsquo;d have logged a variable that&rsquo;s
          already a log (H, meaningless) and a variable that&rsquo;s already symmetric (miss distance, actively worse),
          to fix the one that needed it (velocity). This is the whole point of <em>looking</em> before transforming:
          shape is an empirical question with a per-variable answer, not a policy you apply to a whole table.
        </Callout>

        <TransferBox>
          Before transforming anything, print the skew of every numeric column and ask what each variable{" "}
          <em>physically is</em>. Is it already on a log scale (decibels, pH, magnitudes, Richter)? Is it a bounded
          proportion (logit, not log)? Is it a count (consider a √ or a count model)? Match the transform to the
          variable&rsquo;s nature and its measured skew — never to a blanket habit.
        </TransferBox>

        <PlaybookRule n={7}>
          <strong>Measure skew before you transform.</strong> Match the transform to what each variable already is —
          logging a log-scale or an already-symmetric feature adds distortion. Look per-variable; never transform a whole
          table by reflex.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/redundancy", label: <>← Redundancy: one feature in disguise</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/separation", label: <>Next up · What separates the classes? →</> }}
        />
      </div>
    </article>
  );
}

const code =`import numpy as np

feats = ["absolute_magnitude", "relative_velocity", "miss_distance"]
print(df[feats].skew())                       # raw skew

# does a log actually help each one?
for c in feats:
    print(c, "log-skew:", np.log(df[c] - df[c].min() + 1).skew())`;

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, margin: "22px 0 6px", padding: "18px 18px 6px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 };
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
