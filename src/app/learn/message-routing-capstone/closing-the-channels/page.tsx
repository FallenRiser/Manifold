import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { Settled } from "@/components/capstone/PredictionRegister";
import ChannelsLab from "@/components/labs/ChannelsLab";

export const metadata = {
  title: "Closing the channels — Manifold",
  description:
    "Close the header lines, the quotes, the signature and the tail one at a time and all together. On a random split the quotes carry nearly the whole leak, as the thread's own text. On the job, whatever names the sender helps only the senders the router already knows.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const outChannels = `18846 posts, 5 random splits of 7532 test posts each, linear SVM (C=0.3); the moderator's notes
are out throughout (page 9)

closing                        accuracy    cost (points)   cost per split
  nothing (the whole post)     0.9247
  the header lines             0.9193       +0.55        +0.27 to +0.74
  the quotes                   0.8867       +3.80        +3.64 to +4.16
  the signature                0.9264       -0.17        -0.25 to -0.08
  all three                    0.8782       +4.65        +4.42 to +4.85
  all three and the tail       0.8744       +5.03        +4.86 to +5.48

the costliest on its own is the quotes: 82% of what closing all three costs (per split 76% to
94%). H3 needed every channel alone under a third of it
closing the quotes costs 5.24 points on the test replies and 1.05 on the test new threads;
83% of the test replies have a post of their own thread on the training side`;

const outChannelsJob = `the later new threads: 2527, from 923 senders the router has met and 1604 new ones
(linear SVM, C=0.3)

                                              all      known    new senders
  the router's view of acts 1-3             0.8235   0.8527   0.8067
    without the moderator's notes           0.8231   0.8516   0.8067
    and without the tail: the audited view  0.8168   0.8364   0.8055
  audited vs acts 1-3: -0.67 points (95%: -1.31 to -0.04); gap known - new 4.6 -> 3.1

the audited view plus one channel, change in points (95% interval)
                         all                   known                 new senders
  + the header lines     +0.75 (-0.28, +1.78)  +3.58 (+1.95, +5.20)  -0.87 (-2.18, +0.37)
  + the quotes           +0.91 (+0.16, +1.66)  +1.73 (+0.54, +3.03)  +0.44 (-0.44, +1.37)
  + the signature        -0.04 (-0.75, +0.67)  +0.76 (-0.43, +1.84)  -0.50 (-1.43, +0.50)
  + the tail             +0.63 (+0.00, +1.31)  +1.52 (+0.54, +2.60)  +0.12 (-0.69, +1.00)
  + all four at once     +0.63 (-0.51, +1.78)  +3.68 (+1.84, +5.53)  -1.12 (-2.56, +0.31)
  + quoted text only     +0.67 (-0.04, +1.39)  +1.63 (+0.54, +2.82)  +0.12 (-0.69, +1.00)
  (the quotes without the lines that name who is quoted)

the lab's post: 1165 of the later posts, a reply in sci.med; its lines by part: body 5, meta 7, quotes 3, subject 1, tail 2`;

export default function ClosingTheChannelsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 3 · The leak audit", color: "var(--c-metrics)" }]}
        time="about 14 minutes"
        title={<>Closing the channels</>}
        intro={<>
          Four parts of a post can reach a model besides what its sender wrote about. Close each one on its own
          and all together, once in the test tutorials run and once on the router&rsquo;s job, and see who each
          part was helping.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={3} article={10} total={27}>
          What is each part of a post worth, and to whom?
        </ArticleOpener>

        <h2>Four channels</h2>
        <p>
          Pages 3 and 4 cut a post into parts by who writes them, and the router&rsquo;s view has read two of
          them: the subject and the body. Four others can reach a model.
        </p>
        <ul style={ol}>
          <li><strong>The header lines</strong>, written by the sender&rsquo;s software and site: who, from where, on which machine.</li>
          <li><strong>The quotes</strong>: other people&rsquo;s words, under a line that names who wrote them.</li>
          <li><strong>The signature</strong>: whatever follows a &ldquo;--&nbsp;&rdquo; line.</li>
          <li><strong>The tail</strong>: page 4&rsquo;s name for the last block of a post with no &ldquo;--&nbsp;&rdquo; line. In a hand-read sample, 30 of 40 were signatures typed without it.</li>
        </ul>
        <p>
          The moderator&rsquo;s notes are out everywhere on this page, as page 9 decided. Page 1 measured the
          channels once: on the new threads, the whole post and the router&rsquo;s view score the same, 0.8239 and
          0.8235. This page takes that zero apart, twice.
        </p>

        <h2>In the tutorials&rsquo; test</h2>
        <p>
          H3 in the register made a prediction about a random split, the test most tutorials run: that the
          channels back each other up, because the same name sits in several of them. Closing one would cost
          little, and closing all three would cost at least three times what the costliest one costs alone.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>
            On a random split, closing the header lines, the quotes and the signature together costs about 4.7
            points. How much of that does closing the quotes alone cost?
          </>}
          options={["Under a third, as H3 bet", "About half", "Most of it"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outChannels}</CodeOutput>

        <p>
          Most of it. The quotes alone cost 3.80 of the 4.65 points, 82%, and in no split less than 76%. The
          header lines cost 0.55, and closing the signature makes the model slightly better. The channels do not
          back each other up. One of them carries the leak.
        </p>
        <p>
          And that leak is not a name. It is the conversation. Closing the quotes costs 5.24 points on the test
          replies and 1.05 on the test new threads, and 83% of the test replies have a post from their own thread
          on the training side. A reply quotes the post it answers, and a random split puts that post, or another
          from the same thread, among the training posts with its forum attached. The model is tested on text it
          has already been handed the answer for. That is page 1&rsquo;s &ldquo;conversations it has already
          read&rdquo;, measured.
        </p>

        <Settled id="H3">
          Closing the quotes alone costs 82% of what closing all three channels costs (76% to 94% across the
          five splits), far above the third H3 allowed. The channels do not back each other up: the quotes carry
          nearly all of it, and they carry it as the thread&rsquo;s own text, not as names.
        </Settled>

        <h2>On the job</h2>
        <p>
          The router&rsquo;s job is not a random split. Its posts are new threads, and most of them quote nothing.
          And every channel on this page is there when a post arrives: the header lines and the signature are the
          sender telling the router who they are. On the job the question is not whether a channel leaks. It is
          what reading it does, and for whom.
        </p>

        <CodeOutput source="scripts/routing_cases.py">{outChannelsJob}</CodeOutput>

        <p>
          Page 1&rsquo;s zero is an average. Read the whole post, and senders the router has met gain 3.68
          points, a gain the posts can settle; new senders lose 1.12, a loss they cannot quite settle. The header
          lines alone behave the same way, +3.58 and &minus;0.87. What identifies the sender helps only the
          senders the router already knows.
        </p>
        <p>
          The tail belongs with them. It is worth 1.52 points to known senders and 0.12 to new ones, and its gain
          over all new threads, 0.63, has an interval that reaches down to zero. (Page 4 cut the tail with the
          notes still in and got 0.8160; with the notes stripped first, a note at the foot of a post is no longer
          taken for the tail.) The quotes are the exception: +0.91 over all new threads, and new senders do not
          lose. But every quote arrives under a line naming whoever is quoted, and with those lines taken out the
          gain is 0.67 and not settled, most of it again to known senders.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Switch on the quotes alone: the random split jumps by nearly four points, the job by one. Then switch on the header lines and the signature together, and compare the two groups of senders.</>}
          insight={<>
            The random split rewards the quotes, because they carry the thread. The job rewards whatever names
            the sender, and only for senders the router has met: with the header lines and the signature on, new
            senders lose 1.62 points, and that interval stays below zero.
          </>}
        >
          <ChannelsLab />
        </LabFrame>

        <h2>What the router reads from here on</h2>

        <DecisionPoint
          accent={POST}
          question={<>The header lines, the signature and the tail help the senders the router has met. The quotes help a little more widely. What does the router read from act 4 on?</>}
          options={[
            {
              label: "The whole post: on average nothing is lost",
              verdict: "miss",
              response: <>On average, nothing. But the average is a transfer: +3.68 points for the 923 senders the
                router has met, &minus;1.12 for the 1,604 it has not. A router that reads who you are gets better
                the more of its traffic comes from regulars, and 63% of the later new threads come from people it
                has never met.</>,
            },
            {
              label: "Subject and body plus the quotes: the best score here",
              verdict: "close",
              response: <>It scores best on the later posts, and that is the trouble: opening a channel because
                the later posts liked it spends the final exam on a design choice. Part of the gain comes from the
                lines naming who is quoted, and without them it is not settled. The quoted text is a feature for
                act 5 to test on the harness act 4 builds.</>,
            },
            {
              label: "Subject and body only: the tail and the notes out",
              verdict: "best",
              response: <>It reads what the post says and nothing about who sent it. It costs 0.67 points on the
                new threads, a cost the posts can settle and all of it from senders the router has met, and it
                narrows the gap between known and new senders from 4.6 points to 3.1. If a sender&rsquo;s history
                is worth using, it belongs in the model as a feature of its own, tested on its own, not arriving
                through a gap in the parser.</>,
            },
          ]}
        />

        <p>
          So the router&rsquo;s view changes once, here. From act 4 on it is the subject and the body, with the
          tail and the moderator&rsquo;s notes taken out: 0.8168 on the later new threads, 0.8364 for senders the
          router has met and 0.8055 for new ones. The 0.8235 of acts 1 to 3 was the first view&rsquo;s number,
          and the overview&rsquo;s figures for the final model are measured again on the audited view when acts
          5 and 6 reach them.
        </p>

        <Callout color={POST} title={<>An average of zero</>}>
          Page 1 said the channels are worth nothing on the new threads, and on average they are. Split by who is
          writing, the whole post gives known senders 3.7 points and takes 1.1 from new ones. A zero can be a
          transfer between two groups, and only the split shows it.
        </Callout>

        <Followup>
          List the fields in your own records that say who a record came from, beside the ones that say what it
          is about: a customer ID, the account&rsquo;s age, the agent&rsquo;s team, the device, a template&rsquo;s
          footer. Close each one on its own and all together, on the records the model will meet, and split the
          result by the group the field identifies. A field that helps only your regulars is a decision about
          newcomers, not a free point.
        </Followup>

        <SigRule n={9}>
          <strong>Close each channel on its own and all together, on the records the model will meet, and split
          the result by the group the channel identifies.</strong> An average of zero can be a gain for one group
          paid for by another.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/the-moderators-fingerprint`, label: <>← The moderator&rsquo;s fingerprint</> }}
          next={{ href: `${R}/the-split`, label: <>Next up · The split that predicts the future →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
