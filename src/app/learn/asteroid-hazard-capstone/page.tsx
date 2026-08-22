import { Callout, PrevNext } from "@/components/lesson";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { NeoField } from "@/components/figures/NeoField";
import { SkyPanel } from "@/components/figures/SkyPanel";

export const metadata = {
  title: "Capstone: Asteroid hazard — Manifold",
  description:
    "A complete, executed, end-to-end classification project on 90,836 NASA near-Earth objects — worked the way a data scientist works an unfamiliar dataset, and taught for transfer: every step teaches the general move, applies it to the asteroids, then asks you to lift it to your own data. Leads with the honest truth: a naive size rule scores a flattering ROC-AUC 0.87 but a truthful PR-AUC of just 0.29.",
};

const SPACE = "var(--c-space)";
const skyChip: React.CSSProperties = { fontSize: 11.5, letterSpacing: "0.09em", textTransform: "uppercase", borderRadius: 999, padding: "3px 10px" };

export default function NeoCapstoneHubPage() {
  return (
    <article>
      {/* ---------- immersive sky hero (a "special section"; body stays editorial) ---------- */}
      <SkyPanel motif>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ ...skyChip, color: "var(--space-ink)", border: "1px solid color-mix(in srgb, var(--space-safe) 55%, transparent)" }}>Capstone</span>
          <span style={{ ...skyChip, color: "var(--space-faint)", border: "1px solid var(--space-border)" }}>End-to-end · classification</span>
        </div>
        <h1 className="font-display" style={{ fontSize: 48, lineHeight: 1.04, margin: "0 0 14px", maxWidth: 640, color: "var(--space-ink)" }}>
          Is this asteroid worth <em>worrying</em> about?
        </h1>
        <p style={{ fontSize: 17.5, lineHeight: 1.6, maxWidth: 620, margin: 0, color: "var(--space-ink-soft)" }}>
          NASA tracks tens of thousands of rocks that pass near Earth. Almost none are dangerous — so the real job
          is <strong style={{ color: "var(--space-ink)" }}>triage</strong>: which few deserve a human&rsquo;s attention?
          We take one real dataset all the way, the way a data scientist works a field they&rsquo;ve never seen — and
          we do it for <strong style={{ color: "var(--space-ink)" }}>transfer</strong>: the general move first, then
          the asteroids, then your turn.
        </p>
        <div style={{ marginTop: 20, borderTop: "1px solid var(--space-border)", paddingTop: 14 }}>
          <NeoField onDark />
          <div style={{ fontSize: 12.5, color: "var(--space-faint)", marginTop: 6, lineHeight: 1.5 }}>
            The whole problem in one picture: 200 real objects by miss distance and size, coloured by NASA&rsquo;s{" "}
            <span style={{ color: "var(--space-haz)" }}>hazardous</span> flag. Every hazardous rock sits above the
            dashed size gate — being big is nearly a <em>requirement</em> — yet the upper band is crowded with harmless
            big ones. <strong style={{ color: "var(--space-ink)" }}>That crowded band is the entire job.</strong>
          </div>
        </div>
      </SkyPanel>

      {/* ---------- editorial body ---------- */}
      <div className="lesson" style={{ marginTop: 18 }}>
        <ModelAnatomy
          accent={SPACE}
          form={<>A classifier over 3 honest features (size, speed, miss distance) that outputs a hazard probability — plus the discipline around it.</>}
          loss={<>Log-loss to train; but judged on <strong>PR-AUC &amp; recall</strong>, because the classes are 10-to-1 imbalanced and a miss is far costlier than a false alarm.</>}
          optimiser={<>Not just &ldquo;fit a model&rdquo; — choose the metric and the split <em>first</em>, baseline, then climb models only when a diagnostic demands it.</>}
        />

        <h2>The honest thesis (we lead with it)</h2>
        <p>
          Most tutorials on this dataset report 90%-plus accuracy and stop. That is the trap. With a 10% positive
          rate, a model that never flags anything is already 90% accurate. The number that <em>can&rsquo;t</em> lie
          here is <strong>PR-AUC</strong>, and it tells a sharper story:
        </p>
        <Callout color={SPACE} title={<>Where we end up (the spoiler)</>}>
          A one-line rule — &ldquo;bigger objects are hazardous&rdquo; — scores a dazzling <strong>ROC-AUC 0.87</strong>,
          and a <strong>PR-AUC of just 0.29</strong>. The real data science roughly <strong>doubles PR-AUC to ~0.48</strong>
          by combining size with speed and miss distance — and only a <strong>grouped-by-object split</strong> reveals
          that honest number (a naive split inflates the forest to 0.57 by letting the same asteroid appear in train{" "}
          <em>and</em> test). The skill isn&rsquo;t the model. It&rsquo;s building an evaluation that can&rsquo;t
          flatter you, and knowing how much lift is really there. Every number here falls out of the real data.
        </Callout>

        <h2>How this capstone teaches (the contract)</h2>
        <p>
          This isn&rsquo;t a recipe to copy. The goal is that you could open a dataset in a field you know nothing
          about and know <em>how to think</em>. So every page runs the same four beats:
        </p>
        <ol style={ol}>
          <li><strong>🧭 The question a data scientist asks</strong> — phrased generally, before asteroids are even mentioned (&ldquo;does any column carry no information?&rdquo;).</li>
          <li><strong>How you&rsquo;d find out</strong> — the reusable method, and <em>why</em> it works.</li>
          <li><strong>Do it here</strong> — you predict the outcome first, then see the real result on the asteroid data.</li>
          <li><strong>Your turn</strong> — how would you catch this on your own data, or if it were images or medical records?</li>
        </ol>
        <p>
          You&rsquo;ll accumulate a reusable <strong>Data-Science Playbook</strong> — one rule per page — and download
          it at the end. Then you&rsquo;ll <em>prove</em> the thinking transferred on two fresh datasets with no
          answers given: <strong>pulsar detection</strong> (a related field) and <strong>bank marketing</strong> (a
          completely different one, with a different trap to catch).
        </p>

        <h2>The arc</h2>
        <ol style={ol}>
          <li><strong>Frame &amp; learn the field</strong> — turn a vague goal into a decision + a metric, and learn a method for researching <em>any</em> unfamiliar domain.</li>
          <li><strong>First contact &amp; integrity</strong> — meet the data, then find its landmines: dead columns, a duplicate-object trap, three features that are secretly one.</li>
          <li><strong>Explore &amp; analyse</strong> — turn plots into testable hypotheses.</li>
          <li><strong>Lock the harness first</strong> — choose the metric by the cost of error, and a split that can&rsquo;t leak; set the baseline to beat.</li>
          <li><strong>Model, rung by rung</strong> — logistic → tree → forest → boosting, each earning its complexity on the honest harness.</li>
          <li><strong>Interpret, conclude, hand off</strong> — does the model agree with reality, what can it never know, and can <em>you</em> now do this alone?</li>
        </ol>

        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Fully reproducible: the dataset ships with the site and every number is produced by{" "}
          <code>scripts/neo_cases.py</code>. Follow top-to-bottom, or jump from the sidebar.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting", label: <>← Boosting</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/researching-the-field", label: <>Next up · Researching an unfamiliar field →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
