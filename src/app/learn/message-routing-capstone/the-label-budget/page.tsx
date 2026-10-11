import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { Measured } from "@/components/capstone/PredictionRegister";
import LabelBudgetLab from "@/components/labs/LabelBudgetLab";

export const metadata = {
  title: "The label budget — Manifold",
  description:
    "A learning curve that cuts every forum at once says 20 labelled posts a forum route 75% of threads right. A new forum beside old ones gets 5% from 20 posts and 37% from 80: it is outvoted. Weighted to the pull of an average forum, 80 posts route 74%, and the router keeps its promise.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outBudget = `the router refitted at its one setting with fewer labelled posts, scored on the 2527 later new threads.
(the words are counted once for every post; each refit keeps the columns its own posts contain, as a
fit on those posts alone would, and on every earlier post it reproduces the router exactly)

the textbook learning curve: every forum cut to its latest n earlier posts
  posts a forum       5     10     20     40     80    160    320   all (566 on average)
  routed right    0.525  0.649  0.748  0.755  0.808  0.846  0.872   0.881

a new forum among old ones: each forum in turn keeps only its latest n earlier posts, every other forum
keeps all of its own; each later new thread is read off the run in which its own forum was the new one
  posts  of them, new threads   its threads routed right      its first n instead
      5  1.6                    0.0044 (0.0020-0.0071)        0.0055
     10  3.2                    0.0099 (0.0063-0.0139)        0.0226
     20  6.5                    0.0503 (0.0423-0.0586)        0.0736
     40  13.8                   0.1761 (0.1611-0.1915)        0.1975
     80  27.4                   0.3712 (0.3526-0.3902)        0.3558
    160  55.4                   0.5908 (0.5718-0.6098)        0.5544
    320  109.2                  0.7641 (0.7475-0.7804)        0.7752
    all  198.3                  0.8809 (0.8690-0.8932)
at 80 posts its misrouted threads go to a forum of its own family 0.636 of the time`;

const outWeighted = `each of the new forum's n posts counts (the other forums' posts / 19) / n times, in the naive Bayes counts
and in the embedding's logistic regression; every other post counts once
  posts  weight  its threads routed right      unweighted  the words alone: weighted, unweighted
      5   113.1  0.2624 (0.2450-0.2794)        0.0044      0.2556  0.0099
     10    56.6  0.3949 (0.3755-0.4139)        0.0099      0.3510  0.0142
     20    28.3  0.5576 (0.5378-0.5766)        0.0503      0.5069  0.0321
     40    14.1  0.6450 (0.6264-0.6632)        0.1761      0.5948  0.0922
     80     7.1  0.7372 (0.7206-0.7543)        0.3712      0.6981  0.2374
    160     3.5  0.8041 (0.7879-0.8196)        0.5908      0.7594  0.4480
    320     1.8  0.8516 (0.8378-0.8651)        0.7641      0.8093  0.6830
    all          0.8809

at the router's threshold (1.036, page 22), the new forum's own later new threads, and the router's
promise over all of them while that forum is new (the mean of the 20 runs; others = other forums' threads
filed into the new one, per forum):
         unweighted                             weighted
  posts  filed: right  wrong  others  promise   filed: right  wrong  others  promise
      5         0.002  0.362     0.0   0.9242          0.115  0.244     0.5   0.9316
     10         0.004  0.353     0.1   0.9245          0.196  0.196     0.3   0.9347
     20         0.010  0.317     0.1   0.9268          0.332  0.141     0.8   0.9386
     40         0.037  0.269     0.1   0.9299          0.459  0.118     1.8   0.9401
     80         0.143  0.211     0.1   0.9338          0.566  0.081     2.4   0.9425
    160         0.347  0.140     0.6   0.9388          0.642  0.062     3.3   0.9436
    320         0.579  0.074     2.0   0.9431          0.709  0.049     4.7   0.9440
    all         0.752  0.045     5.7   0.9439   (every forum with all its posts)
weighted at 80 posts, the new forum's own threads that are filed are right 0.875 of the time (with all its
posts 0.944); at 160 posts 0.912, at 320 posts 0.936
comp.os.ms-windows.misc, latest 20 posts: 0 carry encoded files (0 lines); weighted, routed right 0.447
comp.os.ms-windows.misc, latest 40 posts: 14 carry encoded files (12817 lines); weighted, routed right 0.076`;

export default function TheLabelBudgetPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 6 · Build the system around the model", color: "var(--c-metrics)" }]}
        time="about 13 minutes"
        title={<>The label budget: what a new forum needs before the router can file it</>}
        intro={<>
          Forums open. Until the router has learned a new one, a person files its threads by hand. This page measures
          how long that lasts, and finds that the usual way of measuring it answers a different question.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={6} article={23} total={27}>
          How many labelled posts does a new forum need before the router can file its threads?
        </ArticleOpener>

        <h2>The usual answer, and the question it answers</h2>
        <p>
          The <Link href={`${R}/research-questions`} style={link}>register</Link> left this one as an estimate:
          nothing in the posts we had read said what the number would be, so nobody bet on it. It still needs a
          number. The operators have to know how long a new forum will need a person filing its threads, and when
          the router can take over.
        </p>
        <p>
          The usual tool is a learning curve. Cut the training data down to a few posts per forum, refit, and watch
          the accuracy climb as the posts come back. The first table in the output does that with the router as act 5
          left it, cutting every forum to its latest 5, 10, 20 and up to 320 earlier posts. By 20 posts a forum it
          routes 74.8% of the later new threads right; with all of them, about 566 for an average forum, 88.1%.
        </p>
        <p>
          But that curve cuts every forum at once. A new forum does not start together with the others. It opens
          beside nineteen forums that already have hundreds of posts each. So the second table measures that case.
          Each forum in turn plays the new one: it keeps only its latest n earlier posts, the other nineteen keep all
          of theirs, and the router is refitted. Each of the 2,527 later new threads is scored by the run in which its
          own forum was the new one, so every thread counts once. The threshold stays where{" "}
          <Link href={`${R}/automate-or-hand-off`} style={link}>page 22</Link> set it.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>The new forum has 80 labelled posts and the other nineteen keep all of theirs. What share of its later new threads does the router route right?</>}
          options={["About 80%, as the learning curve says", "About half", "Fewer than two in five"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outBudget}</CodeOutput>

        <p>
          Fewer than two in five: with 80 posts the new forum gets 37.1% of its threads, where the learning curve, with
          every forum at 80, gets 80.8%. At 20 posts it gets 5.0% against the curve&rsquo;s 74.8%. At 320 it reaches
          76.4%, still short of what the learning curve gives every forum at 80. Whether the forum keeps its
          earliest posts or its latest
          changes little (35.6% against 37.1% at 80), so this is not about how fresh the posts are. It is about how
          many there are next to everyone else&rsquo;s.
        </p>
        <p>
          The threads the new forum loses go next door: 63.6% of its misrouted threads land in a forum of its own
          family, the established neighbours with hundreds of posts on the same subjects. Both models inside the
          router give a forum a say that grows with its posts. The embedding&rsquo;s logistic regression learns how common
          each forum is along with what it is about, so a forum with 80 posts starts far behind one with 566. Complement
          naive Bayes (<Link href={`${R}/naive-bayes`} style={link}>page 14</Link>) scores a forum by how rare a
          post&rsquo;s words are in every other forum&rsquo;s posts. A neighbour&rsquo;s 566 posts make the shared words
          common in the new forum&rsquo;s comparison pile; the new forum&rsquo;s 80 posts barely make them common in the
          neighbour&rsquo;s. In a learning curve every forum is small together, so none of them is outvoted.
        </p>

        <h2>Give the newcomer an average forum&rsquo;s pull</h2>
        <p>
          If the trouble is how much the new forum&rsquo;s posts weigh, weighing them differently should fix it. Count
          each of its posts as many times as it takes for the forum to pull like an average one: with 80 posts, each
          counts 7.1 times, so the 80 weigh as much as 566. Both parts of the router take the weights, the word counts
          and the logistic regression alike. Every other post counts once, and nothing else changes.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Each of the new forum&rsquo;s 80 posts now counts 7.1 times. What share of its threads does the router route right?</>}
          options={["Still under half", "About three in four", "As many as with all its posts"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outWeighted}</CodeOutput>

        <p>
          About three in four: 73.7% (72.1% to 75.4%) at 80 posts, against 37.1% unweighted. At 20 posts the weighted
          router gets 55.8% of the new forum&rsquo;s threads; at 320 it gets 85.2%, within three points of all its
          posts. Most of the gain is in the word counts, which alone go from 23.7% to 69.8% at 80 posts. The weighting
          does not make the new forum a magnet, either. At 80 posts, 2.4 of the other forums&rsquo; threads per run are
          filed into it, fewer than the 5.7 an established forum receives.
        </p>
        <p>
          The second table follows the threshold. Unweighted, with five posts, the router files 36.2% of the new
          forum&rsquo;s threads in a wrong forum without a person seeing them, sure they belong somewhere else, and its
          promise across all posts falls to 92.4%. Weighted, at 80 posts, it files 56.6% of the new forum&rsquo;s
          threads right and 8.1% wrong, and the promise across all posts is 94.25%, against 94.39% with every forum
          full. The new forum&rsquo;s own filed threads are still less reliable than an established forum&rsquo;s: right
          87.5% of the time at 80 posts, 91.2% at 160 and 93.6% at 320, against 94.4%. The promise holds overall
          because the new forum is one forum in twenty.
        </p>
        <p>
          Those 80 posts are also not 80 labels a person has to give. On average 27.4 of them are new threads,
          filed by hand; the rest are replies, which follow their thread into the forum on their own (
          <Link href={`${R}/the-job`} style={link}>page 2</Link>).
        </p>

        <Measured id="E1">
          About 80 labelled posts, if the router weights them to the pull of an average forum. At 80 it routes 73.7% of
          the new forum&rsquo;s threads right, files 56.6% of them in the right forum without a person, and keeps its
          promise across all posts at 94.25% (94.39% with every forum full). The 80 posts hold about 27 new threads a person filed by hand.
          Fitted as it is, the router routes 37.1% from the same 80 posts, and 76.4% from 320. For the same three in
          four, the learning curve, which cuts every forum at once, would have said 20.
        </Measured>

        <h2>A few posts, weighted many times</h2>
        <p>
          Weighting has a price. Each post now counts many times, so whatever is in those posts counts many times too.
          The latest 40 posts of comp.os.ms-windows.misc include 14 that carry encoded files, 12,817 lines of them, the
          debris <Link href={`${R}/first-look`} style={link}>page 6</Link> found and{" "}
          <Link href={`${R}/naive-bayes`} style={link}>page 14</Link> watched take over that forum&rsquo;s word counts.
          Weighted 14 times, they teach the router that the forum is about encoded files. At 40 posts the weighted
          router routes 7.6% of its threads right, against 44.7% at 20 posts, before those posts arrived. With a
          handful of labels, every one is worth a look before it is multiplied.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Stay on each forum in turn and click through the labelled posts, watching the gap between the dashed curve and the other two. Then pick sci.crypt, comp.os.ms-windows.misc between 20 and 40 posts, and talk.religion.misc.</>}
          insight={<>
            The learning curve flattens by 20 posts a forum; a lone new forum is still climbing at 320 unless its posts
            are weighted. Weighted, a forum whose words nobody else uses, such as sci.crypt or rec.sport.hockey, is
            routed right about nine times in ten from 20 posts. One that shares its words with a neighbour needs
            hundreds, and talk.religion.misc hovers around half of its threads even with all of its posts.
          </>}
        >
          <LabelBudgetLab />
        </LabFrame>

        <p>
          Refitting costs under a minute: turning the posts into numbers takes 45 seconds and complement naive Bayes
          then fits in 3.6 (<Link href={`${R}/choosing-the-model`} style={link}>page 20</Link>). So there is no need
          to pick a day to
          switch the router on for a new forum. Refit it each time a batch of the forum&rsquo;s posts has been read, and
          each batch moves it up the weighted curve.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>A forum for a new operating system opens next month. Its threads are filed by hand for now. How does the router take it on?</>}
          options={[
            {
              label: "Refit once it has 20 posts: the learning curve says that is enough for 75%",
              verdict: "miss",
              response: <>That curve cuts every forum at once. Alone beside forums of 566 posts, a forum with 20 gets
                5.0% of its threads routed right, and the router files 31.7% of them in a wrong forum without a
                person seeing them.</>,
            },
            {
              label: "Wait until it has as many posts as the others, then refit",
              verdict: "close",
              response: <>With a forum&rsquo;s full share of posts the router does get there, but a person files its
                threads by hand for months first. Weighting does the same work far sooner: weighted, 80 posts route
                73.7%; unweighted, even 320 route only 76.4%.</>,
            },
            {
              label: "Weight its posts to an average forum's pull, and refit after reading each batch",
              verdict: "best",
              response: <>At 20 posts the router routes 55.8% of the new forum&rsquo;s threads right, at 80 posts
                73.7%, and its promise across all posts is back to 94.25%. A person reads each batch before it goes in,
                because each post counts many times: 14 posts of encoded files took comp.os.ms-windows.misc from 44.7%
                to 7.6%.</>,
            },
          ]}
        />

        <p>
          One case is left out of every table here: a forum the router has no posts from at all. What it does with
          that forum&rsquo;s threads is the last question of act 6, along with a world whose subjects move under it.
        </p>

        <Callout color={POST} title={<>A new class is outvoted, not unlearnable</>}>
          A learning curve that cuts every class at once measures a world where all the classes start together. A new
          class starts alone, beside classes with many times its examples, and most models give each class a say that
          grows with its examples. Measure the new class on its own, give it the weight of an average class, and read
          the few examples you are about to multiply.
        </Callout>

        <Followup>
          Take a classifier you maintain and pick one class. Cut it to 10, 40 and 160 examples while every other class
          keeps all of its own, refit, and measure that class&rsquo;s recall on data later than the training set. Do it
          again with the class&rsquo;s examples weighted to the size of an average class, and once more with every
          class cut together. The gap between the first curve and the last is what a new class really costs you.
        </Followup>

        <SigRule n={22}>
          <strong>Measure a new class beside the old ones, and weight it.</strong> A learning curve that cuts every
          class at once hides what one small class costs among big ones. Cut only the new class, give it an average
          class&rsquo;s pull, and read the examples before you multiply them.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/automate-or-hand-off`, label: <>← Automate or hand off</> }}
          next={{ href: `${R}/when-the-world-changes`, label: <>Next up · When the world changes →</> }}
        />
      </div>
    </article>
  );
}
