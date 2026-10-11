import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import MemoryDialLab from "@/components/labs/MemoryDialLab";

export const metadata = {
  title: "Linear SVM — Manifold",
  description:
    "The linear SVM, given a search of its own, stays a settled point below naive Bayes. It does win on replies to conversations it was trained on, which the router files without a model, and C is the dial that trades new conversations for old ones.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const SVM = "/learn/support-vector-machines";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outLinearSvm = `the audited view; the harness as before, scored on its 3966 new threads. LinearSVC: one
classifier per forum against the rest; C sets how closely it may fit the earlier posts. Every
fit is required to finish before its iteration cap.

settings on the harness, share routed right (weighted: to the later mix of senders)
  loss           penalty  features      C   right   weighted  words used
  squared hinge  L2       no IDF      0.1   0.7743  0.7677
  squared hinge  L2       no IDF      0.3   0.7970  0.7903
  squared hinge  L2       no IDF        1   0.8011  0.7941
  squared hinge  L2       no IDF        3   0.7940  0.7871
  squared hinge  L2       TF-IDF      0.1   0.8182  0.8116
  squared hinge  L2       TF-IDF      0.3   0.8250  0.8181
  squared hinge  L2       TF-IDF        1   0.8235  0.8169
  squared hinge  L2       TF-IDF        3   0.8195  0.8120
  hinge          L2       TF-IDF      0.3   0.8154  0.8095
  hinge          L2       TF-IDF        1   0.8232  0.8166
  hinge          L2       TF-IDF        3   0.8185  0.8112
  hinge          L2       TF-IDF       10   0.8147  0.8072
  squared hinge  L1       TF-IDF      0.3   0.7433  0.7377     1,301
  squared hinge  L1       TF-IDF        1   0.7887  0.7813     3,803
  squared hinge  L1       TF-IDF        3   0.7857  0.7771     5,988
  squared hinge  L1       TF-IDF       10   0.7809  0.7729     6,868
  sklearn's defaults (squared hinge, L2, C=1): 0.8235
  with the L2 penalty at C=0.3, weight on 88,387 of the fold's 88,392 words, on average

the harness's pick among all 16: squared hinge, L2, TF-IDF, C=0.3: 0.8250 (weighted 0.8181)
  chosen on four folds and scored on the fifth: 0.8222 (the same pick in 4 of 5 folds)
  choosing only C and IDF, as pages 14 and 15 did: 0.8222
  the hinge loss at its best C (1) against the pick: -0.18 (-0.66, +0.30)
  the L1 penalty at its best C (1) against the pick: -3.63 (-4.61, -2.72)

against the bar (complement naive Bayes), each chosen on four folds and scored on the fifth;
points (95%)
  the SVM 0.8222, naive Bayes 0.8328: -1.06 (-1.97, -0.10)
  the pick against the bar's pick, known senders: -0.78 (-2.05, +0.55)
  the pick against the bar's pick, new senders: -1.16 (-2.54, +0.18)`;

const outSvmMemory = `the SVM (squared hinge, TF-IDF, C=0.3) against the bar (complement naive Bayes), each fitted
on the earlier posts. A reply's conversation is its subject without 'Re:', as the thread
lookup reads it.

the later posts, all fitted on every earlier post
                                               posts   the SVM  the bar  SVM - bar, points (95%)
  all posts                                     7532   0.8056   0.8064   -0.08 (-0.74, +0.62)
  new threads                                   2527   0.8168   0.8219   -0.51 (-1.66, +0.71)
  replies, conversation in the training posts   2330   0.8373   0.8197   +1.76 (+0.52, +3.00)
  replies, conversation not in them             2675   0.7675   0.7802   -1.27 (-2.47, -0.07)
  the thread lookup files the 2330 replies whose conversation is in the training posts: 0.9751

the earlier posts in five random folds (page 11's random split)
  all posts                                    11314   0.8795   0.8761   +0.34 (-0.14, +0.86)
  new threads                                   3966   0.8422   0.8533   -1.11 (-2.04, -0.20)
  replies, conversation in the training posts   6221   0.9212   0.9050   +1.62 (+1.01, +2.25)
  replies, conversation not in them             1127   0.7808   0.7968   -1.60 (-3.55, +0.35)

C, how closely the SVM may fit the earlier posts: the later posts, fitted on every earlier post
  C        earlier posts  inside own  new       replies,  replies,  random folds,
           routed right   margin      threads   read      not read  all posts
  0.01     0.8855         1.000       0.7812    0.7631    0.7267    0.8052
  0.03     0.9276         1.000       0.8002    0.7927    0.7499    0.8375
  0.1      0.9683         0.989       0.8104    0.8150    0.7619    0.8634
  0.3      0.9921         0.935       0.8168    0.8373    0.7675    0.8795
  1        0.9991         0.844       0.8097    0.8519    0.7630    0.8881
  3        0.9994         0.782       0.8021    0.8545    0.7548    0.8885
  10       0.9995         0.747       0.8002    0.8541    0.7499    0.8858
  the bar                             0.8219    0.8197    0.7802    0.8761
  the random folds pick C=3; the harness picks C=0.3; the later new threads would pick C=0.3
  C=3 against C=0.3 on the later new threads: -1.46 (-2.26, -0.63)`;

export default function LinearSvmPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 12 minutes"
        title={<>The linear SVM: the third rung</>}
        intro={<>
          The linear SVM has been the yardstick since page 7. Here it gets a search of its own, and the page asks
          why the model that usually wins on text sits a settled point behind the bar.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={5} article={16} total={27}>
          Given a search of its own, does the SVM take the bar back, and why is it the usual winner on text?
        </ArticleOpener>

        <h2>The yardstick gets its own search</h2>
        <p>
          Every comparison since <Link href={`${R}/words-into-numbers`} style={link}>page 7</Link> has been made
          against one SVM: scikit-learn&rsquo;s <code>LinearSVC</code> on TF-IDF at C=0.3, the C the harness picked
          on <Link href={`${R}/the-split`} style={link}>page 11</Link>, with everything else left as the library
          ships it. What it ships is a set of choices. Its loss is the squared hinge, which charges a post the square
          of how far it falls short of its margin, where the textbook SVM&rsquo;s{" "}
          <Link href={`${SVM}/the-hinge-loss`} style={link}>hinge</Link> charges the distance itself. Its penalty is
          L2, which shrinks every word&rsquo;s weight and drops none. And it treats the twenty forums as{" "}
          <Link href={`${SVM}/multi-class-one-vs-one-and-one-vs-rest`} style={link}>twenty separate problems</Link>,
          each forum against the rest.
        </p>
        <p>
          Naive Bayes and logistic regression each got a search of their own, and so does the SVM: both losses, an{" "}
          <Link href="/learn/regularized-regression/why-l1-creates-sparsity" style={link}>L1 penalty</Link>, which
          sets most words&rsquo; weights to exactly zero, the{" "}
          <Link href={`${SVM}/soft-margin-slack-and-c`} style={link}>C</Link> for each, and TF-IDF with or without
          its IDF. Sixteen settings, chosen fold by fold like the others.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>The SVM gets its own loss, penalty, C and features, chosen fold by fold as the other rungs were. Against the bar&rsquo;s 0.833, where does it land?</>}
          options={["Above the bar: the search finds what the defaults missed", "Level with the bar, within the noise", "Below the bar, by more than the noise"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outLinearSvm}</CodeOutput>

        <p>
          The search finds nothing the yardstick lacked. Its pick among sixteen settings is the setting it already
          had, and chosen fold by fold it scores 0.822, exactly as before. The textbook hinge loss is level with the
          squared hinge at its own best C, and scikit-learn&rsquo;s untouched default, C=1, is six posts behind out of
          3,966. The SVM stays 1.06 points below the bar, with an interval from 1.97 to 0.10 below: settled, as{" "}
          <Link href={`${R}/naive-bayes`} style={link}>page 14</Link> found.
        </p>
        <p>
          The L1 penalty is the one setting that changes the model. At its best it gives weight to about 3,800 of
          the 88,000 words and routes 3.6 points fewer new threads right, settled. With the L2 penalty, all but
          five words carry some weight, and on this job the long tail of small weights is worth more than three
          points.
        </p>

        <h2>Where the SVM wins</h2>
        <p>
          Text has been the linear SVM&rsquo;s home ground since Thorsten Joachims showed in 1998 that it beat
          naive Bayes and the other standard methods on newswire and medical abstracts. On this dataset the paper
          page 14 followed found it level with the fixed naive Bayes on random splits, 0.862 against 0.861. Here it
          is a settled point behind. The difference is in which posts get scored. A benchmark scores every later post, or every post of a random
          split, and most of those posts are replies. Many reply to a conversation that already sits in the training
          posts. Split the posts that way, and score the SVM and the bar on each part.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Scored on all 7,532 later posts, the SVM and the bar are level. On which posts does the SVM win?</>}
          options={["Long posts, with many words to go on", "Posts from senders it has seen before", "Replies to conversations it was trained on"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outSvmMemory}</CodeOutput>

        <p>
          Each model wins clearly on its own kind of post. On the 2,330 later replies whose conversation is in the
          training posts, the SVM routes 83.7% right to the bar&rsquo;s 82.0%, a settled 1.76 points. On the 2,675
          replies to conversations it has never seen, the bar wins by a settled 1.27. Added up over all the later
          posts, the two cancel to within 0.08 points: level, as the paper found. Five random folds of the earlier posts
          show the same split. The SVM leads by a settled 1.62 points on replies whose conversation is in the
          training part, and the bar leads by a settled 1.11 on new threads.
        </p>
        <p>
          The router never asks a model about the posts the SVM wins. A reply whose conversation is already filed
          goes where the conversation lives: <Link href={`${R}/the-job`} style={link}>page 2</Link>&rsquo;s thread
          lookup files those 2,330 at 97.5%, far above either model. The posts that reach a model are new threads
          and the first replies of conversations nobody has filed, and on those the bar leads.
        </p>

        <h2>C is a memory dial</h2>
        <p>
          C sets how closely the SVM may fit the earlier posts, and the last table shows what the fit buys. At
          C=0.01 the SVM routes 88.6% of its own training posts right, at C=0.3 99.2%, and from C=1 up all but a
          handful. Past C=0.3 the extra fit goes into the conversations it has read. Replies to them climb from
          0.837 to 0.854, while new threads fall from 0.817 to 0.800 and replies to unread conversations from 0.768
          to 0.750.
        </p>
        <p>
          Which side of that trade a search lands on depends on its test. Most posts in five random folds reply to
          a conversation in the training part, so the folds reward memory and choose C=3. On the later new threads
          that costs a settled 1.46 points against the harness&rsquo;s C=0.3, which is the C the later new threads
          would have chosen themselves.
        </p>
        <p>
          The SVM track&rsquo;s picture of a few{" "}
          <Link href={`${SVM}/support-vectors-exactly`} style={link}>support vectors</Link> holding up the boundary
          does not carry over to text. At C=0.3, 93.5% of the earlier posts sit inside their own forum&rsquo;s
          margin, so nearly every post helps set the weights. It takes C=10 to push even a quarter of them out.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start at C=0.3 on the later posts and slide C up to 10, watching the middle panel against the other two. Then switch to random folds and find the C that routes the most of all posts right.</>}
          insight={<>
            Past C=0.3 the SVM gains on replies to conversations it was trained on and loses on every other kind of
            post, while it routes 99.2% to 99.95% of its own training posts right. Random folds, where most posts
            reply to a conversation in the training part, reward that trade with their best score at C=3.
          </>}
        >
          <MemoryDialLab />
        </LabFrame>

        <DecisionPoint
          accent={POST}
          question={<>The SVM wins on replies to conversations it was trained on and loses on every other kind of post. What does the router use?</>}
          options={[
            {
              label: "Switch to the SVM: it is level on the posts a benchmark scores",
              verdict: "miss",
              response: <>Level on all the later posts, and ahead only on replies to conversations already filed. The
                thread lookup routes those at 97.5% before any model sees them.</>,
            },
            {
              label: "Use the SVM for replies and the bar for new threads",
              verdict: "miss",
              response: <>Replies to filed conversations go to the lookup, not to a model. The replies a model does
                see belong to conversations nobody has filed, and on those the bar leads by a settled 1.27 points.</>,
            },
            {
              label: "Keep the bar for every post that reaches a model",
              verdict: "best",
              response: <>The bar stays complement naive Bayes at 0.833 chosen fold by fold, and the SVM stays the
                yardstick, at the C the harness chose. Its wins are on posts the router files without a model.</>,
            },
          ]}
        />

        <p>
          So the third rung does not take the bar, and the SVM&rsquo;s usual win on text turns out to be memory.
          It fits its training posts until almost all of them are routed right, which pays when a later post
          continues one of their conversations. This job files those by lookup and sends a model the conversations
          nobody has seen. Next come kernels and trees, the first models that do not draw straight lines through
          the words, and the test of H1 from <Link href={`${R}/research-questions`} style={link}>page 5</Link>.
        </p>

        <Callout color={POST} title={<>A ranking holds on the records it was scored on</>}>
          Before adopting a published ranking or a tutorial&rsquo;s winner, ask which records it scored. Split your
          own test set by whether each record&rsquo;s group (a conversation, a customer, a patient, a product)
          appears in training, and compare the candidates on each part separately.
        </Callout>

        <Followup>
          Take two models you are choosing between on your own data. Score them separately on test records whose
          group appears in training and on those whose group does not, and tune C, or your model&rsquo;s nearest
          equivalent, on each part. If the ranking or the chosen setting changes between the parts, decide which
          part your job will send the model.
        </Followup>

        <SigRule n={15}>
          <strong>Choose on the records the job sends the model.</strong> A model that wins by remembering its
          training data wins only where the job repeats itself, and a random split rewards remembering.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/logistic-regression`, label: <>← Logistic regression</> }}
          next={{ href: `${R}/kernels-and-trees`, label: <>Next up · Kernels and trees →</> }}
        />
      </div>
    </article>
  );
}
