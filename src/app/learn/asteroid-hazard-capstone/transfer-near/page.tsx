import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { PulsarPanel } from "@/components/figures/PulsarPanel";
import { AnalystQuestion, TransferBox } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Transfer test I · Pulsars (near) — Manifold",
  description:
    "Your first graduation: run the whole Playbook on HTRU2, a pulsar-detection dataset. Same sky, new features — eight engineered summary statistics, ~9% positive, and a subtle judgement call about whether the leakage trap even applies. Framing questions, no answers, and a reveal-able senior walkthrough.",
};

const RADIO = "var(--radio-accent)";

export default function TransferNearPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: RADIO }, { label: "Act 6 · Transfer test", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Transfer test I · Pulsars <span style={{ color: "var(--faint)", fontWeight: 400 }}>(near)</span></>}
        intro={<>
          Time to prove the thinking transferred. This is a <em>near</em> transfer — still the sky, still a rare-positive
          detection problem — so the domain research is light and you can focus on wielding the Playbook. New dataset, new
          features, one genuine judgement call. Framing questions below; the answers are yours to earn.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <PulsarPanel>
          <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--radio-pulse)", fontWeight: 600, marginBottom: 8 }}>
            The dataset · HTRU2
          </div>
          <div style={{ fontSize: 16.5, lineHeight: 1.55, color: "var(--radio-ink)", maxWidth: "52ch" }}>
            17,898 pulsar candidates from the High Time Resolution Universe survey; about <strong>9.2% are real
            pulsars</strong>. Eight continuous features — four summary statistics (mean, standard deviation, excess
            kurtosis, skewness) of the <em>integrated pulse profile</em>, and the same four of the <em>DM–SNR
            curve</em>. Labels were verified by human inspection.
          </div>
          <div style={{ fontSize: 13, color: "var(--radio-faint)", marginTop: 12 }}>
            Source: UCI Machine Learning Repository / Kaggle — &ldquo;HTRU2&rdquo; (R. Lyon et al.).
          </div>
        </PulsarPanel>

        <AnalystQuestion>
          Can I re-run the Playbook when only the <em>features</em> change — and can I tell which rules apply here and
          which don&rsquo;t?
        </AnalystQuestion>

        <h2>Your turn: frame it before you fit</h2>
        <p>
          Fetch HTRU2 and, <strong>before touching a model</strong>, answer these in writing. They&rsquo;re the same
          questions you asked of asteroids, re-pointed at pulsars:
        </p>
        <ol style={ol}>
          <li><strong>The decision.</strong> Who acts on this prediction, and what does a false negative vs a false positive cost them? (Hint: astronomer follow-up time is finite.)</li>
          <li><strong>The target&rsquo;s definition.</strong> How were the labels made, and how trustworthy are they? Does any feature partly encode the label?</li>
          <li><strong>What is one row?</strong> Could the same entity appear in multiple rows here? This is the judgement call — think hard before you answer.</li>
          <li><strong>Redundancy.</strong> Eight features, but they&rsquo;re all summary statistics of just two curves. Which might be near-copies of each other?</li>
          <li><strong>The metric.</strong> ~9% positive with asymmetric cost — which curve tells the truth, and what&rsquo;s the chance floor this time?</li>
          <li><strong>The baseline.</strong> What&rsquo;s the trivial score, and what&rsquo;s the simplest one-feature rule that a real model must beat?</li>
        </ol>

        <Callout color={RADIO} title={<>Predict first: will the leakage trap bite here?</>}>
          On NEO, the whole game was the grouped split — because one object spanned many rows. Commit to a prediction now,
          in writing: <em>does HTRU2 have that same repeated-entity structure, and does it need a grouped split?</em> The
          skill this transfer tests isn&rsquo;t applying the grouped split reflexively — it&rsquo;s knowing whether the
          condition that <em>justified</em> it is even present. Cargo-culting a technique into a problem that doesn&rsquo;t
          need it is its own kind of mistake.
        </Callout>

        <h2>The senior&rsquo;s walkthrough</h2>
        <p>Work the questions yourself first. Then open each to compare your reasoning — not to copy an answer.</p>

        <details style={box}>
          <summary style={sum}>Is a grouped split needed here?</summary>
          <div style={ans}>
            Almost certainly <strong>not</strong> — and recognising that is the point. Each row is one independent
            candidate detection, with no object id tying rows together the way NEO&rsquo;s <code>id</code> did. So the
            repeated-entity leakage that forced a grouped split on asteroids doesn&rsquo;t apply; a plain{" "}
            <strong>stratified random split</strong> is honest here. The transferable lesson: don&rsquo;t port a fix
            without re-checking the condition that motivated it. Always ask &ldquo;could an entity repeat?&rdquo; — and
            accept &ldquo;no&rdquo; as a valid, split-simplifying answer.
          </div>
        </details>
        <details style={box}>
          <summary style={sum}>Which metric, and what&rsquo;s the floor?</summary>
          <div style={ans}>
            Rare positives (~9%) plus a cost of drowning astronomers in false candidates → <strong>PR-AUC</strong>, with
            the chance floor now at the new prevalence (~0.09), not 0.5. Report recall at a chosen operating point
            alongside it, exactly as on NEO. Accuracy would again reward a do-nothing model at ~91%.
          </div>
        </details>
        <details style={box}>
          <summary style={sum}>What about the engineered features?</summary>
          <div style={ans}>
            All eight are derived summary statistics, so run the redundancy check: some (e.g. the profile&rsquo;s kurtosis
            and skewness) can be strongly correlated. You likely won&rsquo;t find an exact ±1 identity as with NEO&rsquo;s
            diameters, but you should <em>look</em> before assuming eight features means eight independent signals. Unlike
            NEO, expect these features to separate the classes <em>cleanly</em> — pulsars have a characteristic profile
            shape — so a simple model may already do very well. Read that as a property of the problem, not your genius.
          </div>
        </details>
        <details style={box}>
          <summary style={sum}>How will the climb differ from NEO?</summary>
          <div style={ans}>
            Same rungs — baseline → logistic → tree → forest → boosting — judged on one honest harness by margin over
            baseline. The likely difference: because the features are highly separable, expect a strong logistic result
            and a smaller <em>relative</em> gain from the ensemble than a harder problem would show. The Playbook
            doesn&rsquo;t change; what changes is where the plateau sits, and reading that plateau is the skill.
          </div>
        </details>

        <TransferBox>
          If you reached for the grouped split out of habit and had to talk yourself out of it — good, that&rsquo;s the
          test working. A technique is only as good as the condition that justifies it. Write your PR-AUC-vs-baseline
          result down and note which Playbook rules you used <em>without</em> looking back at NEO; those are the ones that
          became yours.
        </TransferBox>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/takeaways", label: <>← Verdict, playbook &amp; notebook</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/transfer-far", label: <>Next up · Transfer test II · Bank marketing →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", margin: "0 0 8px" };
const sum: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: "var(--ink)", cursor: "pointer" };
const ans: React.CSSProperties = { fontSize: 13.5, lineHeight: 1.65, color: "var(--muted)", padding: "8px 2px 4px" };
