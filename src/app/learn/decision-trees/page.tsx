import Link from "next/link";
import { DecisionTreeLab } from "@/components/labs/DecisionTreeLab";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DECISION_TREES_DONE, DECISION_TREES_TOTAL } from "@/lib/decisionTreesTrack";

export const metadata = {
  title: "Decision trees — Manifold",
  description:
    "A decision tree is a game of twenty questions: each yes/no split carves the feature space into boxes, and every box gets one answer. Simple, readable, and the building block of the ensembles that dominate tabular data.",
};

const TREES = "var(--c-trees)";

export default function DecisionTreesHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Trees & ensembles", color: TREES },
          { label: DECISION_TREES_DONE >= DECISION_TREES_TOTAL ? `Complete · ${DECISION_TREES_TOTAL} pages` : `In progress · ${DECISION_TREES_DONE} of ${DECISION_TREES_TOTAL} pages`, color: "var(--c-fundamentals)" },
        ]}
        time="about 6 minutes"
        title={<>Splitting the space</>}
        intro={<>
          You can pin down almost anything with a good string of yes/no questions — twenty of them, the
          game claims, is enough for any object in the world. A <em>decision tree</em> plays exactly that
          game with data: ask the most useful question, split the group in two, then ask again on each
          half. That&rsquo;s the whole idea, and it&rsquo;s the seed of the models that win on tabular data.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          accent={TREES}
          form={<>A partition of the feature space into axis-aligned boxes; each box predicts one value — the majority class (or the mean, for regression).</>}
          loss={<><strong>Node impurity</strong>: Gini or entropy for classification, variance for regression. A split is judged by how much impurity it removes.</>}
          optimiser={<>Greedy recursive binary splitting (CART): at each node take the single best split, repeat, then prune back.</>}
        />

        <h2>A tree is a stack of questions</h2>
        <p>
          Imagine sorting a pile of houses into &ldquo;sold above asking&rdquo; and &ldquo;sold below.&rdquo;
          You might first ask <em>is it within two miles of downtown?</em> That one question splits the pile
          into two smaller, more lopsided piles. Inside each, you ask another — <em>more than three
          bedrooms?</em> — and split again. Keep going and every house lands in a small group where almost
          everyone shares the same outcome. To predict a new house, you walk it down the same questions and
          read off the answer of the group it joins.
        </p>
        <p>
          Geometrically, every question is a straight cut across one axis, so the model carves the feature
          space into <strong>rectangular boxes</strong>. Each box is a <em>leaf</em>; each box gets one
          prediction. The art is entirely in <em>which</em> question to ask, and <em>when to stop</em>.
        </p>

        <h2>Grow it and watch it learn — then overlearn</h2>
        <p>
          The lab below grows a real tree on a deliberately awkward dataset: two classes arranged in a
          checkerboard, with 10% of the labels randomly flipped so the pattern is never perfectly clean.
          One straight cut can&rsquo;t separate a checkerboard, so shallow trees fail. Deeper trees do
          better — up to a point.
        </p>

        <PredictPrompt
          accent={TREES}
          prompt={<>As you drag the depth from 1 up to 8, what happens to the <em>test</em> accuracy?</>}
          options={["Climbs the whole way", "Climbs, then peaks and slips back", "Flat — depth doesn't matter"]}
        />

        <LabFrame
          accent={TREES}
          tryThis={<>Start at depth 1 and step up one at a time — watch the <em>boxes</em> multiply on the left and the <em>tree</em> grow on the right, and the two accuracy bars pull apart. Then flip to the <strong>Diagonal</strong> dataset and see what a tree does with a slanted boundary.</>}
          insight={<>Depth 2 finds the four quadrants (test jumps to ~80%); test peaks around depth 3 (~84%), then <em>falls</em> as train marches to 100% — that widening gap is the tree memorising noise. On the Diagonal set, notice the boxes forming a clumsy <em>staircase</em> along the diagonal: a tree can only cut straight across an axis, so a slanted line is exactly what it&rsquo;s worst at.</>}
        >
          <DecisionTreeLab />
        </LabFrame>

        <p>
          The gap between the two bars is the entire story of this track. A tree left to grow will fit its
          training data <em>perfectly</em> — it can always ask enough questions to isolate every last point,
          including the mislabelled ones. That perfect training score is worthless; what we want is the test
          score, and the test score peaks at a modest depth and then decays. Learning to find that peak — by
          choosing splits well and pruning away the rest — is what makes a tree useful.
        </p>

        <h2>Why trees earn a whole family</h2>
        <p>Four properties make trees special, and each gets its due in this track:</p>
        <ul style={ul}>
          <li><strong>They&rsquo;re readable.</strong> A shallow tree is a flowchart you can print and hand to a
            non-expert — no other flexible model is this transparent.</li>
          <li><strong>They ask about features on their own terms.</strong> No scaling, no one-hot dance for
            ordered categories, numeric and categorical side by side, missing values handled natively.</li>
          <li><strong>They carve non-linear, interacting boundaries</strong> out of nothing but straight cuts —
            the checkerboard above is invisible to a linear model. (The flip side: a plain <em>diagonal</em>{" "}
            takes a whole staircase of cuts, as the lab&rsquo;s second dataset shows.)</li>
          <li><strong>They&rsquo;re high-variance.</strong> That&rsquo;s a weakness alone — but it&rsquo;s
            exactly the raw material that <Link href="/map" style={link}>bagging and boosting</Link> turn into
            the strongest tabular models there are.</li>
        </ul>

        <h2>The arc of this track</h2>
        <ol style={ol}>
          <li><strong>Twenty questions</strong> — what makes one split better than another, and how the tree grows itself top-down.</li>
          <li><strong>Choosing a split</strong> — Gini, entropy and information gain; regression trees; how numeric and categorical features are actually split.</li>
          <li><strong>Controlling complexity</strong> — how a tree overfits, the pre-pruning knobs that stop it early, and cost-complexity pruning that cuts it back.</li>
          <li><strong>Theory</strong> — why we settle for greedy growth, and the bias–variance profile that makes a single tree twitchy.</li>
          <li><strong>Strengths &amp; kin</strong> — reading feature importance, and honestly, when to reach for a single tree at all.</li>
          <li><strong>In the wild</strong> — a real dataset, grown, pruned, and read end to end.</li>
        </ol>

        <Callout color={TREES} title={<>Where this sits</>}>
          Decision trees are the foundation of the <strong>Trees &amp; ensembles</strong> family. Everything
          here — impurity, greedy splitting, the variance problem — is the groundwork for random forests and
          gradient boosting, which are simply <em>many</em> trees combined. Start here; the ensembles only
          make sense once a single tree does.
        </Callout>

        <PrevNext
          prev={{ href: "/map", label: <>← The map</> }}
          next={{ href: "/learn/decision-trees/what-makes-a-good-split", label: <>Next up · What makes a good split? →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
