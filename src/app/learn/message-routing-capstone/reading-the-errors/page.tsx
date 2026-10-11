import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { Settled } from "@/components/capstone/PredictionRegister";
import MisrouteLab from "@/components/labs/MisrouteLab";

export const metadata = {
  title: "Reading the errors — Manifold",
  description:
    "The router misroutes one new thread in nine. About half of those land in the post's own family of forums, which the harness cannot call more than half; the right forum is in the router's top three for most of them; and forty read by hand show why: half could sit in either forum.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outMisroutes = `the router (complement naive Bayes reading all four, the sender's history and bge-large): each harness
fold with the picks page 19 made, and fitted on all 11314 earlier posts for the later new threads.
families: comp (5 forums), rec (4), sci (4), talk.politics (3), and religion (3: alt.atheism,
soc.religion.christian, talk.religion.misc). misc.forsale belongs to none.

                             harness                later new threads (report only)
  new threads                3966                   2527
  routed right               0.8893                 0.8809
  misrouted                  439                    301
  in their own family        0.519 (0.474-0.567)    0.591 (0.533-0.646)
  if they fell at random     0.159                  0.153
  in the right family        0.947                  0.951
H5, more than half of the misroutes in their own family: harness 0.519, interval 0.474-0.567: not settled

the harness's misroutes by the family they were posted in:
                 new threads   right  misrouted  in family  at random
  comp                  1508   0.853        221      0.742      0.211
  rec                    641   0.936         41      0.390      0.158
  sci                    717   0.908         66      0.076      0.158
  talk.politics          324   0.944         18      0.556      0.105
  religion               268   0.843         42      0.786      0.105
  misc.forsale           508   0.900         51      0.000      0.000
the 211 misroutes that leave their family, by the family they land in:
  comp 73, misc.forsale 62, sci 37, rec 21, talk.politics 16, religion 2
misroutes with misc.forsale on either side: 113 of 439 (posted there 51, routed there 62); the other 326
stay in their family 0.699 of the time

the most common misroutes, posted -> routed (harness, then later):
  harness  24  comp.os.ms-windows.misc  -> comp.sys.ibm.pc.hardware  same family
  harness  20  comp.graphics            -> comp.windows.x            same family
  harness  18  misc.forsale             -> comp.sys.ibm.pc.hardware  another family
  harness  18  sci.electronics          -> comp.sys.ibm.pc.hardware  another family
  harness  17  comp.sys.ibm.pc.hardware -> misc.forsale              another family
  harness  16  comp.sys.ibm.pc.hardware -> comp.os.ms-windows.misc   same family
  harness  14  talk.religion.misc       -> soc.religion.christian    same family
  harness  14  comp.windows.x           -> comp.graphics             same family
  harness  12  comp.graphics            -> comp.os.ms-windows.misc   same family
  harness  12  comp.sys.mac.hardware    -> comp.sys.ibm.pc.hardware  same family
  later    19  comp.os.ms-windows.misc  -> comp.sys.ibm.pc.hardware  same family
  later    14  talk.politics.misc       -> talk.politics.guns        same family
  later    14  comp.sys.ibm.pc.hardware -> comp.os.ms-windows.misc   same family
  later    14  misc.forsale             -> comp.sys.ibm.pc.hardware  another family
  later    13  comp.sys.mac.hardware    -> comp.sys.ibm.pc.hardware  same family
of the 14 later talk.politics.misc -> talk.politics.guns, 14 name Waco, Koresh, the Davidians or the BATF`;

const outNearMisses = `how near: where the router ranked the right forum, on its misroutes (harness / later)
  second             0.661 / 0.674
  in its top three   0.836 / 0.837
  in its top five    0.941 / 0.937
  on every new thread, the right forum in the router's top three: 0.982 / 0.981
  misroutes in their family with the right forum second 0.689, the others 0.630 (harness)

the gap between the router's top two scores (harness), and how well it sorts posts routed right from
each kind of misroute (the chance a right post has the larger gap):
  routed right                   median gap 3.27
  misrouted, in its family       median gap 0.58   0.869
  misrouted, out of its family   median gap 0.62   0.858
  in family against out of family: +0.011 (-0.025, +0.046)

by sender (harness): misroutes from new senders 334 (0.154 of theirs), from senders met 105 (0.058)
  to a forum they never had: 56 misroutes of 177 posts, 41 of them to the sender's usual forum`;

const outReadErrors = `40 of the harness's 439 misroutes drawn at random (seed 21), each read in the router's view (the subject
and the body as it saw them) and labelled by hand before counting:
  fits both forums                                  21   (10 sale or wanted ads)
  belongs where it was posted: the router missed     9   (1 sale or wanted ad)
  fits the router's forum better                     2   (1 sale or wanted ad)
  too little to tell, or no forum of the twenty      7
  the cleaning cut the words that tell               1
sale or wanted ads among the forty: 12; misc.forsale on one side of 12
in their own family by the register's families: 19 of 40
the 9 the router missed: right forum second on 7, median gap 0.45 (all misroutes 0.60); 3 from a sender
posting to a forum they never had, routed to that sender's usual forum`;

export default function ReadingTheErrorsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 6 · Build the system around the model", color: "var(--c-metrics)" }]}
        time="about 13 minutes"
        title={<>Reading the errors: where the router&rsquo;s mistakes land</>}
        intro={<>
          The router misroutes about one new thread in nine. Before act 6 decides which posts it may file on its own,
          this page looks at the ones it gets wrong: where they go, how close the right forum came, and what they say
          when you read them.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={6} article={21} total={27}>
          When the router is wrong, where does the post go?
        </ArticleOpener>

        <h2>Where the mistakes land</h2>
        <p>
          The router act 5 ended with, complement naive Bayes reading all four with the sender&rsquo;s history and
          bge-large beside it, misroutes 439 of the harness&rsquo;s 3,966 new threads and 301 of the 2,527 later ones.
          Back on <Link href={`${R}/research-questions`} style={link}>page 5</Link>, before any model existed, H5 bet
          that most of those would be near misses: that more than half would land in a forum of the post&rsquo;s own
          family. The twenty forums fall into five families: the five comp forums, the four rec, the four sci, the
          three talk.politics and the three about religion. misc.forsale belongs to none. If the misroutes fell at
          random over the other nineteen forums, about 16% would stay in the family.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Of the router&rsquo;s 439 misroutes on the harness, what share land in the post&rsquo;s own family?</>}
          options={["Under a third", "About half", "Two thirds or more"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outMisroutes}</CodeOutput>

        <p>
          About half, almost exactly: 51.9%, with an interval from 47.4% to 56.7%. That is more than three times what
          chance would leave in the family, so the mistakes are far from random. Whether more than half stay at home,
          the harness cannot say.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start on every forum by family and find the two largest cells off the diagonal. Then pick sci.electronics from the list, and after it misc.forsale. Switch to the later new threads and look at talk.politics.misc.</>}
          insight={<>
            The router&rsquo;s mistakes have a neighbourhood, but it is not the one the forum names draw. Hardware runs
            across three families: the PC and Mac forums, sci.electronics, and misc.forsale, where the same video card
            turns up as a question in one forum and as an ad in another.
          </>}
        >
          <MisrouteLab only="land" />
        </LabFrame>

        <p>
          For most forums the families by name hold. comp keeps 74.2% of its misroutes inside the family and the
          religion forums keep 78.6%, though talk.religion.misc still loses 14 threads to soc.religion.christian, as it
          has since <Link href={`${R}/naive-bayes`} style={link}>page 14</Link>. Two places break the pattern. The sci
          forums misroute 66 of their 717 new threads and keep only 7.6% of those in sci: 18 go from sci.electronics to
          comp.sys.ibm.pc.hardware alone. And misc.forsale is a forum about an act, selling, not about a topic. Every ad
          in it has a second home, the forum about what is being sold, and it trades posts with the PC hardware forum
          both ways: 18 of its new threads go there and 17 come back. A misroute with misc.forsale on either side can
          never count as a near miss, and 113 of the 439 have it. Of the other 326, 69.9% stay in their family.
        </p>
        <p>
          The later posts keep more of their misroutes in the family: 59.1%, from 53.3% to 64.6%, above half. Part of
          that is one story. Fourteen later talk.politics.misc threads go to talk.politics.guns, and every one of them
          names Waco, Koresh, the Davidians or the BATF. The siege ended in fire on 19 April 1993, at the cut-off,
          and <Link href={`${R}/the-metric`} style={link}>page 12</Link> watched the topic change forums after it. Those
          fourteen are near misses by the families&rsquo; definition, but what moved them was the world, and page 24
          takes them up.
        </p>

        <Settled id="H5">
          On the harness, 51.9% of the router&rsquo;s 439 misroutes land in their own family, with an interval from
          47.4% to 56.7%. It straddles half, so H5 is not settled. The later posts come out at 59.1% (53.3% to 64.6%),
          above half, but fourteen of their in-family misroutes are the Waco threads that moved forums after the
          cut-off. Either way, far more misroutes stay in the family than the 16% chance would leave there.
        </Settled>

        <h2>How near they come</h2>
        <p>
          A family is one way to say near. For a person handed the post, a more useful one is where the router put the
          right forum in its order, and how sure it was. If the right forum is usually its second choice, a short list
          fixes most mistakes. And if the near misses are also the unsure ones, the threshold act 6 sets next would
          catch them more readily than the rest.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Are the router&rsquo;s misroutes inside the family less sure than the ones that leave it, with a smaller gap between its top two scores?</>}
          options={["Yes, clearly less sure", "About as sure", "More sure"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outNearMisses}</CodeOutput>

        <p>
          The right forum was the router&rsquo;s second choice for 66.1% of its misroutes and in its top three for
          83.6%. Over every new thread, the top three hold the right forum 98.2% of the time on the harness and 98.1%
          on the later posts. A person shown three forums instead of twenty would find the right one almost always.
        </p>
        <p>
          The family, though, says nothing about the router&rsquo;s doubt. Misroutes inside and outside it have about
          the same median gap, 0.58 and 0.62, against 3.27 for posts routed right, and the gap sorts right posts from
          either kind as well (0.869 and 0.858; the difference, +0.011, runs from &minus;0.025 to +0.046). A near miss by
          family is no smaller a surprise to the router than any other mistake, so whatever the threshold catches, it
          catches both kinds alike.
        </p>
        <p>
          One group stands out by sender. Of the 177 harness posts from senders writing to a forum they had never
          used, 56 are misrouted, and 41 of those went to the sender&rsquo;s usual forum. That is the history pulling a
          post home, the cost <Link href={`${R}/better-features`} style={link}>page 18</Link> found and put under watch.
        </p>

        <h2>Forty, read by hand</h2>
        <p>
          Counting shows where the mistakes go. It cannot show why. For that there is no shortcut: draw some at random
          and read them. Forty of the harness&rsquo;s 439 misroutes were drawn, each read as the router saw it, subject
          and body, and given one of five labels before anything was counted:
        </p>
        <ul>
          <li><strong>fits both forums</strong>: someone who knows the twenty could file it in either. A sale or wanted ad fits misc.forsale and also the forum about what is sold.</li>
          <li><strong>the router missed</strong>: it belongs where it was posted, and a person would not pick the router&rsquo;s forum.</li>
          <li><strong>fits the router&rsquo;s forum better</strong> than the one it was posted in.</li>
          <li><strong>too little to tell, or no forum fits</strong>: none of the twenty is about what it asks.</li>
          <li><strong>the cleaning cut the words that tell</strong>.</li>
        </ul>

        <PredictPrompt
          accent={POST}
          prompt={<>Of the forty, how many does the router plainly get wrong: the post belongs where it was posted, and nobody would file it where the router did?</>}
          options={["Most of them", "About half", "About a quarter"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outReadErrors}</CodeOutput>

        <LabFrame
          accent={POST}
          tryThis={<>Step through the router missed, then fits both forums. In the first group, look at where the router ranked the right forum. In the second, decide where you would have filed each post before you look at the two forums.</>}
          insight={<>
            Few of the mistakes are the router misreading a clear post. Half of these forty could sit in either forum
            and a sixth belong in none of the twenty. The plain misses are mostly close calls, and three of the nine
            are the sender&rsquo;s history pulling a post home.
          </>}
        >
          <MisrouteLab only="read" />
        </LabFrame>

        <p>
          Half the forty, 21, fit both forums. Ten are ads: a BMW motorcycle for sale, posted in rec.motorcycles and
          routed to misc.forsale; a Camry posted in misc.forsale and routed to rec.autos. The others are questions that
          sit across two forums by nature: Photoshop for Windows, posted in comp.graphics and routed to
          comp.os.ms-windows.misc; a program to show DXF drawings under X, posted in comp.windows.x and routed to
          comp.graphics. Seven belong in none of the twenty or give too little to tell: a recipe for gyro sauce in
          sci.med, the shortest solution to Rubik&rsquo;s Cube in sci.crypt, a subject line of &ldquo;(none)&rdquo;
          over a question about scheduling classrooms. Two fit the router&rsquo;s choice better than the
          sender&rsquo;s: someone looking to buy a Super 8 projector asked in comp.graphics, and the router sent it to
          misc.forsale.
        </p>
        <p>
          Nine are plain misses, and most of them are close. The right forum was second for seven, and their median
          gap, 0.45, is below even the 0.60 of all misroutes. A question about driving a monitor from a Mac video card
          went to the PC hardware forum by a gap of 0.04. Three of the nine are the history&rsquo;s pull: a post that
          opens by addressing the readers of sci.electronics by name went to comp.sys.mac.hardware, the forum its sender
          usually wrote in.
        </p>
        <p>
          And one was the cleaning&rsquo;s doing. <Link href={`${R}/anatomy-of-a-post`} style={link}>Page 4</Link> found
          that most signatures have no &ldquo;-- &rdquo; line above them, and{" "}
          <Link href={`${R}/closing-the-channels`} style={link}>page 10</Link> cut that last block from the
          router&rsquo;s view because it mostly says who wrote the post, not what it asks. In one of the forty, the block
          was the whole question, a request for code to show an image in a window. The router saw the subject and
          &ldquo;Hi,&rdquo;.
        </p>

        <h2>What a near miss changes</h2>
        <p>
          H5 was there to decide whether a near miss earns its own place in the metric and in the hand-off to a person.
          The answer comes in three parts. Near misses by family are about half the mistakes, and the harness cannot
          say they are more. The families by name miss where the router actually goes wrong: hardware runs across comp,
          sci and misc.forsale, and an ad always has two homes. And what does mark a near miss, the right forum second
          or third in the router&rsquo;s order, is true of most mistakes whatever their family.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>About half the misroutes stay in their family, and the harness cannot say it is more. The right forum is in the router&rsquo;s top three for 84% of its misroutes, and half of a random forty fit both forums. What changes?</>}
          options={[
            {
              label: "Count a misroute inside its family as half right",
              verdict: "miss",
              response: <>That rewards the forums&rsquo; names, not closeness. A car ad routed from misc.forsale to
                rec.autos would still count as a full miss, while a Windows question routed to the X forum would count
                as half right. And either way the post lands in front of people who were not looking for it.</>,
            },
            {
              label: "Score the router against the forums a reader would accept",
              verdict: "close",
              response: <>Half the forty did fit both forums, so the strict count understates how often the router is
                reasonable. But those labels are one reader&rsquo;s judgement on forty posts. A metric built on them
                could not be repeated on the next thousand, and every unclear call would lean the router&rsquo;s way.
                The reading stays beside the number, not inside it.</>,
            },
            {
              label: "Keep the metric strict, and give the hand-off the router's top three forums",
              verdict: "best",
              response: <>The metric still counts a post as right only in the forum its sender chose. When the router
                hands a post to a person, it shows its three best forums in order: the right one is among them for 98%
                of new threads and 84% of the router&rsquo;s mistakes, so the person picks from three instead of
                searching twenty.</>,
            },
            {
              label: "Merge the forums the router confuses most",
              verdict: "miss",
              response: <>The forums are the job. People chose comp.os.ms-windows.misc over comp.sys.ibm.pc.hardware
                because they wanted different readers. A router that files into a merged forum has stopped doing what it
                was built for.</>,
            },
          ]}
        />

        <p>
          That leaves the next page a router that is wrong about one time in nine and a hand-off that shows three
          choices. The question there is which posts to hand off at all: where to set the threshold so that the posts
          the router files alone come out right 95% of the time next month. That is H6.
        </p>

        <Callout color={POST} title={<>Count the errors, then read some</>}>
          A confusion matrix shows where the mistakes go, and a grouping fixed in advance shows whether they follow it.
          Neither shows why. Draw a few dozen at random, label each before you count, and keep one label for your own
          pipeline. Here half of a random forty could sit in either forum, a sixth fit none, and one was the
          cleaning&rsquo;s fault.
        </Callout>

        <Followup>
          Draw forty of your model&rsquo;s errors at random, not the most confident ones or the strangest. Write your
          labels down before you read: fits both classes, the model missed, the label looks wrong, nothing fits, the
          pipeline lost it. Read each in the form the model saw, then count. Then check how often the right answer is
          second or third in the model&rsquo;s order, and whether the errors your grouping calls near are any less sure
          than the rest.
        </Followup>

        <SigRule n={20}>
          <strong>Read a random sample of the errors before you change anything.</strong> Counts show where the mistakes
          go; only reading shows why. Label a random forty before you count them, and keep one label for your own
          pipeline.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/choosing-the-model`, label: <>← Choosing the model</> }}
          next={{ href: `${R}/automate-or-hand-off`, label: <>Automate or hand off →</> }}
        />
      </div>
    </article>
  );
}
