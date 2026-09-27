import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { MathBlock } from "@/components/Math";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import WeightingLab from "@/components/labs/WeightingLab";

export const metadata = {
  title: "Words into numbers — Manifold",
  description:
    "Before the router can learn anything, each post becomes a row of 109,888 numbers, almost all of them zero. Every step of that conversion is a choice: what counts as a word, which words to keep, how to weight them. Measured on the job's posts, weighting words by how rare they are is worth three points, more than the choice between models.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outVectors = `vocabulary learned from the 11314 earlier posts: 109888 words
  a post uses a median of 69 of them (mean 106): 0.097% of the table is non-zero
  stored as a full table of 8-byte numbers: 9.9 GB; storing only the non-zeros: 14.6 MB
  words seen in only one earlier post: 67769 (61.7%)
  words found only in the 22 posts carrying an encoded file: 33531 (30.5%)
  the most common words: 'the' 110883 times, then 'ax' 62405 times, 99.9% of them in the 12 parts
    of one encoded picture, roman.bmp

the later new threads, against that vocabulary
  words it has never seen: 3.5% of all their words; in 78.4% of the posts;
  more than a tenth of the words in 126 posts

cosine between each later new thread and its nearest earlier post (TF-IDF, log counts)
  median 0.23; 10% below 0.16; 10% above 0.45; 56 at 0.9 or more

a flat boundary through 109888 columns for 11314 posts (linear SVM, TF-IDF with log counts)
  C           earlier posts fit    later new threads
  0.3                    0.9927               0.8235   (the router's C, chosen by thread-grouped CV)
  10                     0.9995               0.8041
  at C=10 all but 6 fit; 5 of those share their text with an earlier post in another forum
  C=0.3 against C=10 on the later new threads: +0.0194 (95% interval +0.0103 to +0.0281)

weighting the words (linear SVM; each row's C chosen by thread-grouped CV on the earlier posts)
                                           columns     C  new threads    vs the row above, 95%
  counts                                    109888  0.01       0.7784
  counts, each post scaled to length 1      109888     1       0.7879 +0.0095 (+0.0008 to +0.0178)
  + IDF (TF-IDF)                            109888   0.3       0.8176 +0.0297 (+0.0210 to +0.0388)
  + log counts (the router's)               109888   0.3       0.8235 +0.0059 (-0.0008 to +0.0127)
                                                                          vs the router's, 95%
    drop words seen in one post only         42119   0.3       0.8243 +0.0008 (-0.0024 to +0.0044)
    drop English stop words                 109578     1       0.8195 -0.0040 (-0.0111 to +0.0036)
    vocabulary and IDF fitted on all 18846 posts  146482   0.3       0.8235 +0.0000 (-0.0028 to +0.0028)`;

export default function WordsIntoNumbersPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 2 · First contact", color: "var(--c-metrics)" }]}
        time="about 14 minutes"
        title={<>Words into numbers</>}
        intro={<>
          A model cannot read. Before the router learns anything, every post has to become a row of numbers, and
          each step of that conversion is a choice. Here are the choices, what the posts turn into, and what each
          choice is worth on the job.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={2} article={7} total={27}>
          How does text become a table a model can learn from, and which choices along the way matter?
        </ArticleOpener>

        <h2>The recipe</h2>
        <p>
          The standard recipe throws away word order and keeps only which words a post uses and how often: a{" "}
          <Link href="/learn/naive-bayes/naive-bayes-for-text" style={link}>bag of words</Link>. Four steps turn a
          post into a row.
        </p>
        <ol style={ol}>
          <li><strong>Split it into words.</strong> scikit-learn&rsquo;s rule: a word is a run of two or more letters, digits or underscores, lower-cased. &ldquo;PowerBook&rdquo; and &ldquo;powerbook&rdquo; are one word; &ldquo;I&rdquo; and &ldquo;a&rdquo; are not words at all.</li>
          <li><strong>Learn a vocabulary</strong> from the training posts, the earlier ones: every word gets a column.</li>
          <li><strong>Count</strong> each word in each post.</li>
          <li><strong>Weight and scale</strong> the counts. The router uses TF-IDF with log counts, then scales every post to length 1.</li>
        </ol>
        <p>For a word <em>t</em> in a post, the router&rsquo;s weight is</p>
        <MathBlock>{String.raw`w_t = (1 + \ln \mathrm{tf}_t)\,\bigl(\ln\tfrac{1+n}{1+\mathrm{df}_t} + 1\bigr)`}</MathBlock>
        <p>
          where tf is how many times the post uses the word, <em>n</em> is the number of training posts and df is
          how many of them use it. Each piece has a reason:
        </p>
        <ul style={ol}>
          <li><strong>The second factor, IDF</strong> (inverse document frequency), shrinks words that every forum uses. &ldquo;The&rdquo; says nothing about where a post belongs; a word that turns up in 14 of 11,314 posts says a lot.</li>
          <li><strong>The log</strong> means the tenth use of a word adds less than the second. A post that says &ldquo;printer&rdquo; ten times is not ten times as much about printers.</li>
          <li><strong>Scaling to length 1</strong> stops a long post from outweighing a short one just by being long. It also makes the dot product of two posts their <em>cosine</em>, a similarity between 0 and 1, which is the measure page 6 used to find near-copies.</li>
        </ul>

        <GuessSlider
          accent={POST}
          prompt={<>The earlier posts use 109,888 different words between them. How many of those does a typical post use?</>}
          min={0}
          max={2000}
          step={10}
          start={500}
          decimals={0}
          actual={69}
          reveal={<>A median of 69, and a mean of 106. The table the router learns from is 11,314 rows by 109,888 columns, and 99.9% of it is zero.</>}
        />

        <p>The measurement, from the vocabulary to what each weighting is worth:</p>
        <CodeOutput source="scripts/routing_cases.py">{outVectors}</CodeOutput>

        <h2>A wide, empty table</h2>
        <p>
          Stored as a full table of numbers, the router&rsquo;s input would take 9.9 GB. Stored as a list of the
          non-zero entries, which is what scikit-learn does, it takes 14.6 MB. Text is the standard case of a table
          with far more columns than rows, almost all of them empty in any one row.
        </p>
        <p>
          Most of the columns are rare. 61.7% of the words appear in exactly one earlier post, and dropping them
          (the <code>min_df=2</code> setting) cuts the table from 109,888 columns to 42,119 without a measurable
          change in accuracy. Almost a third of the vocabulary, 33,531 words, appears only in the 22 posts that carry an
          encoded file (page 6). The second most common &ldquo;word&rdquo; in the whole collection, after
          &ldquo;the&rdquo;, is &ldquo;ax&rdquo;: 62,405 of them, nearly all in twelve parts of one encoded picture,
          roman.bmp, whose lines read <code>MAX&gt;&apos;AX&gt;&apos;AX&gt;&apos;AX&gt;</code>. Look at the top of your
          own word counts before you trust them.
        </p>

        <h2>What the weighting does</h2>
        <LabFrame
          accent={POST}
          tryThis={<>Open the PowerBook question with counts, then switch to TF-IDF. Watch the heaviest words, and which earlier posts come out nearest.</>}
          insight={<>
            Under counts, the PowerBook question&rsquo;s nearest earlier posts are arguments from alt.atheism and
            talk.politics.mideast: what they share with it is &ldquo;the&rdquo;, &ldquo;that&rdquo; and
            &ldquo;he&rdquo;. Under TF-IDF those words sink, &ldquo;init&rdquo;, &ldquo;freeware&rdquo; and
            &ldquo;powerbook&rdquo; rise, and the nearest earlier post comes from comp.sys.mac.hardware.
          </>}
        >
          <WeightingLab />
        </LabFrame>

        <p>
          The last block of the measurement takes the router&rsquo;s weighting apart one ingredient at a time and
          scores each version on the job. Every row gets its own C, chosen by thread-grouped cross-validation on
          the earlier posts; raw counts wanted one thirty times smaller than the router&rsquo;s, so a shared C
          would have rigged the comparison against them.
        </p>
        <ul style={ol}>
          <li><strong>Scaling each post to length 1</strong> adds about a point (0.1 to 1.8): settled, just.</li>
          <li><strong>IDF</strong> adds three (2.1 to 3.9), the largest step in the table.</li>
          <li><strong>Log counts</strong> add 0.6, which these posts cannot settle (&minus;0.1 to +1.3).</li>
          <li><strong>Pruning the vocabulary</strong> moves nothing measurable. Dropping every word seen in only one earlier post removes 62% of the columns and stays within half a point of the router either way; dropping English stop words stays within about a point.</li>
        </ul>

        <h2>Words it has never seen</h2>
        <p>
          The vocabulary is fixed when the router is trained. A word that first appears later has no column, and
          the vectorizer drops it without a warning. 3.5% of the words in the later new threads are dropped this
          way, and 78.4% of those posts lose at least one. Some are typos (&ldquo;apletalk&rdquo;), some are new
          model numbers (&ldquo;wd2340a&rdquo;), some are names of people and things the earlier posts never
          mentioned. In 126 posts, more than a tenth of the words go.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>The vocabulary misses 3.5% of the later posts&rsquo; words. Should you fit the vectorizer on all 18,846 posts, the later ones included, so it knows them?</>}
          options={[
            {
              label: "Yes: a bigger vocabulary can only help",
              verdict: "miss",
              response: <>It cannot run. When the router is trained, the later posts have not been written, so
                their words are not available. Fitting on them also leaks into the evaluation: the IDF values now
                include the test posts. Here the leak happens to cost nothing (0.8235 either way), because the
                classifier never learns a weight for a word it saw in no training post. That makes it a harmless
                mistake in this case, not a correct method.</>,
            },
            {
              label: "No: freeze the vocabulary with the model, and refit both when you retrain",
              verdict: "best",
              response: <>The vectorizer is part of the model and ages with it. What fixes unknown words is
                retraining on newer posts, with labels, which is act 6&rsquo;s question of how often to retrain.
                Meanwhile the unknown-word share is worth watching as an alarm that the posts have moved on.</>,
            },
            {
              label: "Split words into letter sequences, so a typo still matches",
              verdict: "close",
              response: <>Character pieces do catch &ldquo;apletalk&rdquo;, but they cannot know what a new model
                number or a new name means. Whether they help the router overall is a feature question, and act 5
                measures it rather than assuming it.</>,
            },
          ]}
        />

        <h2>Why a flat boundary is enough, for now</h2>
        <p>
          With 109,888 columns and 11,314 posts, there are far more directions to draw a boundary in than there are
          posts to separate. At C=10 the linear SVM puts all but 6 of the 11,314 earlier posts on the right side. Of
          those 6, 5 share their body word for word with an earlier post in another forum: page 6&rsquo;s
          contradictions, the same words under two labels.
        </p>
        <p>
          Yet the looser fit is the better router. At the router&rsquo;s C=0.3 it leaves 0.7% of the earlier posts
          on the wrong side and files 82.4% of the later new threads correctly; at C=10 it fits almost everything
          and files 80.4%, a gap of 1.9 points that the later posts do settle (1.0 to 2.8). With this many columns, finding a boundary that separates the forums is never the hard
          part. Choosing among the many that do is, and that is what C, chosen on the earlier posts, is for. It is
          also why a linear model is the natural first model for text. Whether anything curved does better is H1 in
          the register, and act 5 settles it.
        </p>

        <Callout color={POST} title={<>Weighting is worth more than the model</>}>
          Weighting words by how rare they are moves accuracy on the job&rsquo;s posts by about three points.
          The gap between logistic regression and the linear SVM on the same posts is 0.9 (page 4). Before
          choosing between models, choose the numbers they will see.
        </Callout>

        <Followup>
          Vectorize your own text and look before you model. Print the twenty most common words and the share of
          words seen only once. Count what share of your newest records&rsquo; words the vocabulary does not know.
          When you compare two ways of weighting, give each its own tuned regularisation: raw counts needed a C
          thirty times smaller than the router&rsquo;s here, and a shared C would have rigged the comparison.
        </Followup>

        <SigRule n={7}>
          <strong>Treat the vectorizer as part of the model:</strong> fit it on training data only, tune each
          variant separately before comparing them, and read what fills the most common columns.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/first-look`, label: <>← First look at the posts</> }}
          next={{ href: `${R}/reading-the-weights`, label: <>Next up · Reading the weights →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
