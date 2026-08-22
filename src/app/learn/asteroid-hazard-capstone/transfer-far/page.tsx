import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { BankPanel } from "@/components/figures/BankPanel";
import { AnalystQuestion, TransferBox } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Transfer test II · Bank marketing (far) — Manifold",
  description:
    "The final graduation: run the Playbook on a dataset from a field you may know nothing about — a Portuguese bank's telemarketing campaign. Cold domain research, categorical features to encode, and a different trap: a target leak hidden in the 'duration' column that only reading the data dictionary will catch.",
};

const BANK = "var(--bank-accent)";

export default function TransferFarPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: BANK }, { label: "Act 6 · Transfer test", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Transfer test II · Bank marketing <span style={{ color: "var(--faint)", fontWeight: 400 }}>(far)</span></>}
        intro={<>
          The real exam. This dataset is from a field with no connection to the sky — retail-bank telemarketing — so the
          domain-research method gets its true test, with no borrowed intuition to lean on. The trap here is{" "}
          <em>different</em> from NEO&rsquo;s, and only the discipline of reading the data dictionary will catch it.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <BankPanel>
          <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--bank-accent)", fontWeight: 700, marginBottom: 8 }}>
            The dataset · Bank Marketing
          </div>
          <div style={{ fontSize: 16.5, lineHeight: 1.55, color: "var(--bank-ink)", maxWidth: "54ch" }}>
            41,188 phone contacts from a Portuguese bank&rsquo;s marketing campaigns; the target is whether the client{" "}
            <strong>subscribed a term deposit</strong> (&ldquo;yes&rdquo; ≈ 11%). Twenty features — a mix of client
            attributes (job, marital status, education, age), campaign details, and economic indicators — so several are{" "}
            <strong>categorical</strong> and need encoding.
          </div>
          <div style={{ fontSize: 13, color: "var(--bank-faint)", marginTop: 12 }}>
            Source: UCI Machine Learning Repository — &ldquo;Bank Marketing&rdquo; (Moro et al.).
          </div>
        </BankPanel>

        <AnalystQuestion>
          Can I run the Playbook when the <em>entire field</em> is unfamiliar <em>and</em> the trap is one I&rsquo;ve
          never seen — armed only with the method, not the answers?
        </AnalystQuestion>

        <h2>Your turn: research a field you don&rsquo;t know</h2>
        <p>
          This is where Playbook rule 1 earns its place. You can&rsquo;t coast on physics intuition here — you must{" "}
          <em>do the research</em>. Before modelling, answer in writing:
        </p>
        <ol style={ol}>
          <li><strong>The decision.</strong> The model ranks who to call. What does the bank do with a score — and what does a false positive (a wasted call) vs a false negative (a missed subscriber) actually cost?</li>
          <li><strong>The data dictionary — read every column&rsquo;s definition.</strong> One column is not what it seems. Which feature would you <em>not have</em> at the moment you decide whom to call?</li>
          <li><strong>Categoricals.</strong> Job, education, month, outcome-of-previous-campaign — how will you turn these into numbers without inventing a false ordering?</li>
          <li><strong>What is one row, and is there order?</strong> Is there a repeated-entity or a <em>time</em> structure that should shape the split?</li>
          <li><strong>Metric &amp; baseline.</strong> ~11% positive — which curve, which floor, and what&rsquo;s the simplest rule to beat?</li>
        </ol>

        <Callout color={BANK} title={<>Predict first: where is the leak?</>}>
          On NEO the danger was a leaky <em>split</em>. Here it&rsquo;s a leaky <em>feature</em>. Commit now: read the
          columns and name the one you suspect encodes the outcome it&rsquo;s supposed to predict. Then check your guess
          against the dictionary. Finding a feature that couldn&rsquo;t exist at prediction time is the same skill as
          NEO&rsquo;s &ldquo;read the target&rsquo;s definition literally&rdquo; — wearing very different clothes.
        </Callout>

        <h2>The senior&rsquo;s walkthrough</h2>
        <p>Reason it through yourself, then open each to check your thinking.</p>

        <details style={box}>
          <summary style={sum}>The trap: what&rsquo;s wrong with <code>duration</code>?</summary>
          <div style={ans}>
            <code>duration</code> is the length of the call in seconds — and the data dictionary itself warns about it. A
            call&rsquo;s duration is only known <em>after</em> the call ends, and if duration is 0 the client
            necessarily said no. So it is almost a proxy for the outcome, and it isn&rsquo;t available at the moment you
            decide whom to call. Include it and you&rsquo;ll get a spectacular, <em>useless</em> model — it &ldquo;knows&rdquo;
            the answer. The honest move is to <strong>drop <code>duration</code></strong> for any realistic predictor.
            This is target leakage (NEO&rsquo;s rule 2), found not in the split but in a single column — and only reading
            the dictionary reveals it.
          </div>
        </details>
        <details style={box}>
          <summary style={sum}>How to handle the categorical features?</summary>
          <div style={ans}>
            Most (<code>job</code>, <code>marital</code>, <code>education</code>, <code>contact</code>, <code>month</code>)
            are nominal — no natural order — so <strong>one-hot encode</strong> them rather than assigning arbitrary
            integers, which would invent a false ranking. Tree-based models tolerate integer codes better than linear
            ones, but one-hot is the safe default across the whole model climb. Watch for high-cardinality columns where
            target/frequency encoding may be cleaner. This is a genuinely new skill NEO never needed — all three of its
            features were numeric.
          </div>
        </details>
        <details style={box}>
          <summary style={sum}>What about the split — grouped, or something else?</summary>
          <div style={ans}>
            There&rsquo;s no client id to group on, so a straightforward grouped split isn&rsquo;t available. But the
            campaigns run <em>over time</em> and include economic indicators that drift, so the sharper concern is{" "}
            <em>temporal</em> leakage — training on later contacts to predict earlier ones. A time-aware or at least
            carefully stratified split is the honest choice. Same principle as NEO (don&rsquo;t let the future leak into
            the past), different structure (time, not repeated objects).
          </div>
        </details>
        <details style={box}>
          <summary style={sum}>What should the result look like?</summary>
          <div style={ans}>
            With <code>duration</code> dropped, expect a <em>modest</em> honest model — economic context and campaign
            history carry real but limited signal, and PR-AUC will sit well below what the leaky version falsely
            promised. That gap between the leaky and honest scores is the whole lesson, and it&rsquo;s the same shape as
            NEO&rsquo;s random-vs-grouped gap: the flattering number was never real. Report PR-AUC over the baseline, pick
            an operating point from the bank&rsquo;s call-capacity costs, and state the limits.
          </div>
        </details>

        <Callout color={BANK} title={<>If you got here, you can do this anywhere</>}>
          Two datasets, two different traps — a leaky split and a leaky feature — and one method that caught both. That
          is the entire thesis of this capstone: the asteroids were never the point. The Playbook is a way of{" "}
          <em>thinking</em> about an unfamiliar dataset — research the field, read the label literally, lock an honest
          harness, climb models by justification, interpret without fooling yourself, and name your limits — and it
          travels from the sky to a call centre without changing.
        </Callout>

        <TransferBox>
          Run it. Fetch the dataset, drop <code>duration</code>, encode the categoricals, lock a time-aware harness, and
          climb. Then find a <em>third</em> dataset from your own world — no theme, no guidance — and do it again. The
          capstone ends here; the practice doesn&rsquo;t.
        </TransferBox>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/transfer-near", label: <>← Transfer test I · Pulsars</> }}
          next={{ href: "/learn/asteroid-hazard-capstone", label: <>↑ Back to the capstone overview</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", margin: "0 0 8px" };
const sum: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: "var(--ink)", cursor: "pointer" };
const ans: React.CSSProperties = { fontSize: 13.5, lineHeight: 1.65, color: "var(--muted)", padding: "8px 2px 4px" };
