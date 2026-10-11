import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import HowSureLab from "@/components/labs/HowSureLab";

export const metadata = {
  title: "Logistic regression — Manifold",
  description:
    "Logistic regression fits its weights instead of counting them, and its output is a probability. It routes a settled point and a quarter below naive Bayes, and its one advantage, a number that means what it says, can be fitted on top of the bar.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outLogistic = `the audited view; the harness as before, scored on its 3966 new threads. Softmax logistic
regression over the 20 forums with an L2 penalty; C sets how closely it may fit the earlier
posts (one over the penalty's strength). Every fit runs from cold to a gradient of 1e-8.

sklearn's default solver (lbfgs, tolerance 1e-4) at C=100, on the five folds:
  stops after 61 to 85 of its 100 steps, with no warning
  its loss 0.9% to 6.6% above the minimum; routes 0.8195 against 0.8207 at the minimum
  its probabilities differ from the minimum's by 0.010 on the median post, 0.35 at most

features and C on the harness, share routed right (weighted: to the later mix of senders)
  features      C   right   weighted
  TF-IDF        1   0.8081  0.8019
  TF-IDF        3   0.8187  0.8124
  TF-IDF       10   0.8190  0.8121
  TF-IDF       30   0.8192  0.8123
  TF-IDF      100   0.8207  0.8137
  TF-IDF      300   0.8205  0.8134
  TF-IDF     1000   0.8195  0.8120
  no IDF       10   0.7761  0.7690
  no IDF      100   0.7816  0.7750
  no IDF     1000   0.7837  0.7770
  TF-IDF from C=3 to C=1000: within 8 posts of each other

the harness's pick: TF-IDF, C=100: 0.8207 (weighted 0.8137)
  chosen on four folds and scored on the fifth: 0.8200 (the same pick in 4 of 5 folds)

against the bar (complement naive Bayes) and the SVM, each chosen on four folds and scored on
the fifth; points (95%)
  logistic 0.8200, naive Bayes 0.8328: -1.29 (-2.29, -0.25)
  logistic 0.8200, the SVM 0.8222:     -0.23 (-0.78, +0.35)
  the pick against the bar's pick, known senders: -1.17 (-2.55, +0.22)
  the pick against the bar's pick, new senders: -1.62 (-3.14, -0.18)
  routed alike: logistic and the SVM 94.4%, logistic and naive Bayes 85.6%, naive Bayes and
  the SVM 87.4%`;

const outHowSure = `the harness's 3966 new threads. 'says': the probability a model gives its pick, on average;
calibration error: in each tenth of stated probability, the gap between the probability
stated and the share routed right, averaged over the posts

logistic regression on TF-IDF, by C
      C   right   says   log loss calibration error
      1   0.8081  0.405  1.2423   0.403
      3   0.8187  0.548  0.9503   0.271
     10   0.8190  0.656  0.7891   0.163
     30   0.8192  0.722  0.7179   0.100
    100   0.8207  0.774  0.6840   0.064
    300   0.8205  0.809  0.6778   0.043
   1000   0.8195  0.837  0.6897   0.040
  the lowest log loss is at C=300 in every fold

how sure each model says it is, against how often it is right (the harness's new threads)
                                             right   says   expected  right  calibration error
  naive Bayes, the textbook model            0.7526  0.966    3831     2985  0.213
  complement naive Bayes (the bar)           0.8348  0.184     730     3311  0.651
  logistic, C=300                            0.8205  0.809    3208     3254  0.043
  the bar + a probability fitted to its gap  0.8348  0.835    3311     3311  0.032
  the bar's own probability for its pick: median 0.113, on posts it routes right 83.5% of the time
  on the median post, the bar's twenty scores span 1.03 log units, best to worst; the textbook
  model's pick leads its second by 22.1

sorting right from wrong: the chance a right route scores above a wrong one; the share right
among the surest 80% of posts
  complement naive Bayes, its probability        0.779   0.897
  complement naive Bayes, the gap to its second  0.835   0.913
  the SVM, the gap to its second                 0.841   0.912
  logistic C=300, its probability                0.828   0.902

the later new threads (report only; every model fitted on all earlier posts):
  logistic, C=300: right 0.8073, says 0.821
    expects 2075 right of 2527, gets 2040; calibration error 0.055
  the bar + its fitted probability: right 0.8219, says 0.829
    expects 2095 right of 2527, gets 2077; calibration error 0.037`;

export default function LogisticRegressionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 13 minutes"
        title={<>Logistic regression: the second rung</>}
        intro={<>
          Logistic regression reads the same words as the SVM, fits a weight for each, and turns its scores into a
          probability for every forum. Two questions: does fitting the weights route better than counting them,
          and is a probability worth having on this job?
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={5} article={15} total={27}>
          Does fitting the weights beat counting them, and what is the probability for?
        </ArticleOpener>

        <h2>Fitting the weights instead of counting them</h2>
        <p>
          <Link href={`${R}/naive-bayes`} style={link}>Naive Bayes</Link> sets each word&rsquo;s weight by counting:
          how often the word turns up in each forum. Logistic regression gives each forum a weight per word too, but
          finds the weights by search. It starts from zero and adjusts them, step after step, until the twenty
          forums&rsquo; scores, turned into probabilities by the{" "}
          <Link href="/learn/logistic-regression/softmax-and-multinomial" style={link}>softmax</Link>, give every
          earlier post&rsquo;s own forum as much probability as they can. What it minimises is the{" "}
          <Link href="/learn/logistic-regression/log-loss" style={link}>log loss</Link>, plus a{" "}
          <Link href="/learn/logistic-regression/regularized-logistic-regression" style={link}>penalty</Link> on
          large weights; C sets the balance, and a larger C lets it fit the earlier posts more closely.
        </p>
        <p>
          It is the model most teams try second, and often first. Every library has it, it has one dial, and what it
          prints is a probability: &ldquo;sci.med, 0.86&rdquo;. A router that can say how sure it is can be told
          to hand the posts it is unsure of to a person, which is where act 6 is going.
        </p>

        <h2>The default stops short</h2>
        <p>
          A fitted model is only the model its maths describes if the search actually reached the bottom. On these
          posts, at C=100, sklearn&rsquo;s default solver stops after 61 to 85 of its 100 steps, satisfied with
          its own tolerance, and raises no warning. Its loss is up to 6.6% above the minimum. It routes almost the
          same posts right (0.820 against 0.821), but the probabilities it prints are another model&rsquo;s: off by
          0.01 on the median post and by up to 0.35. Every fit on this page runs from scratch to a tolerance ten
          thousand times tighter. On your own data, compare the loss your fit reached with a fit run longer before
          you read anything off its probabilities.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Logistic regression gets the SVM&rsquo;s TF-IDF and its own choice of C, chosen fold by fold as naive Bayes was. Against the bar&rsquo;s 0.833, where does it land?</>}
          options={["Above the bar: fitting beats counting", "Level with the bar, within the noise", "Below the bar, by more than the noise"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outLogistic}</CodeOutput>

        <p>
          Like the SVM, logistic regression needs IDF: without it, it scores 0.78, with it 0.82. Past C=3 the dial
          hardly matters; from C=3 to C=1000 the share routed right stays within eight posts of 3,966. The harness
          picks C=100, 0.821. Chosen on four folds and scored on the fifth, it scores 0.820, which is 1.29 points
          below naive Bayes, with an interval from 2.29 to 0.25 below. That is settled: the second rung does not
          take the bar.
        </p>
        <p>
          Against the SVM it is level, 0.23 points behind with an interval either side of zero, and the two route
          94.4% of the new threads alike, more than either does with naive Bayes. They read the same numbers and
          differ only in their loss. The SVM stops pushing a post once it is routed right by a margin; logistic
          regression keeps pushing every post, a little. On this harness that difference moves almost nothing.
          Naive Bayes, which gets its weights a different way, is the one that disagrees.
        </p>

        <h2>How sure, and how right</h2>
        <p>
          Every model here can print a probability; scikit-learn gives naive Bayes a <code>predict_proba</code> as
          well. The test of a probability is the posts it is given to. Of the posts a model gives about 0.8, about
          80% should be routed right. Gather the posts into tenths by the probability stated, compare the share right
          in each tenth with the probability stated, and average the gaps over the posts: that is the calibration
          error the next output reports. The{" "}
          <Link href="/learn/evaluation/calibration" style={link}>calibration</Link> page of the evaluation track
          covers it in general.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>The bar, complement naive Bayes, routes 83.5% of the harness&rsquo;s new threads right. What probability does it typically give its own pick?</>}
          options={["About 0.83: it knows how good it is", "Close to 1: naive Bayes is overconfident", "Close to 0.1"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outHowSure}</CodeOutput>

        <p>
          The bar&rsquo;s probability is close to useless as a number. On the median post it gives its pick 0.113,
          and on average it expects 730 of the 3,966 to be right, where 3,311 are. Complement naive Bayes scales every
          post to the same length, so the twenty forums&rsquo; scores for a post sit close together, 1.03 log units
          from best to worst on the median post, and the softmax of close scores spreads the probability over all
          twenty. The textbook model fails the other way: its scores add up the logs of hundreds of word counts, its
          pick leads the runner-up by 22 log units on the median post, and it gives its pick 0.966 on average while
          being right 75.3% of the time. The textbook warning that naive Bayes is
          overconfident is half the story; the fixed model is the opposite.
        </p>
        <p>
          Logistic regression&rsquo;s probability is the only one fitted to be a probability, and at C=300 it says
          roughly what it gets: 0.809 on average against 0.821 right, 3,208 expected against 3,254. At C=1000 it
          starts to say more than it gets. Watch what C does. From C=1 to C=1000 the share routed right moves by a point, while the probability
          stated climbs from 0.40 to 0.84. C decides how sure the model sounds, not where it routes. Accuracy cannot
          choose C for a probability; the log loss can, and it picks C=300 in every fold, where accuracy picked 100.
          If the number will be read, choose C by the score that reads it.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start on logistic regression at C=100 and slide C from 1 to 1000, watching the two lines under the diagram. Then switch to the textbook naive Bayes, the bar, and the bar with a fitted probability.</>}
          insight={<>
            Sliding C moves the stated probability from 0.40 to 0.84 while the share routed right stays between 0.81
            and 0.82. The bar&rsquo;s circles sit far above the diagonal: of the posts it gives about 0.14, nine in ten
            are routed right. One fitted curve puts them on the line without changing a single route.
          </>}
        >
          <HowSureLab />
        </LabFrame>

        <h2>What a threshold needs, and what a person needs</h2>
        <p>
          Act 6 will let the router file a post on its own only when it is sure enough, and pass the rest to a person.
          For that, the score has to put the right routes above the wrong ones; the threshold itself will be set on
          held-out posts, so the score&rsquo;s scale does not matter. Measured that way, the bar is not behind. The
          gap between its two best scores puts a right route above a wrong one 83.5% of the time, logistic
          regression&rsquo;s probability 82.8%, and among the surest 80% of posts the bar is right on 91.3% to
          logistic regression&rsquo;s 90.2%. The bar&rsquo;s printed probability sorts worse than its own gap
          (77.9%): it depends on all twenty forums&rsquo; scores, not only the two in the contest.
        </p>
        <p>
          A person reading &ldquo;sci.med, 0.86&rdquo;, or a manager estimating tomorrow&rsquo;s misroutes, needs the
          number itself to be right. That can be fitted too: a logistic regression with one input, the bar&rsquo;s gap,
          fitted on the other four folds&rsquo; new threads to say whether the pick is right. This is John
          Platt&rsquo;s method, published in 1999 to turn SVM scores into probabilities. It expects 3,311 right and
          3,311 are, with a calibration error of 0.032, below logistic regression&rsquo;s own 0.043. Because the
          fitted probability rises with the gap, it sorts the posts exactly as the gap does and changes no route.
        </p>
        <p>
          On the later posts, reported and not used, both slip the same way. Logistic regression expects 2,075 of
          2,527 right and gets 2,040; the bar with its fitted probability expects 2,095 and gets 2,077, and routes 1.5
          points more of them right. Whether a promise set on the harness holds next month is act 6&rsquo;s question.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>Logistic regression routes a settled 1.3 points below the bar, and its probability is the only one that means what it says. What goes into the router?</>}
          options={[
            {
              label: "Switch to logistic regression: act 6 needs a probability",
              verdict: "miss",
              response: <>That pays 1.3 settled points of routing for something the bar can have without paying: a
                probability fitted to the bar&rsquo;s gap is better calibrated than logistic regression&rsquo;s own
                (0.032 against 0.043) and changes no route.</>,
            },
            {
              label: "Keep the bar and threshold its own probability",
              verdict: "miss",
              response: <>Its probability sorts worse than its gap (77.9% against 83.5%), and it gives the median post
                0.11, where posts given about that are routed right nine times in ten. Anyone who sees that number
                is misled by it.</>,
            },
            {
              label: "Keep the bar, and fit a probability to its gap fold by fold",
              verdict: "best",
              response: <>The bar stays complement naive Bayes at 0.833 chosen fold by fold. Its gap is the score act 6
                starts from, and the fitted probability is the number a person sees. Logistic regression joins the
                router as that last step: one weight and one intercept.</>,
            },
          ]}
        />

        <p>
          So the second rung does not take the bar, and the reason to try it turned out not to need it. Logistic
          regression routes like the SVM, a little below naive Bayes. Its probability is honest once C is chosen by
          log loss, but honesty can be fitted on top of any score that sorts the posts well, and the bar&rsquo;s does.
          Next comes the linear SVM as a rung of its own: the model act 4 built the harness around, given its own
          search.
        </p>

        <Callout color={POST} title={<>A probability can be added; a point of routing cannot</>}>
          Before switching models for a property, check whether it can be fitted onto the model you have. A
          calibrated probability can be fitted to any score that sorts right from wrong, on held-out folds, without
          changing a single prediction.
        </Callout>

        <Followup>
          On your own classifier, put two numbers side by side for each candidate score: how well it sorts right
          predictions above wrong ones, and its calibration error. Then fit a one-input logistic regression to the
          best sorter on held-out folds, and see whether it is honest enough to show to a person.
        </Followup>

        <SigRule n={14}>
          <strong>Choose the model on what cannot be added later.</strong> A probability can be fitted to any score
          that sorts the records well; a point of accuracy cannot.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/naive-bayes`, label: <>← Naive Bayes</> }}
          next={{ href: `${R}/linear-svm`, label: <>Next up · Linear SVM →</> }}
        />
      </div>
    </article>
  );
}
