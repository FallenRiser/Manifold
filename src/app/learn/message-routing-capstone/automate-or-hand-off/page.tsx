import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { Settled } from "@/components/capstone/PredictionRegister";
import AutomationDialLab from "@/components/labs/AutomationDialLab";

export const metadata = {
  title: "Automate or hand off — Manifold",
  description:
    "The router files a post on its own only when it is sure enough to be right 95% of the time. Set on the harness, or on folds grouped by sender, that threshold delivers 93.9% next month. The slip is time, not who writes, and only each forum's latest posts see it coming.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outAutomate = `the router files a new thread without a person when the gap between its two best scores reaches a
threshold, and hands the rest to a moderator with its three best forums. The threshold is the smallest
gap at which the posts it is set on, surest first, are still right 95% of the time: set on the earlier
posts, held on the later ones. (The router at its one setting in every fold, as it runs next month.)

                             where it is set:             the later new threads:
  set on                     posts  threshold  routed   right   routed  right (95% interval)
  the harness (by thread)     3966      0.831   0.845  0.9502    0.836  0.9389 (0.9283-0.9489)
  folds grouped by sender     3966      0.788   0.850  0.9502    0.841  0.9388 (0.9284-0.9488)
  the harness, reweighted     3966      0.940   0.816  0.9503    0.816  0.9418 (0.9313-0.9519)
  (reweighted: each harness post weighted so senders met make up 36.5%, as in the later posts)
the later new threads' own threshold, in hindsight: 1.218, routing 0.768
H6, the sender-grouped threshold delivers 95% on the later posts: 0.9388 (0.9284-0.9488): wrong

is it the senders?
  later, at the harness's threshold, share right: senders met 0.9409, new senders 0.9376
  on folds grouped by sender the router routes 0.8903 of the earlier new threads (the harness 0.8926): the
  posts of senders the harness met 0.9034, the others 0.8794 (on the harness 0.9428 and 0.8507)
  grouped by sender, a thread's replies can sit in the training folds (page 11). Folds that keep out both
  the sender and the conversation cannot be built: senders and threads chain 7888 of the 11314 earlier
  posts (69.7%) into one block
is it the refit on every earlier post?
  each harness fold model on the later new threads, at the harness's threshold: right 0.9352 to 0.9412
  (the refit 0.9389)`;

const outLatest = `each forum's latest earlier posts (page 11's time holdouts, by article number): the router fitted on the
rest, its threshold set on the latest posts' new threads
                   new   at the harness's 0.831       own   the later new threads:
  set on       threads   routed  right      threshold   routed  right (95% interval)
  latest 20%       805    0.847  0.9413         1.069    0.794  0.9447 (0.9340-0.9549)
  latest 25%       998    0.838  0.9462         1.036    0.797  0.9439 (0.9334-0.9541)
  latest 33%      1330    0.830  0.9375         1.046    0.796  0.9443 (0.9337-0.9547)

the hand-off on the 2527 later new threads, at the latest quarter's threshold and at the harness's:
                                             latest quarter   the harness
  filed without a person                     2013 (0.797)     2112 (0.836)
    of those, in the wrong forum             113              129
    replies that follow them there (page 2)  114              114
  handed to a moderator                      514 (0.203)      415 (0.164)
    right forum among the router's three     0.926            0.918
a check of filed posts drawn at random reads a share right of 95% to within (95% interval):
  100 posts +-4.3 points, 300 posts +-2.5 points, 1000 posts +-1.4 points`;

export default function AutomateOrHandOffPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 6 · Build the system around the model", color: "var(--c-metrics)" }]}
        time="about 14 minutes"
        title={<>Automate or hand off: a promise that has to hold next month</>}
        intro={<>
          The router files a post on its own only when it is sure, and hands the rest to a person. How sure is sure
          enough has to be fixed before next month&rsquo;s posts arrive. This page sets that threshold three ways
          and finds out which one keeps its promise.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={6} article={22} total={27}>
          How sure must the router be to file a post by itself?
        </ArticleOpener>

        <h2>The promise and the dial</h2>
        <p>
          <Link href={`${R}/the-job`} style={link}>Page 2</Link> wrote down the operators&rsquo; terms: among the
          posts the router files by itself, no more than one in twenty goes to the wrong forum. Everything else goes
          to a moderator, and since <Link href={`${R}/reading-the-errors`} style={link}>the last page</Link> it goes
          with the router&rsquo;s three best forums in order. The dial that splits the two is the gap between the
          router&rsquo;s two best scores. A wide gap means it is sure; a post whose gap reaches the threshold is
          filed without a person.
        </p>
        <p>
          The threshold has to be set before the posts it will judge arrive. So it is set on earlier posts: line them
          up surest first, and take the smallest gap at which they are still right 95% of the time. Back on{" "}
          <Link href={`${R}`} style={link}>page 1</Link>, a threshold set this way on the first model delivered 93.3%,
          not 95%. H6 put that down to who writes. Folds grouped by thread keep a sender&rsquo;s other posts in the
          training folds, so the harness has met 45% of its senders, against 36.5% next month, and senders the router
          has met are routed better. Set the threshold on folds grouped by sender, H6 bet, and the later posts get
          their 95%. The output sets it three ways, with the router act 5 chose: on the harness, on folds grouped by
          sender, and on the harness reweighted to next month&rsquo;s mix of senders.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Set on the harness to be right 95% of the time, what does the threshold deliver on the later new threads?</>}
          options={["95% or more", "About a point short", "Three or more points short"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outAutomate}</CodeOutput>

        <p>
          Set on the harness, the threshold is a gap of 0.831. There it files 84.5% of new threads at 95.0%.
          On the later posts it files 83.6% and gets 93.89% of them right, with an interval from 92.83% to 94.89%.
          The whole interval sits below the promise. In hindsight, the later posts needed a threshold of 1.218,
          which would have filed 76.8%.
        </p>

        <Settled id="H6">
          Set on folds grouped by sender, the threshold comes out at 0.788, a little below the harness&rsquo;s
          0.831, and the later posts get 93.88% of what it files right, from 92.84% to 94.88%. The whole interval
          sits below 95%, so H6 is wrong. Its explanation fails too: at the harness&rsquo;s threshold, senders the
          router has met and new senders fall short alike (94.09% and 93.76%), and the harness reweighted to next
          month&rsquo;s mix of senders still delivers only 94.18%.
        </Settled>

        <p>
          Folds grouped by sender did not change the threshold because they trade one flattering effect for another.
          The posts of senders the harness had met drop from 0.943 to 0.903 when the router has never met them. The
          other posts rise from 0.851 to 0.879, most likely through the leak{" "}
          <Link href={`${R}/the-split`} style={link}>page 11</Link> found: with senders kept apart, the replies to a
          thread can sit in the training folds. The two moves
          nearly cancel. Folds that keep out both the sender and the conversation would settle it, but they cannot be
          built here: senders and threads chain 7,888 of the 11,314 earlier posts, 69.7%, into a single block.
        </p>
        <p>
          Nor is it the refit. The later model is fitted on every earlier post, so its gaps could run larger than the
          fold models&rsquo; gaps the threshold was set on. But each of the five harness fold models, scoring the later
          posts at the harness&rsquo;s threshold, also falls short: 93.52% to 94.12%. Whoever writes and whichever model
          runs, the posts after the cut-off are less often right at the same gap. What is left is the month.
        </p>

        <h2>What the latest posts already knew</h2>
        <p>
          If the month is the cause, the earlier posts that sit nearest to it should show some of it.{" "}
          <Link href={`${R}/the-split`} style={link}>Page 11</Link> built time holdouts: fit on each forum&rsquo;s
          earlier posts, test on its latest 20%, 25% or 33% by article number, the order the collecting server
          received them. They were too rough to estimate accuracy. A threshold asks them something narrower: at a
          given gap, how often is the router right on the newest posts?
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>At the harness&rsquo;s threshold, how often is the router right on each forum&rsquo;s latest posts?</>}
          options={["Still about 95%", "Below 95%, like the later posts", "Above 95%"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outLatest}</CodeOutput>

        <p>
          At the harness&rsquo;s threshold, all three time holdouts come out below 95%: 94.13%, 94.62% and 93.75%.
          They are the only test on the earlier posts that points the way the later posts went. Each holdout is one
          split of a few hundred posts, so none of them settles the shortfall on its own, but the three agree: set on
          the latest posts, the threshold lands between 1.036 and 1.069, and on the later posts it delivers 94.39% to
          94.47%. That is still half a point short, but now the interval reaches past 95% (93.34% to 95.41% for the
          latest quarter) instead of stopping short of it.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Click &ldquo;set on the harness&rdquo; and follow the dashed line across the left panel: three curves cross 95% near the threshold, and one, the later posts, does not. Then click &ldquo;set on the latest quarter&rdquo; and watch what it costs in the right panel and the tiles.</>}
          insight={<>
            Every curve built from the earlier posts says the router is surer than the later posts bear out, and
            around the thresholds the ones that mix old and new posts say it most. Moving the threshold up buys back accuracy one handed-off
            post at a time: the latest quarter&rsquo;s threshold files about 100 fewer posts than the harness&rsquo;s
            and misfiles 16 fewer.
          </>}
        >
          <AutomationDialLab />
        </LabFrame>

        <p>
          The cost lands on the moderator. At the latest quarter&rsquo;s threshold the router files 2,013 of the
          2,527 later new threads by itself and hands 514 to a person, 99 more than the harness&rsquo;s threshold would.
          For 92.6% of those, the right forum is among the three the router suggests. It misfiles 113 threads instead
          of 129. The replies that follow the misfiled threads into the wrong forum, the cost{" "}
          <Link href={`${R}/the-job`} style={link}>page 2</Link> measured, come to 114 either way, to the nearest reply:
          the 16 extra mistakes at the harness&rsquo;s threshold are threads that drew almost no answers.
        </p>
        <p>
          Even the latest quarter&rsquo;s threshold is half a point short of 95% next month, so a threshold set once
          cannot be the whole answer. Someone has to check what the router files. A random sample of filed posts read
          by a person each month measures the share right: three hundred posts pin it to within 2.5 points, a
          thousand to within 1.4. That will not catch a half-point slip. It will catch a large one.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>Set on the harness or on folds grouped by sender, the threshold files 84% of new threads and delivers 93.9% next month, the whole interval below 95%. Set on each forum&rsquo;s latest quarter, it files 80% and delivers 94.4%, with an interval that reaches 95%. How does the router set its threshold?</>}
          options={[
            {
              label: "On the harness, where every other choice was made",
              verdict: "miss",
              response: <>The harness can choose between two models because both face the same month. A threshold is
                a promise about that month itself, and the harness&rsquo;s misses it by a settled margin: 93.9%, the
                whole interval below 95%.</>,
            },
            {
              label: "On folds grouped by sender, as H6 proposed",
              verdict: "miss",
              response: <>It sets almost the same threshold and delivers the same 93.9%. Grouping by sender takes away
                the senders the router has met and lets the replies to a thread back in, and the slip was never about
                senders: met and new senders fall short alike.</>,
            },
            {
              label: "Keep the harness, but aim for 97% to leave a margin",
              verdict: "close",
              response: <>A margin is the right instinct, but its size would be a guess made on the same posts that
                missed the slip. The latest posts measure the margin instead of guessing it: they are the one test on
                the earlier posts that saw the month coming.</>,
            },
            {
              label: "Set it on each forum's latest quarter, and check what it files every month",
              verdict: "best",
              response: <>The threshold is 1.036. Next month it files 80% of new threads at 94.4%, with an interval
                reaching past 95%, and hands 514 to a moderator, 92.6% of them with the right forum among the
                router&rsquo;s three. Because even this falls half a point short, a person reads a random sample of
                what the router files each month, and the threshold is set again on the newest posts each time the
                router is refitted.</>,
            },
          ]}
        />

        <p>
          The router now has a model, a threshold and a hand-off. Two questions about the world it runs in remain
          for act 6: how many labelled posts a new forum needs before the router can file its threads, and what
          happens when a forum appears that it has never seen.
        </p>

        <Callout color={POST} title={<>Set the promise on the newest data you have</>}>
          A threshold is a promise about next month, and next month differs from the average of the past. Folds that
          mix old and new posts set it on a calm that will not last; the latest slice of your data is the only place
          the drift shows before it arrives. Set the threshold there, and keep reading a random sample of what it
          decides.
        </Callout>

        <Followup>
          Take a model whose confident predictions you act on without review. Set a threshold for your target on
          your usual cross-validation, and again on the most recent slice of your data, with the model fitted on
          everything before it. Apply both to a slice later still. If the recent slice set the stricter threshold,
          the difference is the drift your cross-validation hides. Then work out how many reviewed predictions a
          month you would need to see a slip of the size you just measured.
        </Followup>

        <SigRule n={21}>
          <strong>Set a promise on your newest data, then keep checking it.</strong> A threshold is a claim about next
          month. Folds that mix old and new data flatter it; the latest slice measures the drift, and a random check
          of what the threshold lets through tells you when it has moved.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/reading-the-errors`, label: <>← Reading the errors</> }}
          next={{ href: `${R}/the-label-budget`, label: <>Next up · The label budget →</> }}
        />
      </div>
    </article>
  );
}
