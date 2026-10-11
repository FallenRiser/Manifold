import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { PredictionRegister } from "@/components/capstone/PredictionRegister";
import ResolutionLab from "@/components/labs/ResolutionLab";
import res from "@/data/routing/resolution.json";

export const metadata = {
  title: "Research questions — Manifold",
  description:
    "Before the modelling starts, write down what you expect: the decision each question feeds, the result you predict, and the result that would prove you wrong. First measure how finely the test set can answer. Its 2,527 posts settle some of the capstone's own early claims and not others.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const pair = (k: string) => res.pairs.find((p) => p.key === k)!;
const pts = (x: number) => Math.abs(100 * x).toFixed(1);
const pts2 = (x: number) => Math.abs(100 * x).toFixed(2);
const pct = (x: number) => (100 * x).toFixed(0) + "%";
const fmt = (x: number) => x.toLocaleString("en-US");
const tail = pair("tail");
const bge = pair("bge");
const miniBoth = pair("mini_both");
const bgeBoth = pair("bge_both");
const mini = pair("minilm");
const view = pair("view");

const outResolution = `the later new threads: 2527 posts
  router's view, linear SVM (C=0.3): 0.8235, 95% interval 0.8093 to 0.8378
  (bootstrap, 2000 resamples; the normal approximation gives +/-0.0149)
  one forum's new threads: 29 (alt.atheism) to 353 (misc.forsale), median 108
    the smallest: 0.448, 95% interval 0.276 to 0.621

two models on the same 2527 posts: only the posts where they disagree say which is better
                                                 diff  disagree         95% interval  posts needed
the whole post vs the router's view           +0.0004       187   -0.0103 to +0.0107       1815274
the router's view vs scikit-learn's cleaning  +0.0423       203    0.0317 to +0.0530           168
the tail kept vs the tail cut                 +0.0075        71    0.0012 to +0.0142          1905
TF-IDF vs MiniLM alone                        +0.0404       398    0.0245 to +0.0562           368
bge-large alone vs TF-IDF                     +0.0087       336   -0.0047 to +0.0233          6735
TF-IDF + MiniLM vs TF-IDF                     +0.0269       120    0.0190 to +0.0352           248
TF-IDF + bge-large vs bge-large alone         +0.0273       203    0.0158 to +0.0384           410
TF-IDF + bge-large vs TF-IDF                  +0.0360       165    0.0269 to +0.0459           190
(posts needed: how many new threads, with the same disagreements, would put zero
 outside the interval; the interval above is a bootstrap of 2000 resamples)

two different groups of posts
  known vs new senders (923 vs 1604)            +0.0459, 95% interval +0.0175 to +0.0745
  what cutting the tail costs, known senders   +0.0163, 95% interval +0.0054 to +0.0271
                               new senders     +0.0025, 95% interval -0.0062 to +0.0112
                               the difference  +0.0138, 95% interval +0.0003 to +0.0274
  the 95% promise: 2059 routed on their own, 0.9335 right, 95% interval 0.9223 to 0.9441`;

// the four counts behind two of the comparisons, as the script printed them
const counts = (p: typeof tail) => {
  const right = Math.round(p.acc_a * res.n) - p.only_a;
  return [right, p.only_a, p.only_b, res.n - right - p.only_a - p.only_b];
};
const code = `import numpy as np

# Two models scored on the same posts: True where each one routed the post right.
# Rebuilt from four counts (both right, only a, only b, neither); the order does not matter.
def posts(both, only_a, only_b, neither):
    a = np.repeat([True, True, False, False], [both, only_a, only_b, neither])
    b = np.repeat([True, False, True, False], [both, only_a, only_b, neither])
    return a, b

def paired_interval(a, b, z=1.96):
    n = len(a)
    pa = np.mean(a & ~b)              # share of posts only a gets right
    pb = np.mean(~a & b)              # share of posts only b gets right
    diff = pa - pb                    # the same as a.mean() - b.mean()
    sd = np.sqrt(pa + pb - diff**2)   # one post's (a - b) is +1, -1 or 0
    half = z * sd / np.sqrt(n)
    return diff, diff - half, diff + half

def bootstrap_interval(a, b, reps=2000, seed=16):
    rng = np.random.default_rng(seed)
    d = a.astype(float) - b.astype(float)
    means = [d[rng.integers(0, len(d), len(d))].mean() for _ in range(reps)]
    return np.percentile(means, [2.5, 97.5])

for name, c in [("${bge.a} vs ${bge.b}", (${counts(bge).join(", ")})),
                ("${tail.a} vs ${tail.b}", (${counts(tail).join(", ")}))]:
    a, b = posts(*c)
    diff, lo, hi = paired_interval(a, b)
    blo, bhi = bootstrap_interval(a, b)
    print(f"{name:30s} {diff:+.4f}   normal {lo:+.4f} to {hi:+.4f}   bootstrap {blo:+.4f} to {bhi:+.4f}")`;

export default function ResearchQuestionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 1 · Frame the job", color: "var(--c-metrics)" }]}
        time="about 14 minutes"
        title={<>Research questions</>}
        intro={<>
          The first four pages turned up more questions than any project has time to answer. Before any
          modelling, write down the ones that matter: what each would change, what you expect, and what would
          prove you wrong. And before writing a single number, find out how finely the data can check one.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={1} article={5} total={27}>
          Before you look: which answers would change what you build, what do you expect them to be, and can
          your data tell?
        </ArticleOpener>

        <h2>Why write it down first</h2>
        <p>
          Once you have seen a result, it looks obvious, and nobody remembers what they expected before. A result
          can only surprise you if the expectation was written down, and the surprises are where you learn the
          domain.
        </p>
        <p>
          The second reason is sharper in a project like this one. Twenty forums, five parts of a post, a dozen
          models, three ways to validate: that is enough comparisons for some to look good by luck. Choose which
          ones to believe after seeing them and you will tend to choose the lucky ones. A prediction written
          beforehand fixes which comparison counts.
        </p>

        <h2>Start from the decisions</h2>
        <p>
          A question belongs on the list if its answer could change something you build. The router&rsquo;s owner
          has a short list of decisions left: what the router may read, which model to run, whether the pretrained
          embedding is worth its GPU, where to set the threshold so the promise holds next month, what happens when
          a forum appears that the router has never seen, and what a new forum costs in labels. Each decision gets
          a question. Each question gets a prediction, if there is evidence to predict from. Plenty of questions
          are interesting and change nothing, such as which forum writes the longest posts. They can wait.
        </p>
        <p>
          A prediction also needs a line, &ldquo;wrong if the result falls below this&rdquo;, and the line is only
          useful if the data can resolve it. Draw it finer than the test set can measure and every verdict is a coin
          toss. So before writing any predictions, measure the resolution of the test set: the {fmt(res.n)} new
          threads.
        </p>

        <h2>How finely can {fmt(res.n)} posts answer?</h2>

        <PredictPrompt
          accent={POST}
          prompt={<>
            On its own, the large embedding routes {bge.acc_a.toFixed(3)} of the new threads right and the word
            counts {bge.acc_b.toFixed(3)}, scored on the same {fmt(res.n)} posts. Can those posts tell the two
            apart?
          </>}
          options={["Yes, 2,527 posts is plenty for a point", "No, a point is inside the noise", "It depends on something those two numbers do not show"]}
          nudge="Locked in. The answer is in the second table below."
        />

        <p>The measurement puts an interval around the claims the first four pages made:</p>
        <CodeOutput source="scripts/routing_cases.py">{outResolution}</CodeOutput>

        <p>
          One model&rsquo;s accuracy on {fmt(res.n)} posts is known to about &plusmn;1.4 points ({res.lo.toFixed(3)} to{" "}
          {res.hi.toFixed(3)}). One forum&rsquo;s is known far less well. {res.forums.min_name} opened only{" "}
          {res.forums.min} of the new threads, and the interval on its accuracy runs from {pct(res.forums.min_lo)} to{" "}
          {pct(res.forums.min_hi)}. A prediction about a single small forum is one this test set cannot check.
        </p>
        <p>
          Comparing two models is different, and better, because both are scored on the same posts. Most posts are
          routed right by both or wrong by both, and those say nothing about which model is better. Only the posts
          where the two disagree do. That is why the size of a difference does not decide whether it is settled:
        </p>
        <ul style={ol}>
          <li>
            Keeping or cutting the tail changes accuracy by {pts2(tail.acc_a - tail.acc_b)} points, and the difference is
            settled ({pts(tail.lo)} to {pts(tail.hi)}), because the two views disagree on only{" "}
            {tail.only_a + tail.only_b} posts.
          </li>
          <li>
            bge-large on its own against TF-IDF is a larger difference, {pts2(bge.acc_a - bge.acc_b)} points, and it is
            not settled (&minus;{pts(bge.lo)} to +{pts(bge.hi)}), because they disagree on {bge.only_a + bge.only_b}{" "}
            posts: {bge.only_a} one way, {bge.only_b} the other.
          </li>
        </ul>
        <p>
          The arithmetic fits in a few lines. One post&rsquo;s contribution to the difference is +1, &minus;1 or 0,
          so its spread depends only on how often each model is right alone; divide by the square root of the number
          of posts and you have the interval. Check it against a bootstrap, which resamples the posts and needs no
          formula at all:
        </p>
        <CodeBlock setup="" fromScratch={code} />

        <LabFrame
          accent={POST}
          tryThis={<>Start on bge-large alone against TF-IDF and drag the test set up until the difference is settled. Then switch to the tail.</>}
          insight={<>
            The tail&rsquo;s two accuracy intervals overlap almost completely, and the paired difference is settled
            anyway. Reading two overlapping intervals as &ldquo;no difference&rdquo; throws away the fact that both
            models were scored on the same posts. bge-large against TF-IDF needs about{" "}
            {fmt(Math.round(needed(bge) / 100) * 100)} new threads to settle, more than twice as many as the test set has.
          </>}
        >
          <ResolutionLab />
        </LabFrame>

        <h2>Our own claims, checked</h2>
        <p>The same measurement is an audit of what the first four pages said:</p>
        <ul style={ol}>
          <li>
            <strong>The large embedding against the word counts</strong> (page 1) is not settled, which is why page 1
            calls it a draw. The other embedding claims hold. MiniLM on
            its own loses to the word counts, by {pts(mini.acc_a - mini.acc_b)} points ({pts(mini.lo)} to {pts(mini.hi)}).
            Either embedding placed beside the word counts beats both of its parts: TF-IDF + MiniLM beats TF-IDF by{" "}
            {pts(miniBoth.lo)} to {pts(miniBoth.hi)} points, and TF-IDF + bge-large beats bge-large alone by{" "}
            {pts(bgeBoth.lo)} to {pts(bgeBoth.hi)}.
          </li>
          <li>
            <strong>&ldquo;The headers, quotes and signatures are worth nothing on the new threads&rdquo;</strong>{" "}
            (page 1) holds in the only sense the data allows: whatever they are worth is less than about a point,
            either way ({view.lo < 0 ? "−" : "+"}{pts(view.lo)} to +{pts(view.hi)}).
          </li>
          <li>
            <strong>&ldquo;Cutting the tail costs {pts2(tail.acc_a - tail.acc_b)} points&rdquo;</strong> (page 4) is settled.
            So, only just, is the split page 4 drew from it: familiar senders lose {pts(res.tail.known)} points
            ({pts(res.tail.known_lo)} to {pts(res.tail.known_hi)}), new senders {(100 * res.tail.new).toFixed(2)}{" "}
            (&minus;{pts(res.tail.new_lo)} to +{pts(res.tail.new_hi)}), and the interval on the difference between
            the two clears zero by {(100 * res.tail.lo).toFixed(2)} of a point.
          </li>
          <li>
            <strong>Familiar senders are routed better than new ones</strong>, by {pts(res.senders.gap)} points
            (page 4): settled, {pts(res.senders.lo)} to {pts(res.senders.hi)}.
          </li>
          <li>
            <strong>The 95% promise slipped to {(100 * res.promise.acc).toFixed(1)}%</strong> (page 1): the interval
            on the {fmt(res.promise.routed)} posts routed without a person runs from {(100 * res.promise.lo).toFixed(1)}% to{" "}
            {(100 * res.promise.hi).toFixed(1)}%, and 95% is outside it. The slip is real, so act 6 has something
            real to explain.
          </li>
        </ul>

        <h2>The register</h2>
        <p>
          Now the predictions. Each entry below names the decision it feeds, predicts a result, says why, and says
          what result would prove it wrong. One rule covers them all: every result is read with its 95% interval,
          and if the interval straddles the line, the entry is marked <em>not settled</em>, whichever side of the
          line the estimate lands on.
        </p>
        <p>Bet on each one as you read. You will meet every entry again on the page that settles it.</p>

        <PredictionRegister />

        <p>
          Not every question gets a prediction. Nothing on pages 1 to 4 says how many labelled posts a new forum
          needs, so the register lists it as an estimate: a number to measure, with nothing to test it against.
          A prediction made up for the occasion would add a guess to the register and nothing else.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>
            Suppose H4 comes back with familiar senders gaining a little more from the embedding than new senders,
            and zero inside the interval of the difference. What goes in the register?
          </>}
          options={[
            {
              label: "Wrong: familiar senders gained more",
              verdict: "miss",
              response: <>That reads the estimate and ignores the interval. With {fmt(res.senders.known)} new threads
                from familiar senders and {fmt(res.senders.new)} from new ones, a gap of a point or two between the
                two gains sits inside the noise. Calling it wrong would be a verdict the data did not give.</>,
            },
            {
              label: "Confirmed: the gains are close enough",
              verdict: "miss",
              response: <>The claim was that new senders gain at least as much. The data does not show that either.
                Counting a draw as a win for your own prediction is the same mistake in the flattering direction.</>,
            },
            {
              label: "Not settled, with what it would take to settle it",
              verdict: "best",
              response: <>The entry stays open, and the register says what would close it: how many posts, or a
                sharper test. A register where every entry gets a verdict is either very lucky or not being straight
                about its noise.</>,
            },
          ]}
        />

        <Callout color={POST} title={<>Only the disagreements count</>}>
          Two models scored on the same posts are told apart by the posts they disagree on, and by nothing else.
          A small difference with few disagreements can be settled; a larger one with many cannot. So a
          prediction&rsquo;s line has to sit above the noise that the test set, and the disagreements you expect,
          imply. Otherwise its verdict was decided by chance.
        </Callout>

        <Followup>
          Before the next comparison you run at work, write three lines: the decision it feeds, the result you
          expect, and the result that would prove you wrong. Count your test records and guess how many of them the
          two versions will disagree on. If the difference you care about needs more records than you have, collect
          more or ask a coarser question. Keep the lines, and mark each one when the result comes in, including the
          ones you got wrong.
        </Followup>

        <SigRule n={4}>
          <strong>Write each prediction down before you look: the decision it feeds, the result you expect, and
          the result that would prove it wrong.</strong> Check first that your test set can resolve a difference
          that size.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/anatomy-of-a-post`, label: <>← Anatomy of a post</> }}
          next={{ href: `${R}/first-look`, label: <>Next up · First look at the posts →</> }}
        />
      </div>
    </article>
  );
}

function needed(p: { only_a: number; only_b: number }) {
  const a = p.only_a / res.n, b = p.only_b / res.n;
  return ((1.959964 * Math.sqrt(a + b - (a - b) ** 2)) / (a - b)) ** 2;
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
