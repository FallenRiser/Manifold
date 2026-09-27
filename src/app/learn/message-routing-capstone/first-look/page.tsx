import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import LengthBandsLab from "@/components/labs/LengthBandsLab";
import fl from "@/data/routing/firstlook.json";

export const metadata = {
  title: "First look at the posts — Manifold",
  description:
    "Before turning text into numbers, look at the posts as a pile: how long they are, which repeat, which contradict each other, and which break the definitions the job rests on. The router is right on half of the shortest posts and 86.5% of the longest, and the near-copies of earlier posts are routed by their copy.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const fmt = (x: number) => x.toLocaleString("en-US");
const first = fl.bands[0];
const last = fl.bands[fl.bands.length - 1];

const outFirstLook = `the later new threads: 2527 posts, the router's view of each (subject + body)
  words: median 92; 10% have fewer than 31, 10% more than 448; the longest 9395
  subject: median 4 words
  nothing but a subject (empty body): 23, routed right 14

accuracy by length (linear SVM, C=0.3)
  words           posts   accuracy      95% interval   median margin
  under 10           36      0.500    0.333 to 0.667           0.321
  10-19              54      0.759    0.648 to 0.870           0.428
  20-39             303      0.772    0.723 to 0.822           0.498
  40-79             673      0.814    0.786 to 0.843           0.607
  80-159            735      0.833    0.807 to 0.860           0.670
  160 or more       726      0.865    0.840 to 0.888           0.884

near-copies: later new threads with an earlier post at cosine 0.9 or more
  56 posts, routed right 0.875; without them the other 2471 score 0.8223 (all 2527: 0.8235)
    its copy sits in the same forum     49   routed right 48
    its copy sits in another forum       7   routed right 1
    most of them in: misc.forsale 22, comp.graphics 7, rec.sport.hockey 5

the same body filed in two forums (whole dataset): 12 texts, 25 posts, 10 of them later new threads

new threads that quote an earlier post (an attribution line): 167
  routed right 0.856 (95% interval 0.796 to 0.904); the other new threads 0.821
  whose subject names the old one, 'New subject (was: Old subject)': 54
  whose subject matches a thread the router already knows: 5
posts carrying an encoded binary file (10+ uuencoded lines): earlier 22 (comp.os.ms-windows.misc 19), later 5
  the longest later post (a reply): 22330 words, 901 of its lines uuencoded`;

export default function FirstLookPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 2 · First contact", color: "var(--c-metrics)" }]}
        time="about 12 minutes"
        title={<>First look at the posts</>}
        intro={<>
          This act turns the posts into numbers. Before that, look at them as a pile: how long they are, which
          ones repeat, which contradict each other, and which break the definitions the first act set up. An
          average hides exactly those posts.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={2} article={6} total={27}>
          What does a typical record look like, and which records break the picture?
        </ArticleOpener>

        <h2>Four hunts</h2>
        <p>
          A first look at a table starts with summary statistics for each column. A first look at text asks the
          same thing of the records: what does a typical one look like, and which ones don&rsquo;t fit? Four hunts
          cover most of it.
        </p>
        <ul style={ol}>
          <li><strong>Shape.</strong> How long are the records, and do short and long ones behave differently?</li>
          <li><strong>Repeats.</strong> The same text more than once, within a split or across it.</li>
          <li><strong>Contradictions.</strong> The same text with two different labels.</li>
          <li><strong>Misfits.</strong> Records that break a definition you rely on.</li>
        </ul>
        <p>
          For every group you find, count it, read some of it, and measure what it does to the score. Then decide
          what to do about it with one question: <em>how would the live system meet these records?</em>
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>
            The router&rsquo;s view of a new thread runs from a single word to over nine thousand. Where does the
            linear SVM make most of its mistakes?
          </>}
          options={["On the shortest posts", "On the longest posts", "Length makes little difference"]}
          nudge="Locked in. The table under 'accuracy by length' has the answer."
        />

        <CodeOutput source="scripts/routing_cases.py">{outFirstLook}</CodeOutput>

        <h2>Short posts are hard</h2>
        <p>
          The typical new thread is short: a four-word subject and, all told, {fl.median} words in the
          router&rsquo;s view. One in ten has fewer than {fl.p10}; one in ten has more than {fl.p90}. Accuracy
          climbs with length, from {first.acc.toFixed(2)} under ten words to {last.acc.toFixed(3)} at 160 or
          more. The shortest band holds only {first.n} posts, so its interval is wide, but even its top
          ({first.ci[1].toFixed(2)}) sits below the bottom of the longest band&rsquo;s ({last.ci[0].toFixed(2)}).
        </p>
        <p>
          The model knows it, too. Its margin, the lead of the winning forum over the runner-up, has a median of{" "}
          {first.margin.toFixed(2)} on the shortest posts and {last.margin.toFixed(2)} on the longest. Act 6 will
          lean on that when it decides which posts to hand to a person.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Click the shortest band, then the longest, and read what is in each.</>}
          insight={<>
            Three of the six shortest posts are not about anything: two try to subscribe to the forum by posting
            the word &ldquo;subscribe&rdquo; to it, and one is a test. They have a forum only because they were
            posted somewhere. The longest band holds a FAQ, a hockey schedule and a long argument beside
            ordinary questions.
          </>}
        >
          <LengthBandsLab />
        </LabFrame>

        <p>
          {fl.empty} new threads are nothing but a subject: once quotes and signature are set aside, the body is
          empty. The router gets {fl.empty_right} of them right. Some of them, like &ldquo;test (please
          ignore)&rdquo; or &ldquo;how&rdquo;, give a person nothing to go on either. No model fixes that; the
          system&rsquo;s answer is to pass them to a person, and act 6 builds the rule that picks them out.
        </p>
        <p>
          At the other end sit FAQs, resource listings, schedules and essays pasted in from elsewhere. The longest
          later post of all, a reply of 22,330 &ldquo;words&rdquo;, is 901 lines of an image file encoded as
          text, which is how binaries travelled over Usenet. Twenty-two earlier posts carry one, nineteen of them
          in comp.os.ms-windows.misc. Their &ldquo;words&rdquo; are random strings that will never recur. They
          do the router little harm, but they will swell any count of the vocabulary, which is page 7&rsquo;s
          business.
        </p>

        <h2>Repeats</h2>
        <p>
          56 new threads have an earlier post that is almost the same text: the two score 0.9 or more on the
          cosine similarity of their word weights, a measure page 7 builds. Reading them, most are simply how
          Usenet worked. Twenty-two are for-sale ads posted again. Others are FAQs and listings reposted on a
          schedule, hockey results in a series, and questions posted a second time because nobody answered the
          first.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>56 later new threads have a near-copy among the earlier posts the router trained on. What do you do with them?</>}
          options={[
            {
              label: "Remove them from the test set: a copy in training is a leak",
              verdict: "close",
              response: <>In many datasets that is the right instinct. When copies come from how the data was
                collected (the same page scraped twice, one record exported from two systems), they make the test
                easier than the job. Here they come from how the forums worked, and the live router would have
                seen the earlier copy too. Removing them would measure a different, harder job than the real one.</>,
            },
            {
              label: "Keep them, and check they are not carrying the score",
              verdict: "best",
              response: <>The live router meets reposted ads and monthly FAQs, so the test set should too. The check
                is cheap: the copies are routed right 0.875 of the time, and without them the score moves from
                0.8235 to 0.8223, about a tenth of a point.</>,
            },
            {
              label: "Remove the earlier copies from the training set instead",
              verdict: "miss",
              response: <>Then the router forgets the ads and FAQs it is certain to meet again, and the test
                measures a handicap the live system would not have.</>,
            },
          ]}
        />

        <p>
          The mistakes among the copies are telling. When the earlier copy sits in the same forum, the router
          gets 48 of 49 right. When it sits in another forum, it gets 1 of 7: the model files a post where it
          filed the copy. Most of those seven are the same text sent to two forums at different times.
        </p>

        <h2>Same text, two forums</h2>
        <p>
          The exact version of that: 12 texts appear in two forums with identical bodies, 25 posts in all, 10 of
          them later new threads. The release removed cross-posts, so each of these is either one article posted
          separately to two forums or a cross-post the clean-up missed. With the Message-IDs gone there is no
          telling which. Either way, both labels are right, because the poster wanted the text in both places,
          and a router scored against one of them is marked wrong for choosing the other. Ten posts will not move
          the score. They are the clearest case of a label that is one answer among several, and they are worth
          remembering when act 4 decides what a near miss costs.
        </p>

        <h2>New threads that aren&rsquo;t new</h2>
        <p>
          167 new threads carry an attribution line, the &ldquo;so-and-so writes:&rdquo; above a quote. They
          answer an earlier post under a new subject, 54 of them in Usenet&rsquo;s own form for it: &ldquo;New
          subject (was: Old subject)&rdquo;. Only 5 of them have a subject that matches a thread the router already knows,
          so the thread lookup from page 2 cannot catch them, and they stay in the model&rsquo;s traffic. It
          routes 0.856 of them right against 0.821 of the rest, a gap 167 posts cannot settle (the interval runs
          from 0.796 to 0.904).
        </p>

        <Callout color={POST} title={<>The average hides the edges</>}>
          0.824 on the new threads is an average over posts of one word and of nine thousand. Every group on this
          page is small, and none of them moves the average by much. That is why they have to be looked for: the
          average will never show them to you.
        </Callout>

        <Followup>
          Sort your own records by length and read ten from each end. Then look for repeats, exact first
          (lower-case the text and collapse the whitespace) and then near (a cosine of 0.9 between TF-IDF vectors
          is a reasonable start). For each group, ask how the live system would meet it. If the system would see
          the earlier copy too, the repeat belongs in the test. If the copy comes from how you collected the data,
          it does not.
        </Followup>

        <SigRule n={6}>
          <strong>Look for the records an average hides: the empty, the huge, the repeated and the
          contradictory.</strong> Count each group, read some of it, and decide what to do with it by how the live
          system would meet it.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/research-questions`, label: <>← Research questions</> }}
          next={{ href: `${R}/words-into-numbers`, label: <>Next up · Words into numbers →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
