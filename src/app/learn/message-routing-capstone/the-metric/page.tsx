import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import CountingLab from "@/components/labs/CountingLab";

export const metadata = {
  title: "The metric, on the right posts — Manifold",
  description:
    "The same routes score 0.817 counting each new thread once and 0.779 counting each forum once. The per-thread count ranks models best, and a per-forum floor beside it catches what no average shows: a forum the news moved after the cut-off.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const outMetric = `the audited view, linear SVM (C=0.3); later new threads 2527, harness new threads 3966

the forum mix, distance from the later new threads' mix (half the summed difference of 20 shares)
  all earlier posts, the mix a test on every post scores   22.8%
  earlier new threads, the mix the harness scores          5.8%

three ways to count the same routes          later new threads          harness
  each new thread once                   0.8168 (0.8017-0.8310)   0.8250 (0.8132-0.8361)
  each forum once (mean of 20)           0.7788 (0.7592-0.7985)   0.8061 (0.7910-0.8206)
  each post of its conversation          0.7881 (0.7456-0.8255)   0.8510 (0.8354-0.8654)
  (a conversation: the new thread and the replies its thread drew; the 5 largest carry 5.0%
   of the later weight)
  counting each forum once, one alt.atheism thread weighs as much as 12.2 misc.forsale ones

each forum's new threads routed right (95% interval); * = the whole interval below 0.75
  forum                     share later new threads      harness
  misc.forsale              14.0%  0.901 (0.870-0.932)   0.874 (0.845-0.903)
  comp.windows.x             9.3%  0.821 (0.770-0.868)   0.824 (0.784-0.865)
  comp.graphics              8.4%  0.821 (0.769-0.873)   0.771 (0.721-0.817)
  comp.sys.ibm.pc.hardware   8.0%  0.724 (0.665-0.783)   0.700 (0.653-0.754)
  comp.sys.mac.hardware      7.3%  0.804 (0.745-0.864)   0.801 (0.753-0.850)
  comp.os.ms-windows.misc    6.7%  0.735 (0.665-0.800)   0.837 (0.793-0.880)
  sci.med                    5.4%  0.883 (0.832-0.934)   0.859 (0.804-0.908)
  rec.sport.hockey           5.1%  0.954 (0.915-0.985)   0.971 (0.947-0.990)
  soc.religion.christian     4.6%  0.861 (0.791-0.922)   0.807 (0.748-0.860)
  sci.electronics            4.5%  0.772 (0.693-0.851)   0.690 (0.628-0.752)
  rec.autos                  4.1%  0.806 (0.728-0.874)   0.774 (0.706-0.843)
  sci.space                  3.9%  0.869 (0.798-0.929)   0.899 (0.856-0.942)
  rec.sport.baseball         3.7%  0.860 (0.785-0.925)   0.925 (0.882-0.963)
  talk.politics.mideast      3.4%  0.874 (0.793-0.931)   0.954 (0.919-0.983)
  sci.crypt                  2.7%  0.826 (0.739-0.913)   0.900 (0.850-0.943)
  talk.politics.guns         2.3%  0.915 (0.847-0.983)   0.886 (0.810-0.949)
  talk.politics.misc         2.0%  0.529 (0.392-0.667)*  0.849 (0.767-0.931)
  rec.motorcycles            1.8%  0.848 (0.739-0.935)   0.859 (0.797-0.922)
  talk.religion.misc         1.5%  0.289 (0.158-0.447)*  0.484 (0.355-0.613)*
  alt.atheism                1.1%  0.483 (0.310-0.655)*  0.457 (0.314-0.629)*
  below the floor, harness: alt.atheism, talk.religion.misc
  below the floor, later:   alt.atheism, talk.politics.misc, talk.religion.misc

talk.politics.misc: harness 0.849, later 0.529. Of its 51 later new threads 24 are misrouted, 19 to
talk.politics.guns, and all 19 name Waco, Koresh, the Davidians or the BATF
  naming them          all    in guns   in politics.misc
  earlier posts        251     141         6
  later posts          319     156       102
  earlier new threads   49      29         2
  later new threads     58      27        23
  the misroutes to guns move the later new threads' score by 0.75 points`;

const outMetricChoice = `the harness (thread-grouped, new threads) under two counts, and the later new threads
balanced by new threads: each forum's posts weighted by one over its share of the new
threads, so an alt.atheism post weighs 14.5 misc.forsale posts in training

                                  harness                      later new threads
                                  thread   weighted forum      thread   forum
  C=0.1                           0.8182   0.8116   0.7903     0.8104   0.7667
  C=0.3                           0.8250   0.8181   0.8061     0.8168   0.7788
  C=1                             0.8235   0.8169   0.8088     0.8097   0.7753
  C=3                             0.8195   0.8120   0.8074     0.8021   0.7676
  C=0.3, balanced by new threads  0.8129   0.8056   0.8078     0.8017   0.7840

  choosing C, counting threads: the harness picks C=0.3, the later posts C=0.3
  choosing C, counting forums:  the harness picks C=1, the later posts C=0.3

  on the harness, change against C=0.3, points (95% interval)
                                  counting threads         counting forums
  C=1                             -0.15 (-0.66, +0.35)    +0.27 (-0.32, +0.94)
  C=0.3, balanced by new threads  -1.21 (-1.82, -0.61)    +0.16 (-0.63, +1.00)`;

export default function TheMetricPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 4 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 13 minutes"
        title={<>The metric, on the right posts</>}
        intro={<>
          The harness can now say what next month will score. Before it chooses anything, decide what it counts:
          every new thread, every forum, or every post a thread brings with it. The same routes score between
          0.78 and 0.82 depending on the answer, and the best of the three counts still hides a forum that
          changed after the cut-off.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={4} article={12} total={27}>
          Whose mistakes does the number count?
        </ArticleOpener>

        <h2>Every average has a population</h2>
        <p>
          Page 11 fixed the harness. It says 0.8250 for the router, 0.8181 weighted to next month&rsquo;s mix of
          senders, and the later posts say 0.8168. All three count every new thread once. That is already a
          choice, and page 2 left it open: misc.forsale opens twelve times as many threads as alt.atheism, so in
          an average over threads its ads together weigh twelve times as much as alt.atheism&rsquo;s arguments.
        </p>
        <p>
          Scoring new threads settles one part of it: which mix of forums the average carries. A test on every
          earlier post scores a mix of forums 22.8% away from the later new threads&rsquo; (half the summed
          difference of the twenty shares). The harness&rsquo;s new threads are 5.8% away. Scoring the right posts
          brings the right forum mix with it. What is left is how to weigh them.
        </p>

        <h2>Three ways to count the same routes</h2>
        <ul style={ol}>
          <li><strong>Each new thread once.</strong> Every post the router files counts the same: the share of posters whose thread lands in the right forum.</li>
          <li><strong>Each forum once.</strong> The mean of the twenty forums&rsquo; own accuracies, so every forum&rsquo;s readers count the same however many threads they get. Libraries call it macro-averaged recall.</li>
          <li><strong>Each post of its conversation.</strong> A new thread weighs one plus the replies its thread drew, because a misfiled thread takes its replies with it (page 2).</li>
        </ul>

        <PredictPrompt
          accent={POST}
          prompt={<>Count each forum once instead of each thread. Where does the later posts&rsquo; 0.817 go?</>}
          options={["About the same", "Higher: the big forums are the hard ones", "Lower: the small forums are the hard ones"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outMetric}</CodeOutput>

        <p>
          Lower, by 3.8 points: 0.7788. The forums that open the fewest threads are the ones the router files
          worst: talk.religion.misc 0.289, alt.atheism 0.483, talk.politics.misc 0.529. Together they are 118 of
          the 2,527 new threads, 4.7%, so counting threads they hardly move the average. Counting forums they are
          three of twenty, and one alt.atheism thread weighs as much as 12.2 misc.forsale ads.
        </p>
        <p>
          Counting conversations gives 0.788, with a warning attached. Its interval is 8.0 points wide, nearly
          three times the per-thread count&rsquo;s 2.9, and the harness puts it 6.3 points higher than the later
          posts do. It measures what was at stake, as page 2 did. It cannot tell two models apart.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Switch from each new thread to each forum and watch the weights: misc.forsale falls from 14.0% of the score to 5.0%, and alt.atheism rises from 1.1% to 5.0%. Then switch to the harness and find the forum that sits below the floor on the later posts but not on the harness.</>}
          insight={<>
            The routes never change; the score moves 3.8 points with the count. The floor sees what no average
            does: two forums below it on the harness, three on the later posts, and the third is not a small
            forum having a bad month.
          </>}
        >
          <CountingLab />
        </LabFrame>

        <h2>The forum the harness passed</h2>
        <p>
          Where the floor sits is the operators&rsquo; call, like the 95% promise. We take it as three in four,
          and a forum is named only when its whole interval sits below that, so a small forum is not named for
          bad luck. On the harness two forums are named, alt.atheism and talk.religion.misc, and the operators
          can know that before the router goes live. On the later posts a third joins them: talk.politics.misc,
          0.849 on the harness and 0.529 later.
        </p>
        <p>
          24 of its 51 later new threads were misrouted, 19 of them to talk.politics.guns, and all 19 name Waco,
          Koresh, the Davidians or the BATF. The siege of the Branch Davidians near Waco, Texas began with a raid
          by the Bureau of Alcohol, Tobacco and Firearms, and ended in fire on 19 April 1993, about when the
          earlier posts end (page 3). Up to then it was a firearms story: of the 251 earlier posts that name it,
          141 are in talk.politics.guns and 6 in talk.politics.misc. After it, it was politics too: of the 319
          later posts that name it, 156 are in guns and 102 in politics.misc. The router learned where Waco lived
          up to the cut-off, and then the conversation moved.
        </p>
        <p>
          The per-thread average saw 19 posts, 0.75 points, well inside its own interval. The forum lost 32
          points. Act 6 comes back to it when the world changes. Here it shows what the average is for, and what
          it cannot do.
        </p>

        <h2>Does the count change the choice?</h2>
        <p>
          A count matters most when it changes what gets chosen. Let the harness choose under two counts,
          threads and forums, and set each choice against what the later posts would have chosen. The candidates
          are four values of C, and one model built for the forum count: class weights that balance the forums by
          their new threads, so the forums that open few threads weigh more in training.
        </p>

        <CodeOutput source="scripts/routing_cases.py">{outMetricChoice}</CodeOutput>

        <p>
          Counting threads, the harness picks C=0.3, and so would the later posts. Counting forums, it picks C=1,
          by 0.27 points with an interval from &minus;0.32 to +0.94, and the later posts&rsquo; own forum count
          prefers 0.3. The forum count chose on noise. It gives each forum a twentieth however few threads the
          forum has, so its intervals are a quarter to a third wider than the per-thread ones.
        </p>
        <p>
          The balanced model is the sharper case. Counting forums it gains 0.16 points, an interval from
          &minus;0.63 to +1.00; counting threads it loses 1.21, and that loss is settled. A team told to raise the
          forum average could ship it, and about one more new thread in every hundred would land in the wrong
          forum, for a gain nobody can measure. On the later posts it costs 1.51 points counted by thread and adds
          0.52 counted by forum.
        </p>

        <h2>A near miss counts as a miss</h2>
        <p>
          One more question belongs to the metric. Is a question about a video card filed in the wrong hardware
          forum as wrong as one filed under hockey? A metric could give it partial credit. H5 in the register
          bets that most misroutes are near misses like that, and act 6 settles it when it reads the errors. Until
          then every misroute counts as one: partial credit needs a cost for every pair of forums, and this data
          has none. Hand-offs get their own measure, how often the right forum is among the three suggestions,
          when act 6 builds them.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>What does the harness count when acts 5 and 6 choose?</>}
          options={[
            {
              label: "Each forum once: every forum's readers count the same",
              verdict: "close",
              response: <>It speaks for the small forums, and they need speaking for. But as a yardstick it picked
                C=1 on noise and would ship a model that misroutes one more thread in a hundred for a gain it
                cannot settle. The small forums are better served by a floor that names them than by an average
                that dilutes them.</>,
            },
            {
              label: "Each post of its conversation: count what a misroute drags along",
              verdict: "miss",
              response: <>It measures the stakes, and page 2 used it for that. As a yardstick it is 8 points wide
                on the later posts, and the harness misses it by 6. It cannot rank two models.</>,
            },
            {
              label: "Each new thread once, with every forum's accuracy beside it and the forums below the floor named",
              verdict: "best",
              response: <>It counts what the router does, one decision per post, with the finest resolution of
                the three, and it picked the C the later posts would. The floor names what the average hides: the
                two forums the harness already knows about, and on live traffic the one Waco moved.</>,
            },
          ]}
        />

        <p>
          So the metric is fixed. Acts 5 and 6 choose by the share of new threads routed right on the harness,
          raw and weighted to next month&rsquo;s sender mix. Every report lists the twenty forums with their
          intervals and names any whose whole interval sits below three in four. alt.atheism and
          talk.religion.misc start on that list.
        </p>

        <Callout color={POST} title={<>An average of a crowd cannot see a small group fail</>}>
          Counting records weights by volume; counting groups weights by group; the two can disagree by more
          than the gap between two models. Rank by the count that matches one decision of the system, then
          report the groups beside it with their intervals. A forum of 51 threads can lose 32 points and move
          the average by less than one.
        </Callout>

        <Followup>
          Pick the groups your stakeholders would name: a product line, a region, a customer tier, a language.
          Compute your metric for each, with an interval, beside the overall one, and agree a floor with them.
          Check the list on your validation harness, then again on live traffic. A group can fall after the data
          was collected, when the world moves a topic from one group to another.
        </Followup>

        <SigRule n={11}>
          <strong>Rank by the count that matches one decision of the system, and report every group beside it
          with its interval.</strong> Name the groups whose whole interval sits below the floor, on the harness and
          again on live traffic.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/the-split`, label: <>← The split that predicts the future</> }}
          next={{ href: `${R}/baselines`, label: <>Next up · Baselines →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
