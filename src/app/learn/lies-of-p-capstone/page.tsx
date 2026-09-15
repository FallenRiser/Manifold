import Link from "next/link";
import { Callout, PrevNext } from "@/components/lesson";
import { GaslightPanel } from "@/components/figures/GaslightPanel";
import { ParryBudget } from "@/components/figures/ParryBudget";

export const metadata = {
  title: "Capstone: Learning to parry — Manifold",
  description:
    "A field report, not a simulation: an agent trained to play one Lies of P boss by watching its author play it. Behavioural cloning end to end — capture rig, dataset, a small CNN on a 6 GB laptop GPU trained on a free cloud GPU, and a control loop that has to fit inside a parry window a few frames wide. Written before the model exists, so every promise here is a promise about method, not results.",
};

const KRAT = "var(--c-krat)";
const chip: React.CSSProperties = { fontSize: 11.5, letterSpacing: "0.09em", textTransform: "uppercase", borderRadius: 999, padding: "3px 10px" };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const ol: React.CSSProperties = { lineHeight: 1.7 };

export default function LiesOfPCapstoneHub() {
  return (
    <article>
      {/* ---------- the gaslight hero (a "special section"; the body stays editorial) ---------- */}
      <GaslightPanel motif>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ ...chip, color: "var(--krat-ink)", border: "1px solid color-mix(in srgb, var(--krat-brass) 55%, transparent)" }}>Capstone</span>
          <span style={{ ...chip, color: "var(--krat-faint)", border: "1px solid var(--krat-border)" }}>Field report · imitation learning</span>
        </div>
        <h1 className="font-display" style={{ fontSize: 48, lineHeight: 1.04, margin: "0 0 14px", maxWidth: 680, color: "var(--krat-ink)" }}>
          Can it learn to parry by <em>watching me</em> play?
        </h1>
        <p style={{ fontSize: 17.5, lineHeight: 1.6, maxWidth: 640, margin: 0, color: "var(--krat-ink-soft)" }}>
          Not a simulation this time. A real game, on a real laptop, recorded by the person writing this — and a
          model that tries to copy them. Behavioural cloning end to end: the capture rig, the dataset, a small
          network that fits in <strong style={{ color: "var(--krat-ink)" }}>6 GB</strong>, and a control loop that
          has to see, decide and press a key inside a window only a
          <strong style={{ color: "var(--krat-ink)" }}> few frames</strong> wide.
        </p>
        <div style={{ marginTop: 22, borderTop: "1px solid var(--krat-border)", paddingTop: 16 }}>
          <ParryBudget />
          <div style={{ fontSize: 12.5, color: "var(--krat-faint)", marginTop: 8, lineHeight: 1.55 }}>
            The whole project in one picture — and note that it contains no machine learning at all. A perfect guard
            has to land inside a window a few frames wide. Everything the agent does —{" "}
            <span style={{ color: "var(--krat-brass)" }}>grab the frame, stack it, run the network, press the key</span>{" "}
            — has to finish before that window shuts. <strong style={{ color: "var(--krat-ink)" }}>A model that is
            perfectly accurate and twenty milliseconds late parries nothing.</strong> That is why this capstone spends
            an entire act on a stopwatch before it trains anything.
          </div>
        </div>
      </GaslightPanel>

      {/* ---------- editorial body ---------- */}
      <div className="lesson" style={{ marginTop: 18 }}>
        <Callout color={KRAT} title={<>Field-report status — read this first</>}>
          This capstone is a <strong>new genre for the site</strong>, and it comes with a rule. The other three
          capstones run entirely in your browser; this one documents a project built <em>off</em> it, on real
          hardware. So it is being published <strong>in the order the work actually happens</strong>: method first,
          results only once they exist.
          <br /><br />
          <strong>As of today: the rig is not built, no data is recorded, and no model is trained.</strong> Every
          page currently planned under &ldquo;Results &amp; failure&rdquo; is deliberately unlinked, and will stay
          that way until there is a real run to report. Nothing in this capstone will ever quote a number that was
          not measured — the greyed-out pages in the sidebar <em>are</em> that promise, kept in public.
        </Callout>

        <h2>The honest thesis (we lead with it)</h2>
        <p>
          It would be easy to sell this as &ldquo;an AI that taught itself to beat a Soulslike.&rdquo; That would be
          a lie, and a boring one. Here is the real claim, stated up front so every later page can be checked
          against it:
        </p>
        <Callout color={KRAT} title={<>What this will and will not be</>}>
          <strong>It will be</strong> an agent that learns one boss fight by imitating recorded human play — a
          supervised model, trained on frames labelled with the keys that were held down while they were on screen.
          <br /><br />
          <strong>It will not be</strong> self-taught, and it cannot exceed the person it copied. Behavioural cloning
          reproduces <em>average</em> play, including the mistakes. If its teacher panic-rolls, it learns to
          panic-roll.
          <br /><br />
          <strong>It will probably dodge more than it parries</strong>, because dodging forgives a late press and
          parrying does not — see the figure above. If that happens, the honest write-up is the dodge-tank result,
          not a retry until the story improves.
        </Callout>

        <h2>Two things make this worth a capstone</h2>
        <p>
          Otherwise it would be a tutorial with a game attached. Both are ideas the other capstones could not
          teach, because both need a model that acts in a world that answers back.
        </p>
        <ol style={ol}>
          <li>
            <strong>Imitation is a supervised problem wearing a control problem&rsquo;s clothes.</strong> Training
            looks exactly like image classification — and then you deploy it, and it breaks in a way no classifier
            ever does. The moment the agent acts, it starts choosing its own next input. One slightly-off move puts
            it somewhere its teacher never was, where its predictions were never trained to be right, which puts it
            somewhere stranger still. <strong>Distribution shift you can watch happen, in real time.</strong>
          </li>
          <li>
            <strong>It is a latency problem as much as a learning problem.</strong> Accuracy is not the binding
            constraint here; the clock is. That reframes every design choice downstream — the backbone, the input
            resolution, the frame stack — as budget decisions, and it is the single most transferable idea in the
            project.
          </li>
        </ol>

        <h2>How a field report is written</h2>
        <p>
          The <Link href="/learn/warehouse-robot-capstone" style={link}>warehouse-robot capstone</Link> could put a
          Run button under every number, because its world lived in the page. This one cannot: the world is a
          commercial game running on one particular laptop. So the discipline changes shape but not substance —
          instead of <em>run it yourself here</em>, it is <em>here is exactly what I did, here is the code, here are
          the weights, and here is what went wrong.</em>
        </p>
        <ol style={ol}>
          <li><strong>Every claim carries its measurement.</strong> Latency numbers come with the machine and the percentile, not just a mean.</li>
          <li><strong>Artifacts, not screenshots.</strong> Code on GitHub, weights and a model card on HuggingFace, linked from the results pages when they exist.</li>
          <li><strong>Failures ship.</strong> The pipeline has at least one step that may simply not work — whether the game accepts synthetic keystrokes at all. If it doesn&rsquo;t, that becomes the page.</li>
        </ol>

        <h2>The arc</h2>
        <ol style={ol}>
          <li><strong>Frame the field report</strong> — why not RL, what cloning actually is, and scoping it down to one boss in one arena.</li>
          <li><strong>The rig</strong> — capturing frames and keystrokes on one clock, the latency budget, and what a keypress means as a label.</li>
          <li><strong>The model</strong> — what fits in 6 GB, how a network sees <em>time</em>, the rarity of parry frames, and training off-site on a free GPU.</li>
          <li><strong>The loop</strong> — turning logits back into keystrokes, and finding out whether the game listens.</li>
          <li><strong>Results &amp; failure</strong> — what it learned, distribution shift watched live, the dodge-tank problem, and DAgger.</li>
          <li><strong>Conclude &amp; transfer</strong> — verdict and artifacts, the Deep-RL option and its real cost, and how to clone any real-time skill.</li>
        </ol>

        <Callout color={KRAT} title={<>On playing fair with someone else&rsquo;s game</>}>
          The recordings are of single-player, offline play, made by the author on their own copy, and used to train
          a model that plays that same offline game on that same machine. No game code is redistributed, no assets
          are reproduced here, and nothing in this capstone touches another player or an online service. Every
          illustration on these pages is drawn from scratch.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/takeaways", label: <>← Warehouse-robot capstone</> }}
        />
      </div>
    </article>
  );
}
