import Link from "next/link";
import { ForestVoteLab } from "@/components/labs/ForestVoteLab";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { RANDOM_FORESTS_DONE, RANDOM_FORESTS_TOTAL } from "@/lib/randomForestsTrack";

export const metadata = {
  title: "Bagging & random forests — Manifold",
  description:
    "A single tree is a brilliant but erratic expert. Grow hundreds on resampled data, let each see only some features, and average their votes — the high variance cancels out and you get one of the strongest, most reliable models for tabular data.",
};

const TREES = "var(--c-trees)";

export default function RandomForestsHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Trees & ensembles", color: TREES },
          { label: RANDOM_FORESTS_DONE >= RANDOM_FORESTS_TOTAL ? `Complete · ${RANDOM_FORESTS_TOTAL} pages` : `In progress · ${RANDOM_FORESTS_DONE} of ${RANDOM_FORESTS_TOTAL} pages`, color: "var(--c-fundamentals)" },
        ]}
        time="about 6 minutes"
        title={<>Averaging trees</>}
        intro={<>
          A single decision tree, you learned, is <em>low bias but high variance</em> — flexible enough to fit
          anything, but so twitchy that resampling the data rebuilds it from scratch. There&rsquo;s a classic
          cure for high variance that needs no new model at all: <strong>average many of them.</strong> Do it
          well and you get a random forest — often the best model on the table.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          accent={TREES}
          form={<>An average of <strong>B</strong> decision trees, each grown on a bootstrap resample with a random feature subset per split. Predict by majority vote (classification) or mean (regression).</>}
          loss={<>Unchanged — each tree still greedily minimises node impurity. The ensemble adds no new loss; its power comes entirely from <em>averaging</em>.</>}
          optimiser={<>Greedy tree growth, run <strong>B</strong> times on different resampled, feature-subsampled views of the data. Diversity plus averaging, not global optimisation.</>}
        />

        <h2>The wisdom of (de-correlated) crowds</h2>
        <p>
          Ask one expert to guess a number and you get a sharp but unreliable answer. Ask a thousand
          independent-ish experts and average their guesses, and the errors — some too high, some too low —
          cancel, leaving something remarkably close to the truth. That&rsquo;s the whole strategy. Each tree
          is an expert; the forest is the average.
        </p>
        <p>
          The catch hidden in &ldquo;independent-ish&rdquo; is the entire art, and it&rsquo;s what separates a
          random forest from naive averaging. If every tree saw the same data and rules, they&rsquo;d all make
          the <em>same</em> mistakes and averaging would do nothing. So a forest deliberately makes its trees{" "}
          <strong> disagree</strong>: each is grown on a different bootstrap resample, and each split may only
          consider a random handful of features. Two knobs, both aimed at one goal — decorrelate the trees so
          their errors are independent enough to cancel.
        </p>

        <h2>Watch the variance melt away</h2>
        <p>
          The true boundary below is a <em>circle</em> — the one shape an axis-aligned tree is worst at, since
          it can only approximate a curve with a staircase of straight cuts. Start with one tree and you get
          exactly that: a hard, jagged edge. Then grow the forest.
        </p>

        <PredictPrompt
          accent={TREES}
          prompt={<>As you add trees, what happens to the jagged boundary and to test accuracy?</>}
          options={["Stays jagged; accuracy flat", "Smooths into a ring; accuracy rises then plateaus", "Gets more jagged; accuracy falls"]}
        />

        <LabFrame
          accent={TREES}
          tryThis={<>Drag from 1 tree upward. Watch the vote field soften from a hard staircase into a smooth ring around the dashed true circle, and watch the two accuracy numbers.</>}
          insight={<>One tree is jagged and only ~83% accurate; a single <em>random</em> tree is even weaker (~79%). But average ~10 of them and the boundary smooths into a clean ring at ~85% — better than any single tree — and adding more never hurts, it just stabilises. The staircases all disagree in different places, so averaging cancels their errors.</>}
        >
          <ForestVoteLab />
        </LabFrame>

        <p>
          Nothing about the individual trees got better — each is still a jagged, over-eager staircase. What
          improved is the <em>average</em>: because the trees disagree about <em>where</em> to be jagged, their
          errors partly cancel, and the mean is smoother and more accurate than any member. You are watching
          variance being divided away, exactly as the <Link href="/learn/decision-trees/bias-and-variance-of-trees" style={link}>bias–variance
          page</Link> promised.
        </p>

        <h2>The arc of this track</h2>
        <ol style={ol}>
          <li><strong>The wisdom of many trees</strong> — bagging and the bootstrap, and the out-of-bag trick that gives you free validation.</li>
          <li><strong>What makes it a forest</strong> — the random-subspace trick that decorrelates the trees, the full algorithm, and how a forest ranks its features.</li>
          <li><strong>Tuning &amp; variants</strong> — the handful of hyperparameters, Extra-Trees, and a head-to-head with single trees and boosting.</li>
          <li><strong>Theory</strong> — the exact formula for the variance of a correlated average, and the bias forests <em>can&rsquo;t</em> fix.</li>
          <li><strong>Strengths &amp; kin</strong> — forest proximities as a bonus superpower, and when a forest is the right call.</li>
          <li><strong>In the wild</strong> — a real dataset where the forest earns its reputation as the default.</li>
        </ol>

        <Callout color={TREES} title={<>Prerequisite</>}>
          This track leans hard on <Link href="/learn/decision-trees" style={link}>decision trees</Link> — a
          random forest <em>is</em> a pile of them. If &ldquo;high variance,&rdquo; &ldquo;impurity,&rdquo; and
          &ldquo;greedy splitting&rdquo; don&rsquo;t feel automatic yet, read that track first; especially its{" "}
          <Link href="/learn/decision-trees/bias-and-variance-of-trees" style={link}>bias–variance page</Link>,
          which sets up everything the forest is about to exploit.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees", label: <>← Decision trees</> }}
          next={{ href: "/learn/random-forests/bagging", label: <>Next up · Bagging: training on bootstraps →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
