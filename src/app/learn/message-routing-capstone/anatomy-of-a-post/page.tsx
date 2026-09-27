import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { SampleAudit } from "@/components/figures/routing/AnatomyFigures";
import ParserLab from "@/components/labs/ParserLab";
import sample from "@/data/routing/sample.json";

export const metadata = {
  title: "Anatomy of a post — Manifold",
  description:
    "To measure the parts of a record you first have to cut it into parts, and the cutting is a decision that can be wrong. scikit-learn's recommended cleaning drops the subject of every post and cuts the last block of nearly all of them; a hand-read sample shows what it removes, and a signature rule shows what it misses.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const outParsers = `scikit-learn: fetch_20newsgroups(remove=("headers", "footers", "quotes")), rule by rule
  headers  drops everything above the first blank line, Subject included: 18846 of 18846 posts
  footers  cuts from the last blank (or dashes) line to the end: 18015 of 18846 posts (0.956)
           1655 of the 2527 later new threads lose a last block and have no '-- ' signature
           (a median of 6 words each)
  quotes   drops quoted lines and 'X writes:' lines, the same rule as this capstone's parser

linear SVM (C=0.3), accuracy on the later new threads
  this capstone's parser: subject + body       0.8235
  the same, without the subject                0.7899
  scikit-learn's three removals                0.7812
  scikit-learn's three removals + the subject  0.8184`;

const outSample = `40 new threads drawn at random (seed 20) from the 2550 earlier ones whose last block
the footer rule cuts and that have no '-- ' signature; each cut block read and labelled
  signature or contact details only     30
  the poster's own words                 5
  both                                   4
  a divider line only                    1

the router's view on the later new threads, with and without that last block
                        all   known sender   new sender       gap
as parsed            0.8235         0.8527       0.8067   +0.0459
last block cut       0.8160         0.8364       0.8042   +0.0322
(known sender: the 923 new threads from someone who posted before the cut-off; new: 1604)`;

export default function AnatomyOfAPostPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 1 · Frame the job", color: "var(--c-metrics)" }]}
        time="about 12 minutes"
        title={<>Anatomy of a post</>}
        intro={<>
          Page 3 traced who wrote each part of a post. To measure any of those parts you first have to cut a post
          into them, and the cutting is itself a decision that can be wrong. Here we check two ways of doing it on
          real posts, one of them the cleaning scikit-learn&rsquo;s own documentation recommends.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={1} article={4} total={27}>
          Before measuring what each part of a record is worth, can you find the parts? And has anyone checked the
          tool that finds them?
        </ArticleOpener>

        <h2>Five parts, three kinds</h2>
        <p>
          The field guide first. A post has five parts: the header lines, the subject, the body, lines quoted from
          another post, and a signature. Page 3 sorted them by what they tell a router, and that gives three kinds:
        </p>
        <ul style={ol}>
          <li><strong>Content</strong>: what the poster wrote about the topic. The subject and the body. This is what the router should read.</li>
          <li><strong>Shortcuts</strong>: true, present when the post arrives, and about the sender rather than the topic. The header lines and the signature. They work for people the router has met and for no one else.</li>
          <li><strong>Leaks</strong>: parts that carry the answer because of how the data was made, like the moderated forum&rsquo;s marks. Act 3 hunts for them.</li>
        </ul>
        <p>
          All of that assumes you can tell where one part ends and the next begins. In a table the columns do it
          for you. In text, some code does it, and nobody looks at that code again.
        </p>

        <h2>Two ways to cut a post</h2>
        <p>
          This capstone&rsquo;s parser follows Usenet&rsquo;s own conventions. The header block ends at the first
          blank line, and the Subject is kept as content. A quoted line starts with &ldquo;&gt;&rdquo; or
          &ldquo;|&rdquo;, or introduces a quote (&ldquo;In article &hellip;&rdquo;, &ldquo;&hellip; writes:&rdquo;).
          The signature is everything after a line that reads exactly &ldquo;--&nbsp;&rdquo;, the delimiter
          newsreaders inserted.
        </p>
        <p>
          scikit-learn ships its own cleaning, and its documentation recommends it for any evaluation on this
          dataset: pass <code>remove=(&quot;headers&quot;, &quot;footers&quot;, &quot;quotes&quot;)</code> and the
          score drops because it is more realistic. Its source is three short functions. Headers: drop everything
          above the first blank line. Footers, described as signature blocks: cut from the last blank line, or line
          of dashes, to the end. Quotes: the same pattern as ours. The difference is in the first two rules.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>
            Train the same linear SVM on scikit-learn&rsquo;s cleaned text instead of this capstone&rsquo;s parse.
            On the new threads, how does it compare?
          </>}
          options={["About the same", "A point or two worse", "Four points or more worse"]}
          nudge="Locked in. Look at what each parser does to three real posts first."
        />

        <LabFrame
          accent={POST}
          tryThis={<>Switch between the three views on each post. Start with the X Consortium question in scikit-learn&rsquo;s cleaning.</>}
          insight={<>
            scikit-learn&rsquo;s cleaning reduces the X Consortium post to one word, &ldquo;Hi,&rdquo;: the header rule
            takes the subject, and the last blank line sits right above the question. On the hard-drive post it is
            the other way round: the footer rule removes a signature that this capstone&rsquo;s parser keeps,
            because nobody typed the &ldquo;--&nbsp;&rdquo; line above it.
          </>}
        >
          <ParserLab />
        </LabFrame>

        <p>Now the whole dataset:</p>
        <CodeOutput source="scripts/routing_cases.py">{outParsers}</CodeOutput>

        <p>
          The recommended cleaning costs 4.2 points on the new threads (0.781 against 0.824). Most of that is the
          subject: the header rule drops it from all 18,846 posts, and on its own it is worth 3.4 points (0.824
          with it, 0.790 without). Put the subject back into scikit-learn&rsquo;s text and it recovers to 0.818.
          The intent behind the recommendation, keep the metadata out, is sound; the header rule just takes the
          poster&rsquo;s own one-line summary of the topic with it.
        </p>
        <p>
          The footer rule is harder to judge. It cuts something from 95.6% of posts, including 1,655 of the 2,527
          new threads that have no &ldquo;--&nbsp;&rdquo; signature at all: six words each, at the median. Are
          those six words signatures, or the end of what the poster wrote? No count can answer that. Someone has to
          read them.
        </p>

        <h2>Read a sample</h2>
        <p>
          The method is old and it still works. Draw records at random, with a fixed seed so the draw can be
          repeated. Read each one and label it before counting anything, so the count cannot steer the labels.
          Write the labels into the code that draws the sample, so anyone can check them. Forty is enough to tell
          &ldquo;almost always&rdquo; from &ldquo;about half&rdquo;, and it takes twenty minutes.
        </p>

        <CodeOutput source="scripts/routing_cases.py">{outSample}</CodeOutput>

        <SampleAudit d={sample} />

        <p>
          Three blocks in four are signatures or contact details, and the footer rule is right to cut them. The
          rest are not. In four the poster&rsquo;s words and a sign-off are mixed together, and in five the block
          is the poster&rsquo;s words outright: the X Consortium question, another question about the X toolkit, a
          screenful of display settings the poster pasted in, a line of thanks, and &ldquo;GO LEAFS !!!&rdquo;,
          which is about as clear a vote for rec.sport.hockey as a post can cast.
        </p>
        <p>
          The same sample says something less comfortable about this capstone&rsquo;s parser. Every one of those
          thirty signatures sat in a post with no &ldquo;--&nbsp;&rdquo; line, so our parser counted it as body. If
          the sample is typical, about half of all new threads carry a signature inside what we have been calling
          the body. The router&rsquo;s view, &ldquo;subject and body&rdquo;, has been reading signatures all
          along.
        </p>
        <p>
          The second table in the output measures what that costs. Cut the last block of every new thread that
          lacks a signature line, and accuracy falls from 0.824 to 0.816. The fall is 1.6 points on posts from
          people the router has met and 0.25 on posts from everyone else: about fifteen posts against four. What
          those blocks were carrying was mostly the sender.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>The last block is a signature three times in four and the poster&rsquo;s words the rest of the time. What do you do with it?</>}
          options={[
            {
              label: "Cut it, the way scikit-learn does",
              verdict: "close",
              response: <>It removes most of the unmarked signatures, and the gap between familiar and new senders
                shrinks from 4.6 to 3.2 points. But it deletes real questions with them, the X Consortium post
                among them, and it costs 0.75 points overall. A cheap fix that throws away evidence you have not
                weighed yet.</>,
            },
            {
              label: "Keep it in the body, as the parser does now",
              verdict: "miss",
              response: <>Then every later measurement of &ldquo;the body&rdquo; quietly includes thousands of
                signatures, and no audit will ever look at them, because as far as the code is concerned they do
                not exist as a part.</>,
            },
            {
              label: "Make it a part of its own, and let the leak audit weigh it",
              verdict: "best",
              response: <>When a cut is uncertain, do not guess in either direction: name the uncertain piece. The
                script now splits it out as the <em>tail</em>. The router&rsquo;s view keeps it for the moment, so
                every number on pages 1 to 3 stands, and act 3 measures it beside the header lines, quotes and
                signatures, for familiar and new senders separately.</>,
            },
          ]}
        />

        <Callout color={POST} title={<>The parser is part of the model</>}>
          Every comparison later in this capstone inherits the parser. The recommended cleaning moves accuracy on
          the job&rsquo;s posts by 4.2 points, more than the gap between logistic regression and the linear SVM
          (0.9 points). A cleaning step nobody has checked can decide a result before the first model is fitted.
        </Callout>

        <Followup>
          Find the cleaning step in your own pipeline that everyone copies: an HTML stripper, a signature remover,
          a PDF-to-text converter, a tokenizer. Draw thirty or forty records at random, and for each one read what
          went in and what came out. Label them before you count. You are looking for two things: what it removed
          that you needed, and what it left in that you thought was gone.
        </Followup>

        <SigRule n={3}>
          <strong>Check the tool that cuts your records into parts, on a random sample, before trusting anything
          measured with it.</strong> When a cut is uncertain, make the uncertain piece a part of its own instead of
          deleting it or leaving it hidden.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/how-the-data-was-made`, label: <>← How the data was made</> }}
          next={{ href: `${R}/research-questions`, label: <>Next up · Research questions →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
