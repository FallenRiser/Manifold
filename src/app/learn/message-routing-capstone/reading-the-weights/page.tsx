import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { ScoreParts } from "@/components/figures/routing/WeightFigures";
import WeightsLab from "@/components/labs/WeightsLab";
import wt from "@/data/routing/weights.json";

export const metadata = {
  title: "Reading the weights — Manifold",
  description:
    "A linear model's weights can be read as a list, forum by forum. The model that reads whole posts leans on people's names and servers, and on replies more than half of its decision comes from outside the poster's own words. The router's view is nearly clean; the names it keeps are sign-offs.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const pct = (x: number) => Math.round(100 * x) + "%";
const P = wt.parts;

const outWeights = `the whole post (linear SVM, C=0.3): the ten heaviest words of each of the 20 forums, 200 words
  a private person's name, username or initials             19
  occur mostly in header lines, quotes or signatures         26
  either                                                     29
  in most of their posts, the sender's own name or address    9
  more than half their posts from a single sender             8
  the winning forum's score from words, by the part of the post they came from
  later posts     subject+body  header lines    quotes   signature
  new threads            0.838         0.111     0.029       0.022
  replies                0.470         0.108     0.367       0.055

the router's view (linear SVM, C=0.3): the ten heaviest words of each of the 20 forums, 200 words
  a private person's name, username or initials              6
  occur mostly in header lines, quotes or signatures          2
  either                                                      6
  in most of their posts, the sender's own name or address    4
  more than half their posts from a single sender             6
  on the later new threads, the sender's own name or address inside the subject and
  body gives 1.8% of the winning score from words

the router's view keeps a first name among alt.atheism's heaviest words (masked on the page):
  in the subject or body of 114 earlier posts (67 of them in alt.atheism); the sender has that
  name in 69 of them, and in the other 45 someone else is writing to or about them`;

export default function ReadingTheWeightsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 2 · First contact", color: "var(--c-metrics)" }]}
        time="about 12 minutes"
        title={<>Reading the weights</>}
        intro={<>
          A linear model can be read. For every forum it keeps one weight per word, and the heaviest words are the
          ones that pull a post towards that forum. Reading them is the cheapest audit there is, and the first
          model has a story in them.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={2} article={8} total={27}>
          What did the model actually learn, and is it about the topic or about who is talking?
        </ArticleOpener>

        <h2>One weight per word per forum</h2>
        <p>
          The linear SVM learns twenty lists of 109,888 weights, one list per forum. A post&rsquo;s score for a
          forum is the sum, over its words, of each word&rsquo;s weight times its TF-IDF value from page 7, and
          the highest score wins. So a forum&rsquo;s heaviest words are the ones that pull hardest towards it.
        </p>
        <p>
          Reading the list is quick. Reading it well means asking one question of every word: is it there because
          of what posts in this forum are about, or because of who writes them? Two measurements answer that
          without guessing.
        </p>
        <ul style={ol}>
          <li><strong>Where the word lives.</strong> Across all the earlier posts, which part of a post holds most of its occurrences: the header lines, the subject and body, quoted text, or the signature.</li>
          <li><strong>Whose word it is.</strong> In how many of the posts that contain it the word is also in the post&rsquo;s own From line: the sender&rsquo;s own name or address.</li>
        </ul>
        <p>
          A third check needs a person: which of the heaviest words are a private person&rsquo;s name. That list
          was read by hand and is kept in the script. On this page those names are masked, first letter kept.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>
            Take the model that reads whole posts, the one behind the 0.925 on page 1. Of its 200 heaviest words,
            ten per forum, how many name a private person or live mostly outside the subject and body?
          </>}
          options={["Hardly any: under 10", "Some: 20 to 40", "Most of them"]}
          nudge="Locked in. The first block of the output counts them."
        />

        <CodeOutput source="scripts/routing_cases.py">{outWeights}</CodeOutput>

        <h2>The model that reads everything</h2>
        <p>
          29 of its 200 heaviest words fail the question. 19 are private people, posters whose names turn up in
          From lines, in quotes and in sign-offs. Most of the other ten are machines and organisations that live
          in header lines and quoted text. Three of soc.religion.christian&rsquo;s twelve are the moderated forum&rsquo;s servers,
          which page 3 traced into its posts. In talk.politics.misc, six of the ten heaviest words live mostly in
          quotes: the forum&rsquo;s regulars and their machines, quoted in reply after reply.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Open talk.politics.misc with the whole post, then switch to the router&rsquo;s view. Then try alt.atheism.</>}
          insight={<>
            In talk.politics.misc the quoted names give way to what the forum argues about: clinton, gay, tax,
            homosexuals. alt.atheism is the exception: five of its twelve heaviest words in the router&rsquo;s view
            are still people&rsquo;s names, and four of them are, in most of their posts, the sender&rsquo;s own.
          </>}
        >
          <WeightsLab />
        </LabFrame>

        <p>
          A heavy weight is only a possibility; what matters is how much it decides. Credit each word&rsquo;s share
          of the winning score to the part of the post it came from, and sum over the later posts. On replies,{" "}
          {pct(1 - P.replies.content)} of the whole-post model&rsquo;s decision comes from outside the poster&rsquo;s
          own words, {pct(P.replies.quotes)} from quoted text alone. On new threads, the posts the router is for,
          it is {pct(1 - P["new threads"].content)}.
        </p>

        <ScoreParts parts={P} />

        <p>
          That is page 1&rsquo;s surprise, seen from inside the model. The names and servers do most of their work
          on replies, which a thread lookup files anyway, and that is why dropping them costs nothing on the new
          threads.
        </p>

        <h2>The router&rsquo;s view</h2>
        <p>
          Reading only the subject and body, 6 of the 200 heaviest words are a private person&rsquo;s name. They
          are not all the same kind of name.
        </p>
        <ul style={ol}>
          <li><strong>The sender&rsquo;s own.</strong> Four, all in alt.atheism, are in most of their posts the name of the person who wrote the post: a sign-off typed at the bottom without a &ldquo;--&nbsp;&rdquo; line, which is page 4&rsquo;s tail. The first name k&bull;&bull;&bull;&bull; is in the subject or body of 114 earlier posts, and in 69 of them the sender carries that name.</li>
          <li><strong>The person discussed.</strong> Someone other posters write to or about. That is part of what a forum is about, much as rushdie and koresh are.</li>
          <li><strong>Neither.</strong> soc.religion.christian&rsquo;s list holds c&bull;&bull;, and in none of the posts containing it is it the sender&rsquo;s own. Someone other than the sender wrote it into the body. Page 9 finds out who; it is H2 in the register.</li>
        </ul>
        <p>
          On the later new threads, the sender&rsquo;s own name or address inside the subject and body supplies{" "}
          {(100 * wt.own_share).toFixed(1)}% of the winning score. It is small, and it is not zero.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>The router&rsquo;s view still weights a few names, most of them posters signing their own posts. What do you do?</>}
          options={[
            {
              label: "Put every name on a stop list",
              verdict: "miss",
              response: <>It removes the people being discussed along with the people signing: a forum&rsquo;s
                arguments about a named person are its content. And a stop list of names is a list of people that
                never ends; the next poster brings a new one.</>,
            },
            {
              label: "Leave them: 1.8% of the score is noise",
              verdict: "close",
              response: <>It is small on average, but an average over all senders hides who it helps. A sign-off
                only means something for a sender the router has already met, and page 4 found the tail worth 1.6
                points for them and 0.25 for everyone else. That is worth measuring before calling it harmless.</>,
            },
            {
              label: "Separate the sender from the subject, and audit the sender's channel in act 3",
              verdict: "best",
              response: <>The sender&rsquo;s own name inside the body arrives through the tail, which page 4 made a
                part of its own. Act 3 measures that part beside the header lines, quotes and signatures, for
                familiar and new senders separately, and decides on evidence.</>,
            },
          ]}
        />

        <Callout color={POST} title={<>A weight is not a use</>}>
          The whole-post model&rsquo;s weights are full of names, yet on the new threads everything outside the
          subject and body carries {pct(1 - P["new threads"].content)} of its decisions, and the router&rsquo;s view
          does as well without any of it (page 1). Read the weights to find suspects. Then measure what each one contributes on the records the
          model is for before acting on it.
        </Callout>

        <Followup>
          List the heaviest features of your own model, class by class. For each, ask where it lives in the record
          and whose it is: a customer ID, an agent&rsquo;s sign-off, a template&rsquo;s boilerplate, a
          department&rsquo;s letterhead. Then weigh the suspects by their contribution on the records the model
          will actually meet, not by the size of their coefficients.
        </Followup>

        <SigRule n={7}>
          <strong>Read the heaviest weights, and ask of each whether it is there because of what a record says or
          who produced it.</strong> Then measure what it contributes on the job&rsquo;s records before acting on
          it.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/words-into-numbers`, label: <>← Words into numbers</> }}
          next={{ href: `${R}/the-moderators-fingerprint`, label: <>Next up · The moderator&rsquo;s fingerprint →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
