import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import LadderLab from "@/components/labs/LadderLab";

export const metadata = {
  title: "Choosing the model — Manifold",
  description:
    "Act 5 ends with two full models that route new threads equally well. Routing with both at once gains on the harness and nothing next month; each finalist wins one of the groups the router watches; one refits in seconds and the other in minutes. The router keeps complement naive Bayes.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outLadder = `each rung chosen fold by fold on the harness's 3966 new threads (1802 from senders met); share right
with its 95% interval. The page where each rung was built is in brackets.
                                           all new threads      senders met          new senders
  complement naive Bayes, the words (14)   0.833 (0.821-0.844)  0.875 (0.859-0.889)  0.798 (0.781-0.815)
  logistic regression, TF-IDF (15)         0.820 (0.808-0.832)  0.863 (0.847-0.878)  0.784 (0.768-0.802)
  the linear SVM, TF-IDF (16)              0.822 (0.810-0.834)  0.864 (0.847-0.880)  0.787 (0.771-0.804)
  the kernel SVM (RBF) (17)                0.812 (0.800-0.825)  0.855 (0.837-0.871)  0.777 (0.760-0.794)
  nearest neighbours (17)                  0.766 (0.753-0.779)  0.822 (0.804-0.840)  0.720 (0.702-0.738)
  a random forest (17)                     0.794 (0.780-0.806)  0.832 (0.815-0.849)  0.762 (0.744-0.780)
  boosted trees (17)                       0.786 (0.773-0.798)  0.825 (0.807-0.843)  0.753 (0.735-0.772)
  naive Bayes + all four readings (18)     0.855 (0.844-0.866)  0.897 (0.882-0.911)  0.820 (0.805-0.836)
  naive Bayes + the sender's history (18)  0.872 (0.862-0.882)  0.935 (0.923-0.946)  0.820 (0.805-0.836)
  naive Bayes + bge-large (19)             0.889 (0.880-0.899)  0.942 (0.931-0.952)  0.846 (0.831-0.861)
  the SVM + all four readings (18)         0.849 (0.838-0.860)  0.880 (0.863-0.896)  0.823 (0.808-0.838)
  the SVM + the sender's history (18)      0.874 (0.864-0.884)  0.935 (0.922-0.946)  0.823 (0.808-0.838)
  the SVM + bge-large (19)                 0.890 (0.880-0.900)  0.941 (0.930-0.952)  0.848 (0.833-0.862)
  both full models together (20)           0.897 (0.889-0.907)  0.947 (0.937-0.957)  0.856 (0.841-0.871)`;

const outChoosing = `the two full models (all four readings, the sender's history, bge-large), as page 19 left them, and
the two routing together: the bar's model's scores + u x the SVM's, u from 0.03 to 30 chosen fold by
fold (picked: 1, 1, 1, 1, 1). The harness's 3966 new threads, share right:
                     all     met      new      each forum counted once
  the bar's model    0.8893  0.9417   0.8457   0.8837
  the linear SVM     0.8901  0.9412   0.8475   0.8847
  both together      0.8974  0.9473   0.8558   0.8910
  no forum's whole interval sits below 0.75 for any of the three.

the weakest forums, and senders met by where the post went (page 18's groups), share right:
                                     posts   bar's  SVM    both   SVM against the bar's model
  alt.atheism                           35   0.714  0.714  0.714  +0.00 (-8.57, +8.57)
  talk.religion.misc                    62   0.710  0.774  0.726  +6.45 (+1.61, +12.90)
  the sender's usual forum            1548   0.974  0.979  0.980  +0.52 (-0.06, +1.16)
  another forum they had posted in      77   0.896  0.922  0.922  +2.60 (+0.00, +6.49)
  a forum they never had               177   0.684  0.621  0.672  -6.21 (-11.86, -0.56)

against each other, points (95%):
  the linear SVM against the bar's model   +0.08 (-0.61, +0.76)
  both together against the bar's model    +0.81 (+0.35, +1.24)
  both together against the linear SVM     +0.73 (+0.20, +1.29)
  both together, one setting in every fold as the later fit has it (u = 1), against the bar's model
  with the same: +0.58 (+0.20, +0.98)
  the two route 94.3% of new threads alike; of the 225 they split, the bar's model is right on 92, the
  SVM on 95, neither on 38

how well the gap between the top two scores sorts right from wrong (the chance a right post has the
larger gap), and the share right among the half of the posts with the larger gaps:
  the bar's model    0.863   surest half 0.981
  the linear SVM     0.869   surest half 0.986
  both together      0.858   surest half 0.983
  the SVM's against the bar's model's: +0.005 (-0.010, +0.022)

the later new threads (report only): each fitted on all 11314 earlier posts, every setting at its best
on the harness; both together at u = 1, the best u on the harness. Share right, and against the
bar's model:
  the bar's model    0.8809   met 0.9090, new 0.8647
  the linear SVM     0.8765   met 0.9047, new 0.8603   -0.44 (-1.27, +0.36)
  both together      0.8809   met 0.9079, new 0.8653   +0.00 (-0.52, +0.52)
  both together at every u: 0.03 +0.00, 0.1 +0.20, 0.3 +0.08, 1 +0.00, 3 +0.12, 10 -0.08, 30 -0.36
  the two route 94.6% of later new threads alike; of the 136 they split, the bar's model is right on 59,
  the SVM on 48`;

export default function ChoosingTheModelPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 13 minutes"
        title={<>Choosing the model: two finalists, one router</>}
        intro={<>
          Seven pages of rungs end with two models that route new threads equally well. This page puts the whole act
          on one chart, then decides between them on everything except the number they tie on.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={5} article={20} total={27}>
          When two models route equally well, what decides between them?
        </ArticleOpener>

        <h2>Act 5 on one chart</h2>
        <p>
          The act started on <Link href={`${R}/naive-bayes`} style={link}>page 14</Link> with complement naive Bayes on
          the words as the bar, 0.833 on the harness&rsquo;s new threads. Logistic regression, the linear SVM and four
          models that bend the boundary each got their own search and none of them passed it. Then the models stayed
          and what they read changed: pairs and pieces of words, the subject and the quoted text on{" "}
          <Link href={`${R}/better-features`} style={link}>page 18</Link>, the sender&rsquo;s history beside them,
          and on <Link href={`${R}/pretrained-embeddings`} style={link}>page 19</Link> bge-large&rsquo;s reading of
          the post. Naive Bayes and the SVM each took all three steps. Every rung below is chosen fold by fold on the
          harness, as each was on its own page, and split by whether the router has met the sender.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Along naive Bayes&rsquo;s path, which step did the most for senders the router has never met?</>}
          options={["Reading all four", "The sender's history", "bge-large"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outLadder}</CodeOutput>

        <LabFrame
          accent={POST}
          tryThis={<>Switch to new senders and follow the naive Bayes path: one of its three steps does not move at all. Then switch to senders met and find the step that does the most.</>}
          insight={<>
            Every gain in act 5 came from reading more, not from a different model. On the words alone the bar of
            page 14 is still the best single model, and the models that bend sit below it for both groups. The history
            reaches only senders the router has met; bge-large reaches new senders most.
          </>}
        >
          <LadderLab />
        </LabFrame>

        <p>
          For new senders the biggest step is bge-large, 2.6 points (0.820 to 0.846), then reading all four, 2.2. The
          history moves them not at all, as it was built not to. For senders the router has met the order reverses: the
          history adds 3.8 points (0.897 to 0.935), reading all four 2.2, bge-large 0.7. From the bar to the full
          model, senders met gain 6.7 points and new senders 4.8. The SVM&rsquo;s path climbs the same way and ends
          in the same place, 0.890 against naive Bayes&rsquo;s 0.889.
        </p>

        <h2>Two finalists, level</h2>
        <p>
          The two full models read the same things: all four readings, the sender&rsquo;s history and bge-large.
          Only the model at the core differs. When two models tie on the metric, there are two ways forward: pick one
          on something else, or route with both. Routing with both here means adding the SVM&rsquo;s scores to the
          bar&rsquo;s model&rsquo;s, with the SVM&rsquo;s weight <em>u</em> chosen fold by fold like every other
          setting. The output compares all three on the harness, on the groups the router watches, on how well each
          one&rsquo;s gap between its top two forums sorts right routes from wrong ones (what act 6 will automate on),
          and on the later posts.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Routing with both models at once, against the bar&rsquo;s model alone:</>}
          options={["Gains on the harness and next month", "Gains on the harness only", "Gains on neither"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outChoosing}</CodeOutput>

        <p>
          On the harness the two are level, +0.08 for the SVM, and they route 94.3% of new threads alike. Of the 225
          they split, naive Bayes is right on 92 and the SVM on 95. Their gaps sort right from wrong equally well
          (0.863 and 0.869, not settled). No forum&rsquo;s whole interval sits below 0.75 for either, so the two
          forums <Link href={`${R}/the-metric`} style={link}>page 12</Link> named have climbed off the floor.
        </p>
        <p>
          Below the average, each wins one group the router watches. The SVM routes talk.religion.misc, the weakest
          forum, 6.45 points better (0.774 against 0.710), settled on 62 posts. Naive Bayes routes posts to a forum
          new to their sender, the group <Link href={`${R}/better-features`} style={link}>page 18</Link> put under
          watch, 6.21 points better (0.684 against 0.621), settled on 177. Neither win outweighs the other.
        </p>
        <p>
          Routing with both is the one settled gain on the harness: +0.81 against naive Bayes, +0.73 against the SVM,
          with <em>u</em> = 1 chosen in every fold. Next month it is +0.00 (&minus;0.52 to +0.52). At no weight does it
          reach more than +0.20 there, and with a single setting in every fold, as the later fit has, its harness gain
          already shrinks to +0.58. On the later posts the two route 94.6% of new threads alike, and where they
          split, naive Bayes is right 59 times to the SVM&rsquo;s 48. Alone they are level next month too: naive
          Bayes 0.881, the SVM 0.877 (&minus;0.44, not settled).
        </p>

        <h2>What else tells them apart</h2>
        <p>
          With accuracy, the sorting of the gap and the watched groups all level or split, what is left is how each
          one lives in production. On this machine, with all 11,314 earlier posts, turning the posts into all four
          readings takes 45 seconds for either model. Naive Bayes then fits in 3.6 seconds; the SVM, at the C its
          search chose, takes 133. Once posts are turned into numbers, scoring them is fast for both, under a quarter
          of a second for 2,527, and both wait on bge-large, which reads about fifteen posts a second. Act 6 will refit the router again and again: when it
          adds a forum, when it spends a labelling budget, when the posts drift. And naive Bayes chose the same
          reading and the same alpha in all five folds, where the SVM&rsquo;s C moved between 3 and 10 from fold to
          fold. A model whose best setting does not move is one less thing to search each time it is refitted.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>The two full models tie on the harness and next month. Routing with both gains 0.81 on the harness and nothing next month. Each finalist wins one watched group. Naive Bayes refits in seconds, the SVM in minutes. Which model does the router keep?</>}
          options={[
            {
              label: "Both together: the harness says it is the one settled gain",
              verdict: "close",
              response: <>The harness does say so, in every fold. But the gain is gone on the later posts at every
                weight, and it costs a second model to fit, search and keep. A gain that needs two models should
                show up next month before it earns them.</>,
            },
            {
              label: "The SVM: it routes the weakest forum better",
              verdict: "close",
              response: <>It does, by four posts out of 62, and it routes posts to a forum new to their sender worse
                by eleven out of 177. On the groups the router watches, the two trade. The SVM also takes 37 times as
                long to fit and its best C moves from fold to fold.</>,
            },
            {
              label: "Keep searching until one of them wins on accuracy",
              verdict: "miss",
              response: <>Both have had their search, and they route 94% of posts alike. More settings tried on the
                same harness would find a winner by chance, and the choice would flatter it.</>,
            },
            {
              label: "Complement naive Bayes: level on accuracy, and fast and steady to refit",
              verdict: "best",
              response: <>The router keeps the bar&rsquo;s model: complement naive Bayes reading all four, with the
                sender&rsquo;s history and bge-large beside it. It routes 0.889 of new threads on the harness and 0.881
                on the later posts, refits in seconds, and chose the same setting in every fold. The weakest forum,
                talk.religion.misc, joins the named groups the metric reports, next to the posts that go to a forum
                new to their sender.</>,
            },
          ]}
        />

        <p>
          Act 5 ends where it began, with naive Bayes, but reading far more than it did on page 14: from 0.833 to
          0.889 on the harness, and from 0.822 to 0.881 on the later posts. Act 6 builds the system around it. The
          next page reads its mistakes and settles H5, the bet that most of them are near misses.
        </p>

        <Callout color={POST} title={<>A tie on the metric is rarely a tie elsewhere</>}>
          When two models score the same, compare them where the system is fragile: the groups your metric names, how
          well each one&rsquo;s confidence sorts right from wrong, how long it takes to refit, and whether its best
          setting moves. And treat a combination of the two as a claim like any other. Check it on a later slice
          before you pay to run both.
        </Callout>

        <Followup>
          Take two models of your own that tie on your metric. Compare them on every group your metric names, on how
          well each one&rsquo;s confidence sorts right from wrong, and on the time to refit on all your data. Then add
          one&rsquo;s scores to the other&rsquo;s with the weight searched on your folds, and score the combination on
          a slice of data later than anything you trained or searched on before you keep both.
        </Followup>

        <SigRule n={19}>
          <strong>Break a tie on what the system depends on.</strong> When two models score the same, choose on the
          groups you watch, the trust in their confidence and the cost to refit, and make a combination of the two show
          its gain next month before it earns a second model.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/pretrained-embeddings`, label: <>← Pretrained embeddings</> }}
          next={{ href: `${R}/reading-the-errors`, label: <>Reading the errors →</> }}
        />
      </div>
    </article>
  );
}
