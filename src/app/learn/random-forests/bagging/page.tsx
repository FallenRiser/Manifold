import Link from "next/link";
import { BootstrapLab } from "@/components/labs/BootstrapLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Bagging: training on bootstraps — Manifold",
  description:
    "Bagging = bootstrap aggregating: train each model on a resample-with-replacement of the data, then average. The resampling is what makes the models differ enough for averaging to pay off.",
};

const TREES = "var(--c-trees)";

export default function BaggingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Bagging: training on bootstraps</>}
        intro={<>
          Averaging trees only helps if the trees <em>differ</em> — identical trees make identical mistakes.
          Bagging is the trick that manufactures the difference, using nothing but a clever way of resampling
          the training data.
        </>}
      />

      <div className="lesson">
        <h2>Bagging = <em>b</em>ootstrap <em>agg</em>regat<em>ing</em></h2>
        <p>
          The name packs the whole method into one word. To build a bagged ensemble of <M>{String.raw`B`}</M>{" "}
          trees:
        </p>
        <ol style={ol}>
          <li><strong>Bootstrap.</strong> For each tree, draw a fresh training set by sampling{" "}
            <M>{String.raw`n`}</M> rows from your <M>{String.raw`n`}</M> rows <em>with replacement</em>. Some
            rows appear twice or thrice; some don&rsquo;t appear at all.</li>
          <li><strong>Train.</strong> Grow a tree on that resample, fully, with no pruning — we <em>want</em>{" "}
            each tree to be low-bias and high-variance.</li>
          <li><strong>Aggregate.</strong> To predict, run the point through all <M>{String.raw`B`}</M> trees
            and take the majority vote (classification) or the mean (regression).</li>
        </ol>
        <p>
          That&rsquo;s it. Bagging is a <em>meta</em>-method — it wraps any high-variance learner — but it
          works best on deep trees precisely because they&rsquo;re so variable, which we&rsquo;ll see is
          exactly what averaging wants.
        </p>

        <h2>What a bootstrap sample looks like</h2>
        <p>
          The one subtle piece is the bootstrap. Sampling <em>with replacement</em> means each resample is a
          slightly distorted version of the original — a few rows emphasised, a few dropped — and that
          distortion is what makes each tree different. Draw a few and watch the pattern:
        </p>

        <PredictPrompt
          accent={TREES}
          prompt={<>In a bootstrap sample of <M>{String.raw`n`}</M> rows, roughly what fraction of the original rows get left out entirely?</>}
          options={["Almost none", "About a third", "About half"]}
        />

        <LabFrame
          accent={TREES}
          tryThis={<>Hit &ldquo;Draw another sample&rdquo; a few times. Track the out-of-bag count — the hollow, dashed rows that weren&rsquo;t picked at all.</>}
          insight={<>Every draw leaves roughly 37% of the rows out (hollow), while others get picked twice or thrice. That&rsquo;s not a coincidence: the chance a given row is missed in n draws is (1 − 1/n)ⁿ → 1/e ≈ 0.368. Each tree therefore trains on ~63% of the data — and the untouched ~37% becomes free validation, the subject of the next page.</>}
        >
          <BootstrapLab />
        </LabFrame>

        <h2>Why the resampling is enough</h2>
        <p>
          It seems too cheap — same data, same algorithm, just shuffled multiplicities. But recall <em>why</em>{" "}
          a tree is high-variance: a small change in the data can flip an early split and reorganise the whole
          tree. Bagging weaponises that fragility. Each bootstrap perturbs the data just enough to send each
          tree down a different path, so the ensemble is a committee of genuinely different experts — even
          though they came from one dataset and one algorithm.
        </p>
        <MathBlock>{String.raw`\hat{f}_{\text{bag}}(x) = \frac{1}{B}\sum_{b=1}^{B} \hat{f}_b(x) \quad\text{(regression)}, \qquad \hat{f}_{\text{bag}}(x) = \text{majority vote} \quad\text{(classification)}`}</MathBlock>

        <Callout color={TREES} title={<>Bagging reduces variance, not bias</>}>
          Every bagged tree is grown deep, so the ensemble&rsquo;s bias stays as low as a single deep
          tree&rsquo;s — averaging doesn&rsquo;t change the average prediction much. What it slashes is the{" "}
          <em>variance</em>. That&rsquo;s the deal bagging offers: keep the low bias of a deep tree, throw away
          most of its variance. A random forest, next chapter, is bagging plus one more decorrelating trick.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/random-forests", label: <>← Averaging trees</> }}
          next={{ href: "/learn/random-forests/out-of-bag-error", label: <>Next up · Out-of-bag error →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
