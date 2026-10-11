import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { Settled } from "@/components/capstone/PredictionRegister";
import LeftOutLab from "@/components/labs/LeftOutLab";

export const metadata = {
  title: "When the world changes — Manifold",
  description:
    "A forum the router has never seen: 37% of its threads are filed without a person, most of them in a neighbouring forum, because the router's confidence only compares the forums it knows. Holding the neighbours for a person catches three in four. And a subject that spreads into a second forum keeps its old route, refit or not.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outLeftOut = `each forum in turn is left out of the training entirely; the router, refitted on the other nineteen,
scores the 2527 later new threads, and each is read off the run that left its own forum out. A thread is
filed without a person when its gap reaches the router's threshold (1.036, page 22).
  the left-out forum's threads filed without a person: 0.3696 (0.3518-0.3870)
H7, fewer than one in ten of them are filed on their own: wrong
  of those filed, into a forum of its own family: 0.754
  the other forums' threads in the same runs: filed 0.805, right among filed 0.9460
  median gap: the left-out forum's threads 0.699, the other forums' 2.823

  left out                  threads   filed   where most of the filed ones went
  alt.atheism                    29   0.552   soc.religion.christian (11)
  comp.graphics                 212   0.307   comp.windows.x (42)
  comp.os.ms-windows.misc       170   0.412   comp.sys.ibm.pc.hardware (45)
  comp.sys.ibm.pc.hardware      203   0.256   comp.sys.mac.hardware (20)
  comp.sys.mac.hardware         184   0.413   comp.sys.ibm.pc.hardware (56)
  comp.windows.x                235   0.328   comp.graphics (45)
  misc.forsale                  353   0.354   comp.sys.ibm.pc.hardware (47)
  rec.autos                     103   0.466   rec.motorcycles (36)
  rec.motorcycles                46   0.652   rec.autos (27)
  rec.sport.baseball             93   0.753   rec.sport.hockey (67)
  rec.sport.hockey              130   0.946   rec.sport.baseball (123)
  sci.crypt                      69   0.159   sci.electronics (4)
  sci.electronics               114   0.149   comp.sys.ibm.pc.hardware (6)
  sci.med                       137   0.095   talk.politics.misc (4)
  sci.space                      99   0.162   comp.graphics (5)
  soc.religion.christian        115   0.357   talk.religion.misc (36)
  talk.politics.guns             59   0.186   talk.politics.misc (5)
  talk.politics.mideast          87   0.230   talk.politics.guns (7)
  talk.politics.misc             51   0.471   talk.politics.guns (15)
  talk.religion.misc             38   0.763   soc.religion.christian (21)

telling the left-out forum's threads from the others (AUROC, the mean of the 20 runs; 0.5 is chance):
  the gap 0.781, the nearest earlier post (bge-large) 0.711, the embedding's top probability 0.757
a threshold that files only 10% of them: 2.801, which files 0.503 of the other forums' threads
(at the router's threshold, 1.036, it files 0.805 of them)
holding the new forum's family for a person (every thread the router would file into that family goes
to a person instead; misc.forsale has no family): catches 0.754 of the left-out forum's filed threads, and
hands a person 0.157 of the other forums' filed threads in the nineteen runs with a family
with the hold, the left-out forum's threads filed without a person: 0.0910 (0.0799-0.1025)`;

const outDrift = `posts that name Waco, Koresh, the Davidians or the BATF, by forum (the later posts split at each
forum's median article number):
                             posts    guns  politics.misc
  earlier posts                251     141              6
  later posts, first half      152      79             45
  later posts, second half     167      77             57

the router on the 2527 later new threads, at its threshold (1.036):
                                     threads   right   filed  filed in a wrong forum
  politics.misc, naming Waco              23   0.348   0.739  11
  politics.misc, the rest                 28   0.821   0.857  3
  guns, naming Waco                       27   1.000   0.852  0
  guns, the rest                          32   0.906   0.875  1
  politics.misc threads naming Waco routed to guns: 14, 10 of them filed (gaps up to 6.35)
  talk.politics.misc routed right: the harness 0.836, the later new threads 0.608

refitted with the later posts' first half (3770 posts, each with its forum) and scored on the second
half's 1261 new threads. 'slide' keeps the size: it drops as many of each forum's oldest earlier posts
as the first half adds
             right (vs as fitted)             politics.misc  its Waco threads to guns
  as fitted  0.8842                           0.636 (33)     10 of 18
  grow       0.8866 (+0.24, -0.63 to +1.11)   0.636 (33)     10 of 18
  slide      0.8826 (-0.16, -1.27 to +0.87)   0.606 (33)     10 of 18`;

export default function WhenTheWorldChangesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 6 · Build the system around the model", color: "var(--c-metrics)" }]}
        time="about 14 minutes"
        title={<>When the world changes: a forum it has never seen, a subject that moves</>}
        intro={<>
          The router learned twenty forums from one stretch of 1993. This page changes both: a forum opens that the
          router has never seen, and a subject spreads into a forum it never lived in. Neither shows up in how sure
          the router is.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={6} article={24} total={27}>
          What does the router do when the forums change under it?
        </ArticleOpener>

        <h2>A forum it has never seen</h2>
        <p>
          <Link href={`${R}/the-label-budget`} style={link}>The last page</Link> measured how many posts a new forum
          needs before the router can file its threads, and left out one case: the forum with none. That is every new
          forum on its first day. The router does not know it exists, so each of its threads is routed to one of the
          twenty forums the router does know.
        </p>
        <p>
          H7 bet that the threshold would catch them. A thread that fits no forum should leave the router with two best
          scores close together, and a small gap is exactly what the threshold hands to a person. To test it, each forum
          in turn is left out of the training entirely and the router is refitted on the other nineteen. Each of the
          2,527 later new threads is read off the run that left its own forum out, so every thread plays the stranger
          once.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>With its forum left out of the training, what share of a forum&rsquo;s later new threads does the router file without a person?</>}
          options={["Under one in ten, as H7 bet", "About one in five", "More than one in three"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outLeftOut}</CodeOutput>

        <Settled id="H7">
          The router files 36.96% of a left-out forum&rsquo;s threads without a person, from 35.18% to 38.70%. The whole
          interval sits far above one in ten, so H7 is wrong. Its reasoning failed at the first step: the gap compares
          the forums the router knows. A hockey thread with no hockey forum to go to still looks much more like baseball
          than like anything else, so its gap is wide. 94.6% of hockey&rsquo;s threads are filed, 123 of them in
          rec.sport.baseball.
        </Settled>

        <p>
          Three in four of the filed threads (75.4%) land in a forum of the left-out forum&rsquo;s own family. The
          forums with a twin lose the most: hockey 94.6%, talk.religion.misc 76.3%, baseball 75.3%. The sci forums lose
          the fewest: 9.5% of sci.med&rsquo;s threads are filed, 14.9% of sci.electronics&rsquo;, 15.9% of
          sci.crypt&rsquo;s. The gap does run lower on a stranger&rsquo;s
          threads, a median of 0.699 against 2.823 for everyone else&rsquo;s, but the two overlap too much for the
          threshold to separate them.
        </p>
        <p>
          Could something else tell a stranger&rsquo;s threads apart? The output tries three signals and scores each by
          how well it separates the left-out forum&rsquo;s threads from the rest (AUROC: 0.5 is a coin toss, 1 is
          perfect). The gap itself does best at 0.781. The embedding model&rsquo;s top probability gets 0.757, and how
          close the nearest earlier post sits in the embedding 0.711. None is sharp enough to act on. Raising the
          threshold until only one in ten of the strangers gets through takes a gap of 2.801, and at that gap the router
          files 50.3% of everyone else&rsquo;s threads instead of 80.5%. Catching one forum would cost half the
          router&rsquo;s work.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start on rec.sport.hockey: see where its gap sits against the dashed threshold, and where its threads went. Switch to sci.med, which has no close neighbour. Then go back to hockey and hold its family for a person.</>}
          insight={<>
            A stranger&rsquo;s threads get filed when one known forum is clearly closer than the rest, and a close
            neighbour makes that likely. The forums with a neighbour lose the most threads, and holding the family
            catches most of what they lose. sci.med, with nobody close, reaches a person nine times in ten on its own.
          </>}
        >
          <LeftOutLab />
        </LabFrame>

        <h2>Hold the neighbours, collect the labels</h2>
        <p>
          A forum never appears out of nowhere. Someone opens it, and knows what it is for, so the system knows two
          things the router does not: that the forum exists, and which family it belongs to. That is enough for a
          simple rule. Until the router has learned the new forum, every thread it would file into that family goes to
          a person instead.
        </p>
        <p>
          In the runs above, the hold catches 75.4% of the left-out forum&rsquo;s filed threads and hands a person 15.7%
          of the other forums&rsquo; filed threads. With it, 9.1% of a stranger&rsquo;s threads are still filed without a
          person (8.0% to 10.3%): about the one in ten H7 expected of the threshold alone. More than half of what gets
          through, 125 of 230 threads, is misc.forsale, which belongs to no family, so the rule cannot cover it. The
          hold also produces what the last page needed: the person reading the neighbours&rsquo; threads is the one who
          files the new forum&rsquo;s first threads by hand. Once it has about 80 posts, the router is refitted with
          them weighted, and the hold comes off.
        </p>

        <h2>A subject that moves</h2>
        <p>
          Forums are not the only thing that changes. On{" "}
          <Link href={`${R}/the-metric`} style={link}>page 12</Link> talk.politics.misc was routed right far less often
          next month than on the harness, and <Link href={`${R}/reading-the-errors`} style={link}>page 21</Link> traced
          the misroutes to Waco. The siege of the Branch Davidians ended in fire on 19 April 1993, at the cut-off.
          Before it, the posts that named it sat mostly in talk.politics.guns, 141 of them against 6 in
          talk.politics.misc; after it, the subject spread into talk.politics.misc too.
        </p>
        <p>
          The usual answer to drift is to refit on the newest data. The later posts arrive in an order the server
          recorded, so they can be split at each forum&rsquo;s median article number. The router is refitted with the
          first half, every post with its forum, and scored on the second half&rsquo;s new threads. Two versions: one
          simply adds the new posts, the other drops as many of each forum&rsquo;s oldest posts as it adds, so only the
          dates change, not the amount.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>The refit learns from the first half of next month, including 45 talk.politics.misc posts about Waco. Of the second half&rsquo;s 18 talk.politics.misc threads about Waco, the router had sent 10 to guns. How many does it send there now?</>}
          options={["Two or three", "About half as many", "Still about ten"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outDrift}</CodeOutput>

        <p>
          Still ten, whichever way the router is refitted. Adding the newest posts gains 0.24 points overall and sliding
          the window loses 0.16; neither is settled. The table at the top says why. Even after the fire, guns held most
          of the talk about Waco: 79 posts to politics.misc&rsquo;s 45 in the first half of the month, 77 to 57 in the
          second. The newest labels teach the router what the old ones did, a little less firmly: Waco is mostly a guns
          subject. What changed is that it became a subject of two forums, and the text of a post does not say which
          one its sender chose.
        </p>
        <p>
          The router is not unsure about these threads. It files 10 of the 14 politics.misc Waco threads it sends to
          guns without a person, with gaps up to 6.35, while guns&rsquo; own Waco threads all go to guns. The threshold
          cannot see this, and a refit does not fix it. What saw it was the forum-by-forum view page 12 set up, where
          talk.politics.misc fell from 83.6% routed right on the harness to 60.8% next month, and the reading of the
          misroutes on page 21 that put a name to it. Whether those threads should go to a person while the story runs
          is a call for the operators, and the forum-by-forum view is the only place they will see the need for it.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>A forum for a new operating system opens next month. Until the router has learned it, what keeps its threads out of the wrong forums?</>}
          options={[
            {
              label: "The threshold: the router hands over the threads it is unsure of",
              verdict: "miss",
              response: <>That was H7, and it is wrong. The gap compares the forums the router knows, so a
                stranger&rsquo;s thread that resembles one neighbour is filed with confidence: 37% of a left-out
                forum&rsquo;s threads, and 94.6% of hockey&rsquo;s.</>,
            },
            {
              label: "Raise the threshold until the router has learned the new forum",
              verdict: "close",
              response: <>It works, at a price. To let only one in ten of the stranger&rsquo;s threads through, the gap
                must reach 2.801, and the router then files 50.3% of everyone else&rsquo;s threads instead of 80.5%. Half
                of its work goes to a person for one forum.</>,
            },
            {
              label: "Add a detector that flags threads unlike any forum",
              verdict: "miss",
              response: <>None of the signals is sharp enough. The best, at an AUROC of 0.781, is the gap the threshold
                already uses; the nearest earlier post in the embedding manages 0.711. The threads of a new forum are
                not unlike every forum, only unlike all but one.</>,
            },
            {
              label: "Hold the new forum's family for a person, collect its first posts there, and refit at about 80",
              verdict: "best",
              response: <>The people who open the forum know its family. Holding that family catches 75.4% of the
                stranger&rsquo;s filed threads for 15.7% of the neighbours&rsquo; filed threads, and the person reading
                them files the new forum&rsquo;s first posts. At about 80 posts, weighted, the router takes over and the
                hold comes off.</>,
            },
          ]}
        />

        <p>
          That closes act 6. The router now has a reading of its errors, a threshold set on its newest posts, a hand-off
          with three suggestions, a budget for new forums and a plan for when the forums change. Act 7 gathers the
          verdicts, the Playbook and the notebook, and then hands you two new datasets to try it on.
        </p>

        <Callout color={POST} title={<>Confidence only ranks the classes you have</>}>
          A classifier&rsquo;s confidence compares the classes it was trained on. A class it has never seen, or a
          subject that now belongs to two classes, gets the old answer, and gets it with full confidence. Plan for
          those changes outside the model: hold the neighbours when a class is added, and watch each class&rsquo;s
          accuracy on its own, because the average will not show the change.
        </Callout>

        <Followup>
          Take a classifier you run and leave one class out of its training. Score that class&rsquo;s later examples:
          what share clears your confidence threshold, and which class receives them? Then pick the class with the
          closest neighbour and work out what holding that neighbour for review would cost you each month.
        </Followup>

        <SigRule n={23}>
          <strong>Confidence only ranks the classes you have.</strong> A new class, or a subject that spreads into a
          second class, gets the old answer with full confidence. Catch it outside the model: hold the neighbours when
          a class opens, and watch every class on its own.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/the-label-budget`, label: <>← The label budget</> }}
          next={{ href: `${R}/takeaways`, label: <>Verdict, playbook &amp; notebook →</> }}
        />
      </div>
    </article>
  );
}
