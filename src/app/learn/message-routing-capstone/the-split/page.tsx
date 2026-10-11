import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import SplitHarnessLab from "@/components/labs/SplitHarnessLab";

export const metadata = {
  title: "The split that predicts the future — Manifold",
  description:
    "Six ways to test the router on old posts, checked against what the later posts actually scored. Score the job's posts, group the folds by thread, and weight them to next month's mix of familiar senders, and the test lands within 0.2 points.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const outSplit = `the audited view, linear SVM (C=0.3); every test below uses the earlier posts only

the future, the later posts:        new threads 0.8168 (95%: 0.8017-0.8310)   all posts 0.8056
  36.5% of the later new threads come from a sender seen in the earlier posts

test on the earlier posts    all posts       new threads     new threads from
                             (vs later)      (vs later)      a sender it has met
random 5-fold                0.8795 +0.0739  0.8422 +0.0254  46.8%
grouped by author, 5-fold    0.8676 +0.0620  0.8333 +0.0166   0.0%
grouped by thread, 5-fold    0.8050 -0.0006  0.8250 +0.0082  45.4%
each forum's latest 20%      0.8535 +0.0479  0.8311 +0.0143  38.6%
each forum's latest 25%      0.8474 +0.0418  0.8287 +0.0119  37.8%
each forum's latest 33%      0.8347 +0.0290  0.8098 -0.0070  35.3%
(the time holdouts order posts by article number, the order the collecting server received
 them; 1894 of the 11314 earlier posts carry a number later than their forum's first later post)

grouped by thread, the new threads split by sender: met 0.8674, new 0.7897; the folds' mix is
45.4% met, the later posts' 36.5%. Weighted to the later mix: 0.8181 (+0.0013 vs later)

choosing C with it (grouped by thread, scored on new threads)
  C      harness    weighted to mix    later new threads
  0.1    0.8182     0.8116             0.8104
  0.3    0.8250     0.8181             0.8168
  1      0.8235     0.8169             0.8097
  3      0.8195     0.8120             0.8021
  the harness picks C=0.3; the later posts would have picked C=0.3`;

export default function TheSplitPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 4 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 13 minutes"
        title={<>The split that predicts the future</>}
        intro={<>
          Every choice from here on, the model, its settings, its features, its threshold, is made by testing
          on old posts. That test is only worth having if it says what next month will score. Six candidates,
          one future.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={4} article={11} total={27}>
          Which test on old posts tells you what next month will score?
        </ArticleOpener>

        <h2>The exam and the harness</h2>
        <p>
          Acts 1 to 3 audited the data, and they measured on the later posts, because an audit has to see the
          job. Act 4 changes the rule. From here on, every choice is made on the earlier posts alone, by a test
          built from them: the harness. The later posts are opened to report a result, never to pick one.
        </p>
        <p>
          A harness is only useful if its number is close to the one the later posts will give, so the first
          job is to test the tests. The target, on the audited view from page 10: 0.8168 on the later new
          threads (95% interval 0.8017 to 0.8310), and 0.8056 on all later posts.
        </p>

        <h2>Six candidates</h2>
        <ul style={ol}>
          <li><strong>Random 5-fold.</strong> Shuffle the earlier posts into five parts, train on four, test on the fifth. What most tutorials run.</li>
          <li><strong>Grouped by author.</strong> Keep each sender&rsquo;s posts in one fold, so a test never meets a sender it trained on.</li>
          <li><strong>Grouped by thread.</strong> Keep each conversation, the subject without &ldquo;Re:&rdquo;, in one fold.</li>
          <li><strong>A time holdout.</strong> Test on each forum&rsquo;s latest 20%, 25% or 33% of earlier posts. The release removed the Date lines (page 3), so &ldquo;latest&rdquo; means the highest article number: the order the collecting server received the posts.</li>
        </ul>
        <p>
          That last clock is rough: 1,894 of the 11,314 earlier posts carry a number later than their
          forum&rsquo;s first later post. And every test can be scored on all the posts it holds out, as
          tutorials do, or only on the new threads, the router&rsquo;s job.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Scored on new threads, which test lands closest to the later posts&rsquo; 0.8168?</>}
          options={["Random 5-fold", "Grouped by author", "Grouped by thread", "The latest quarter of each forum"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outSplit}</CodeOutput>

        <h2>Two different fixes</h2>
        <p>
          Scored on all posts, random 5-fold says 0.8795, 7.4 points above the later posts&rsquo; 0.8056. Grouped
          by thread it says 0.8050, within 0.06. Two separate things close that gap.
        </p>
        <ul style={ol}>
          <li><strong>Score the right posts.</strong> Random folds scored only on new threads say 0.8422: most of the 7.4 points came from replies, which the router never routes, and whose threads sit in the training folds.</li>
          <li><strong>Group by the unit that leaks.</strong> That unit is the thread. Grouping by author still overshoots by 1.7 points on new threads, although it never meets a sender it trained on: a new thread&rsquo;s replies, written by other people, sit in the training folds and discuss the same thing. Grouped by thread, the estimate is 0.8250, 0.8 points above the later posts and inside their interval.</li>
        </ul>
        <p>
          The time holdouts disagree with each other. The latest 20% overshoots by 1.4 points, the latest third
          undershoots by 0.7. One split, a rough clock and a few hundred new threads each: that is noise, not a
          better harness.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start with all posts and find random 5-fold, far right of the band. Switch to new threads and watch it move in. Then compare grouped by author with grouped by thread.</>}
          insight={<>
            Scoring the job&rsquo;s posts removes most of the overshoot, and grouping by thread removes most of
            the rest. The small ticks are single folds: the five thread-grouped folds spread over more than three
            points, which is why one time holdout, a single fold, cannot settle anything.
          </>}
        >
          <SplitHarnessLab />
        </LabFrame>

        <h2>The last 0.8 points: who is writing</h2>
        <p>
          The thread-grouped estimate is still a little high, and the last column says why. 45.4% of the new
          threads it tests come from a sender its training folds have seen; in the later posts, 36.5% do. Inside
          the folds, senders the router has met are routed right 86.7% of the time and new ones 79.0%, so a test
          with more familiar senders scores higher.
        </p>
        <p>
          Weight the two groups to the later posts&rsquo; mix and the estimate becomes 0.8181, 0.13 points from
          0.8168. The weight needs no labels, only a count of how many new threads come from senders already
          seen, which a live router can read off last month&rsquo;s traffic. Across the four values of C below,
          weighting brings the harness within 0.1 to 1.0 points of the later posts, where unweighted it ran 0.8
          to 1.7 above. H6 in act 6 turns on the same fact.
        </p>
        <p>
          A harness is for choosing, and choosing needs less than a perfect estimate: it has to rank the options
          the way the future would. Asked to choose C, it picks 0.3, and so would the later posts.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>Which harness makes the choices in acts 5 and 6?</>}
          options={[
            {
              label: "Random 5-fold on all posts",
              verdict: "miss",
              response: <>It overstates the job by 7.4 points and rewards whatever reads the thread: a model that
                memorised conversations would win it.</>,
            },
            {
              label: "Each forum's latest posts",
              verdict: "close",
              response: <>The instinct is right: the future is later. But the release keeps no dates, the
                article-number clock is rough, and a single holdout swings from 1.4 points above the later posts
                to 0.7 below as its size changes.</>,
            },
            {
              label: "Grouped by thread, scored on new threads, weighted to the sender mix",
              verdict: "best",
              response: <>It keeps each conversation on one side, scores only the router&rsquo;s job, and
                corrects the one thing it cannot hold out, how many senders are familiar. It lands within 0.2
                points of the later posts and picks the C they would.</>,
            },
          ]}
        />

        <p>
          So the harness is fixed: five folds of the earlier posts grouped by thread, scored on their new
          threads, reported as they come and weighted to a mix of 36.5% familiar senders. Every choice in acts 5
          and 6 is made on it, and the later posts report the result.
        </p>

        <Callout color={POST} title={<>Test the test</>}>
          A validation scheme is a model of the future, and it fails the ways a model fails. It can leak, as
          random folds do. It can test the wrong population, as scoring all posts does. And it can be drawn from
          a different mix than the one it predicts, as familiar senders are here. Check it once against a later
          period before letting it make every decision.
        </Callout>

        <Followup>
          Find the unit that ties your records together: a customer, a session, a patient, a device, a ticket
          thread. Group your folds by it, score them only on the records the model will face, and compare the
          share of returning users in your folds with the share in production. Then check the whole harness once
          against a later month before letting it choose anything.
        </Followup>

        <SigRule n={10}>
          <strong>Group validation folds by the unit that ties records together, score them on the records the
          model will face, and weight them to the mix it will face.</strong> Check the result once against a later
          period before trusting it with choices.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/closing-the-channels`, label: <>← Closing the channels</> }}
          next={{ href: `${R}/the-metric`, label: <>Next up · The metric, on the right posts →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
