import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import TopicTailLab from "@/components/labs/TopicTailLab";

export const metadata = {
  title: "Transfer test II (far): tagging newswire with ninety topics — Manifold",
  description:
    "The Playbook on a problem with a different shape: 1987 Reuters newswire, 90 topics, and a story can carry several or none. The pooled score says 0.858 while the mean topic sits at 0.396; per-topic thresholds and an editor's rule for the rarest lift it to 0.613.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.75 };

const outReuters = `the ModApte split of Reuters-21578, by date: 7770 training stories (26 Feb 1987 to 7 Apr 1987),
3019 test stories (8 Apr 1987 to 20 Oct 1987); the 90 topics with at least one story on each side
training stories per topic: earn 2877, acq 1650, money-fx 538, grain 433, crude 389, trade 369, ...
  median 18; 25 topics have 5 or fewer, 47 have 20 or fewer
  the smallest: sun-meal 1, rye 1, nkr 1, lin-oil 1, groundnut-oil 1
topics per test story: one for 2583 (0.856), two for 308, three or more for 128 (up to 14)
test stories that repeat a training story word for word: 17
test stories an indexer considered and gave no topic at all: 280`;

const outReutersTags = `one linear SVM per topic (TF-IDF, C=1), each a yes or no on every story. micro-F1 pools all 3019 x 90
decisions; macro-F1 is the mean of the 90 topics' F1
                                    micro   macro   mean F1, topics by training stories
                                                    1-5     6-20    21-100  101+
  (topics)                                          25      22      27      16
  as fitted (threshold 0)           0.8580  0.3962  0.020   0.313   0.555   0.831
  balanced weights                  0.8662  0.4713  0.060   0.407   0.684   0.844
  thresholds from training folds    0.8696  0.5676  0.110   0.606   0.780   0.871
  the rule: the topic's name        0.3041  0.3552  0.275   0.305   0.412   0.452
  model or rule, chosen per topic   0.8825  0.6129  0.246   0.617   0.796   0.871
each topic's threshold below the default 0: 74 of 90 (median -0.49)
topics never tagged right as fitted: 35; the rule chosen on the training folds for 21 topics, 10 of the 25
with 5 or fewer stories
the same stories split at random instead of by date (3 draws of 7770 / 3019), as fitted: micro 0.881-0.893,
macro 0.453-0.492 (over the topics each draw trains on)
the 280 test stories an indexer gave no topic: 82 get at least one tag as fitted`;

const CARD: [string, React.ReactNode][] = [
  ["Dataset:", <>Reuters-21578, Distribution 1.0 (David D. Lewis), UCI Machine Learning Repository: the ModApte split</>],
  ["Stories:", <>7,770 for training (26 February to 7 April 1987) and 3,019 for testing (8 April to 20 October 1987)</>],
  ["Topics:", <>90 economic subjects with a story on each side; a story can carry none, one or many</>],
  ["Labelled by:", <>indexers at Reuters and the Carnegie Group, in 1987</>],
  ["Readme:", <>warns that some stretches of 1987 were never indexed; the ModApte split keeps only stories an indexer looked at</>],
];

const CARRIED: { rule: number; what: string; here: React.ReactNode }[] = [
  { rule: 1, what: "the records it decides", here: <>Every story, but one story is now ninety decisions, one per topic, and a story can collect several tags or none.</> },
  { rule: 10, what: "a split that predicts the future", here: <>The split is by date, as the newsgroups&rsquo; was. Split at random, the same SVMs look 2.3 to 3.5 points better pooled and 5.7 to 9.6 better per topic.</> },
  { rule: 11, what: "the count that matches one decision", here: <>No single average does. The pooled score is mostly earn&rsquo;s and acq&rsquo;s; each topic needs its own F1, reported beside the rest.</> },
  { rule: 12, what: "the rule a team would ship", here: <>Useless overall (0.304 pooled, because nobody writes &ldquo;earn&rdquo; or &ldquo;acq&rdquo; into a story), and better than every model on the rarest topics.</> },
  { rule: 21, what: "set the promise where it will be kept", here: <>Each topic needs its own threshold. Set on training folds, 74 of 90 sit below the default.</> },
  { rule: 22, what: "weight a small class", here: <>Balanced weights add 7.5 points to the mean topic; the 25 smallest still average 0.06.</> },
  { rule: 23, what: "confidence only ranks the classes you have", here: <>Of 280 stories an indexer judged to fit no topic, 82 get a tag anyway.</> },
];

export default function TransferFarPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 7 · Conclude & transfer", color: "var(--c-metrics)" }]}
        time="about 14 minutes"
        title={<>Transfer test II (far): tagging newswire with ninety topics</>}
        intro={<>
          A dataset far from the first: newswire stories from 1987, ninety topics, and a story can carry several of them
          or none. Routing becomes tagging. Most rules still apply, but several have to change shape first.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={7} article={27} total={27}>
          Which rules still hold when the label itself changes shape?
        </ArticleOpener>

        <div style={{ margin: "0 0 20px", padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${POST}`, borderRadius: "0 12px 12px 0", display: "grid", gap: 4 }}>
          {CARD.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexWrap: "wrap", gap: "0 10px", fontSize: 13.5, lineHeight: 1.55 }}>
              <span style={{ ...mono, fontSize: 12.5, color: POST, width: 104, flexShrink: 0 }}>{k}</span>
              <span style={{ color: "var(--ink)", flex: "1 1 240px", minWidth: 0 }}>{v}</span>
            </div>
          ))}
        </div>

        <h2>The job</h2>
        <p>
          A news service tags each story with its topics, and every subscriber&rsquo;s feed receives the stories tagged
          with the topics they follow. A missed tag means a subscriber never sees a story on their subject; a wrong tag
          puts noise into someone&rsquo;s feed. Each topic is its own decision, made on every story: ninety yes-or-no
          questions per story, 271,710 for the test stories alone.
        </p>

        <h2>Your turn first</h2>
        <p>Before reading on, answer these in writing. Several rules need a new shape here.</p>
        <ol style={ol}>
          <li><strong>What is one decision now, and what does each mistake cost?</strong> <span style={mono}>#1</span></li>
          <li><strong>Which count matches one decision, and what would a single average hide?</strong> <span style={mono}>#11</span></li>
          <li><strong>Does the split predict the future?</strong> <span style={mono}>#10</span></li>
          <li><strong>What would an editor ship without a model?</strong> <span style={mono}>#12</span></li>
          <li><strong>How many examples does each label have, and what does a rare one need?</strong> <span style={mono}>#22</span></li>
          <li><strong>Where is the threshold, and who chose it?</strong> <span style={mono}>#21</span></li>
          <li><strong>What happens to a story that belongs to no topic?</strong> <span style={mono}>#23</span></li>
        </ol>

        <h2>The shape of the labels</h2>

        <CodeOutput source="scripts/routing_cases.py">{outReuters}</CodeOutput>

        <p>
          The split is by date, like the newsgroups&rsquo;: the training stories end on 7 April 1987 and the test stories
          start the next day. After that, little is familiar. The topics run from earn, with 2,877 training stories, down
          to seven with a single story each, and the median topic has 18. Most test stories (85.6%) carry exactly one
          topic, but two carry fourteen. And 280 test stories were looked at by an indexer and given no topic at all: a
          tagger should leave them alone.
        </p>

        <h2>One yes or no per topic</h2>
        <p>
          The router chose one forum of twenty. Here each topic gets its own linear SVM, answering yes or no on every
          story, so a story can collect several tags or none. There are two ways to average the result. Micro-F1 pools
          all 271,710 decisions, so the topics with the most stories carry it. Macro-F1 takes each topic&rsquo;s own F1
          and averages the ninety, each counted once.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>As fitted, the ninety SVMs reach a micro-F1 of 0.858. What is the mean of the ninety topics&rsquo; own F1?</>}
          options={["About 0.85", "About 0.65", "About 0.40"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outReutersTags}</CodeOutput>

        <p>
          About 0.40: 0.396. Thirty-five topics never get a single later story right. The pooled 0.858 is mostly the big
          topics&rsquo; score, and the table splits it open: the 16 topics with more than a hundred training stories
          average 0.831, the 25 with five or fewer average 0.020. Each of those small topics has only one to seven later
          stories, so any one of their F1 scores is close to a coin toss; the means across the bands are the part to read.
        </p>
        <p>
          The default threshold of 0 is a decision nobody made. Setting each topic&rsquo;s threshold on its training folds
          puts 74 of the 90 below it, at a median of &minus;0.49, and lifts the mean topic from 0.396 to 0.568 while the
          pooled score also rises, to 0.870. Weighting each topic&rsquo;s few stories up, as page 23 weighted a new forum,
          helps too, to 0.471. Neither reaches the smallest topics: 0.110 and 0.060.
        </p>
        <p>
          The rule an editor would write, tag a topic when its name appears in the story, looks hopeless overall: 0.304
          pooled, because nobody writes &ldquo;earn&rdquo;, &ldquo;acq&rdquo; or &ldquo;money-fx&rdquo; into a story,
          and those codes get an F1 of 0.00. But on the 25 smallest topics it averages 0.275, more than every model setting.
          Letting each topic choose, on its training folds, between its thresholded SVM and the rule gives the best of
          both: 0.8825 pooled and 0.613 per topic. The folds pick the rule for 21 topics, 10 of them among the 25 smallest.
          On those smallest topics the choice itself is noisy, 0.246 against the rule&rsquo;s 0.275 alone: with one or two
          training stories, the folds cannot always tell which will do better.
        </p>
        <p>
          Two older rules carry over unchanged. Split at random instead of by date, the same SVMs score 0.881 to 0.893
          pooled and 0.453 to 0.492 per topic, all above the 0.858 and 0.396 the later stories give, as{" "}
          <Link href={`${R}/the-split`} style={link}>page 11</Link> found for the newsgroups. And of the 280 stories an
          indexer judged to fit no topic, 82 get at least one tag. Every training story carries at least one of the
          ninety topics, so the SVMs never saw a story that belongs to none, just as the router never saw a forum it did
          not know on <Link href={`${R}/when-the-world-changes`} style={link}>page 24</Link>.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>platinum has five training stories and seven later ones. What F1 does its SVM reach on the later stories, with its threshold set on training folds?</>}
          options={["0.00", "About 0.5", "About 0.9"]}
          nudge="Locked in. Follow platinum in the lab."
        />

        <LabFrame
          accent={POST}
          tryThis={<>Start as fitted and find the row of dots at zero on the left. Switch to thresholds from folds, then the name rule, then model or rule per topic, and watch the dashed band means. Follow platinum, then earn, then naphtha.</>}
          insight={<>
            Every change lifts the left of the chart far more than the right: the mean topic moves from 0.396 to 0.613,
            the pooled score only from 0.858 to 0.8825. Ninety decisions need ninety thresholds, and the rarest need a
            rule a person can write, because five stories are not enough for a model to learn what &ldquo;platinum&rdquo;
            means.
          </>}
        >
          <TopicTailLab />
        </LabFrame>

        <h2>What carried over, and what changed shape</h2>
        <p>Compare these with what you wrote down.</p>
        <div style={{ display: "grid", gap: 5, margin: "0 0 18px" }}>
          {CARRIED.map((c) => (
            <div key={c.rule} style={{ display: "grid", gridTemplateColumns: "2.4em 1fr", gap: 8, alignItems: "baseline", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${POST}`, borderRadius: "0 10px 10px 0", padding: "8px 12px" }}>
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: POST }}>#{c.rule}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--muted)" }}>
                <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{c.what}.</strong> {c.here}
              </span>
            </div>
          ))}
        </div>

        <DecisionPoint
          accent={POST}
          question={<>The feed service launches with all ninety topics. How does each topic decide whether a story gets its tag?</>}
          options={[
            {
              label: "Each topic's SVM at its default threshold",
              verdict: "miss",
              response: <>The pooled score looks fine at 0.858, and 35 topics never tag a later story right. A
                subscriber to one of them gets an empty feed, and the pooled number never shows it.</>,
            },
            {
              label: "Weight each topic's stories so the rare topics count as much as the common ones",
              verdict: "close",
              response: <>It helps every band (the mean topic rises to 0.471), but the threshold is still the default
                nobody chose, and the 25 smallest topics still average 0.060.</>,
            },
            {
              label: "Set each topic's threshold on its own training folds",
              verdict: "close",
              response: <>The biggest single step: the mean topic from 0.396 to 0.568, and the pooled score up too. The 25
                smallest topics still average only 0.110: no threshold can rescue a model that has seen five stories.</>,
            },
            {
              label: "Per topic: a threshold from training folds, or the editors' name rule where it did better on those folds; and report every topic's F1",
              verdict: "best",
              response: <>0.8825 pooled and 0.613 per topic, the best of every setting measured. The rule takes 21 topics,
                10 of them among the 25 smallest, and the per-topic report shows a subscriber which feeds are
                reliable.</>,
            },
          ]}
        />

        <Callout color={POST} title={<>An average over labels is the common labels&rsquo; score</>}>
          Pool every yes-or-no decision and the biggest labels decide the number: here 0.858, while the mean topic sits at
          0.396 and 35 topics never get a story right. Count each label once, give each its own threshold, and where a
          label has too few examples to learn, let the rule a person would write stand in for the model.
        </Callout>

        <Followup>
          Take a system where a record can carry several labels: tags on support tickets, codes on medical notes,
          categories on products. Count the training examples for each label and plot each label&rsquo;s F1 against that
          count. Then find the labels with fewer than twenty examples and write the rule a person would use for each.
          How many of them does the rule beat the model on?
        </Followup>

        <SigRule n={26}>
          <strong>Give every label its own decision.</strong> When a record can carry many labels, each label is a yes or
          no with its own threshold, its own baseline and its own score. Report the rare ones by themselves, and where a
          label has too few examples to learn, let a rule a person can write stand in.
        </SigRule>

        <h2>The end of the capstone</h2>
        <p>
          Twenty-seven pages ago a tutorial said 93%. The router you built reads only what will be there when a post
          arrives, is scored on the posts it will actually face, routes 88.1% of next month&rsquo;s new threads right,
          and runs inside a system that places 92% of all next month&rsquo;s posts without a person, 95% of them in the
          right forum. Along the way it left twenty-six rules, and the last two pages showed them working on data none of
          them were written for. The{" "}
          <Link href={`${R}/takeaways`} style={link}>Playbook and the notebook</Link> are where you left them.
        </p>

        <PrevNext
          prev={{ href: `${R}/transfer-near`, label: <>← Transfer test I (near)</> }}
          next={{ href: `${R}/takeaways`, label: <>Back to the verdict &amp; playbook →</> }}
        />
      </div>
    </article>
  );
}
