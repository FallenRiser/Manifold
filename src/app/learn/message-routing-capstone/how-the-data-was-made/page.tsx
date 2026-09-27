import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { PostLife } from "@/components/figures/routing/ProvenanceFigures";
import provenance from "@/data/routing/provenance.json";

export const metadata = {
  title: "How the data was made — Manifold",
  description:
    "The fastest way into an unfamiliar field: trace who or what wrote each part of a record, and when. Usenet's own 1987 standard, the dataset's documentation and the posts themselves, checked against each other, show which parts name the answer, which were written after the decision, and which describe the sender rather than the topic.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const outProvenance = `posts 18846: earlier 11314 (0.600), later 7532 (0.400)

headers the Usenet standard (RFC 1036) defines, and how many posts carry each
  required, still there  From 18846   Subject 18846
  required, in no post   Date   Newsgroups   Message-ID   Path
  optional, still there  Lines 18788   Organization 18066   Distribution 4159   Reply-To 2773
                         Keywords 1430   Summary 602   Expires 130
  optional, in no post   References   Followup-To   Approved   Xref
                         Sender   Control
  not in the standard    nntp-posting-host 8032   x-newsreader 1030   article-i.d. 791

dates inside quoted Message-IDs (the day a quoted post was written)
  earlier posts  2420 dates   Mar 1993   79   Apr 1993 2328   May 1993    0
                 April days: 10% by the 5, median the 15, 90% by the 20
  later posts    1646 dates   Mar 1993    3   Apr 1993 1488   May 1993  154
                 April days: 10% by the 19, median the 22, 90% by the 27

parts of the later posts          new threads     replies
  quote another post                  0.108       0.879
  carry an attribution line           0.066       0.817
  end in a signature                  0.271       0.385
  share of their lines quoted         0.033       0.409`;

const outSenders = `each field's value -> the forum it was seen in most before the cut-off

field               new threads, seen     right    the model on the same posts
From address         923 of 2527 (0.365)  0.8169   0.8527
  (before the cut-off, 7400 posts came from people who posted more than once;
   0.913 of those sit in their sender's usual forum)
Organization        1806 of 2527 (0.715)  0.3106   0.8256
NNTP-Posting-Host    696 of 2527 (0.275)  0.4353   0.8218`;

export default function HowTheDataWasMadePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 1 · Frame the job", color: "var(--c-metrics)" }]}
        time="about 12 minutes"
        title={<>How the data was made</>}
        intro={<>
          You do not need to know anything about 1993 Usenet to work on these posts. You do need to know how each
          part of a post came to be: who wrote it, when, and whether it would exist at the moment the router has to
          decide. That is the fastest way into any unfamiliar field, and it finds the traps before a model does.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={1} article={3} total={27}>
          Who or what wrote each part of a record, and when? Which parts will exist at the moment the model has to
          decide?
        </ArticleOpener>

        <h2>A record has more than one author</h2>
        <p>
          In a table it is easy to treat every column as a plain fact about the thing in the row. Text makes the
          truth harder to miss: one Usenet post was written by the person posting, by their software, by a server,
          by other people, and finally by whoever assembled the dataset, at different times and for different
          reasons. Each of those authors leaves something the model can learn from, and only some of it is about the
          topic.
        </p>
        <p>So for every part of a record, ask four things:</p>
        <ol style={ol}>
          <li><strong>Who or what wrote it?</strong> A person, their software, a system along the way, someone else, or the dataset&rsquo;s builder.</li>
          <li><strong>When,</strong> relative to the moment the model has to decide?</li>
          <li><strong>Is it in the data you have,</strong> and would it be there in production?</li>
          <li><strong>What does it tell you:</strong> the thing itself, the person behind it, or the answer?</li>
        </ol>
        <p>
          You answer them from three sources, in this order: the domain&rsquo;s own rulebook, the dataset&rsquo;s
          documentation, and the data itself, which checks the other two.
        </p>

        <h2>Source one: the domain&rsquo;s rulebook</h2>
        <p>
          Most fields have one: a standard, a form, a manual, an API schema. For Usenet it is RFC 1036, the 1987
          standard for Usenet messages. It is short, and it answers the first question for every header. A post is
          a block of header lines, a blank line, then the body. Six headers are required: From, Date, Newsgroups,
          Subject, Message-ID and Path. Reading who fills in each one:
        </p>
        <ul style={ol}>
          <li><strong>The poster</strong> writes the Subject and the body, and chooses the forum: the Newsgroups line.</li>
          <li><strong>Their newsreader and news server</strong> fill in From, the Date, a Message-ID that names the machine where the post entered the network, and on a reply, References: the Message-IDs of the posts it answers. The site adds an Organization line, which the standard says is there to help identify the person.</li>
          <li><strong>Servers</strong> add their names to Path as the post travels, and each one that files it adds Xref: the forum and the post&rsquo;s number there.</li>
          <li><strong>A moderator</strong>, in a moderated forum, adds an Approved line.</li>
        </ul>
        <p>
          Put those through the four questions and the traps show up before any data is loaded. Newsgroups is the
          label itself. Xref and Approved are written after the forum is chosen, and both name it. Path, in a
          moderated forum, starts at the moderator&rsquo;s own server, because the moderator is the one who posts
          it. From and Organization describe the
          person, not the topic.
        </p>

        <h2>Source two: what the builders did</h2>
        <p>
          The posts were collected in 1993, most likely by Ken Lang for a 1995 paper on filtering news; the
          dataset&rsquo;s maintainer, Jason Rennie, says so with a &ldquo;probably&rdquo;. The version this capstone
          uses is Rennie&rsquo;s &ldquo;bydate&rdquo; release. His documentation says it:
        </p>
        <ul style={ol}>
          <li>sorts the posts by date, and splits them 60% for training and 40% for testing, so the test posts are the later ones;</li>
          <li>drops cross-posts, so a post sent to two forums appears once;</li>
          <li>removes the headers that identify the forum: Xref, Newsgroups, Path, Followup-To and Date.</li>
        </ul>
        <p>
          One of his reasons for recommending it is that the train and test sets are separated in time, which is
          exactly what page 2 needed. And the documentation leaves one question open that matters for the labels: when a post was
          sent to two forums, which folder did it end up in? It does not say. So for some posts the label is
          &ldquo;one of the forums it was sent to&rdquo;. Write that on the list of things you do not know.
        </p>

        <h2>Source three: the data, checking both</h2>
        <p>
          Documentation describes what someone intended. The data shows what happened. Checking one against the
          other takes minutes:
        </p>

        <CodeOutput source="scripts/routing_cases.py">{outProvenance}</CodeOutput>

        <p>
          The five documented removals hold: none of the 18,846 posts carries Xref, Newsgroups, Path, Followup-To or
          Date. But three more are gone that the standard requires and the documentation never mentions:
          Message-ID on every post, References on every reply, and Approved on every post in the moderated forum.
          Each has a consequence. Without Message-ID and References, nothing links a reply to its parent, which is
          why page 2 had to find threads by their subject line. Without Approved, the moderated forum lost its most
          obvious mark, though act 3 finds another one it left behind.
        </p>
        <p>
          Removing the Date header did not remove time. A quoted Message-ID often begins with the day its post was
          written, and those dates tell the split&rsquo;s story. In the earlier posts, nine in ten quoted April
          dates fall by the 20th of April 1993, and none are from May. In the later posts, nine in ten fall on the
          19th or after, and 154 are from May. The documentation said the split was by date; the text agrees, and
          puts the cut-off around 20 April 1993.
        </p>
        <p>
          The body has more than one author too. On replies, other people&rsquo;s words are everywhere: 87.9% quote
          another post, and 40.9% of their lines are quotes. On new threads, the posts the router is for, they are
          rare: 10.8% quote anything, and quotes are 3.3% of their lines. Signatures are common on both (27.1% of new
          threads, 38.5% of replies), and a signature is about the sender, not the topic.
        </p>

        <h2>The life of a post</h2>
        <p>
          Put the three sources together and you have the record&rsquo;s whole history: each part, who wrote it,
          when, and what survived.
        </p>

        <PostLife d={provenance} />

        <p>
          Below the line is what was written after the router&rsquo;s decision, and two of those parts name the
          answer outright. The builders removed all of it, along with the Newsgroups line itself; without that,
          the job would be reading the answer off a header. Above the line, everything
          exists at posting time. That is the usual test for a leak, and everything above the line passes it. The
          question is whether passing is enough.
        </p>

        <h2>Who, not what</h2>
        <p>
          Take the From line. It is written by software, present on every post, and there when the post arrives.
          It names a person, and people have habits.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>
            Ignore the words entirely. For a new thread from someone who posted before the cut-off, file it in the
            forum they posted in most. How often is that right?
          </>}
          options={[
            "About a third of the time: people post all over",
            "About two-thirds of the time",
            "About as often as the model that reads the words",
          ]}
          nudge="Locked in. The same test for the Organization line and the posting machine is in the output too."
        />

        <CodeOutput source="scripts/routing_cases.py">{outSenders}</CodeOutput>

        <p>
          A name alone files 81.7% of those new threads correctly, close to the 85.3% the model gets on the same
          posts by reading them. Before the cut-off, 91.3% of the posts by people who posted more than once sat in
          their usual forum. The Organization line and the posting machine say much less (31.1% and 43.5%), because
          a university has people in every forum.
        </p>
        <p>
          But the name only works for people the router has met, and 63.5% of new threads come from someone it has
          not. A lookup on names has nothing to say about them, and a model that learns names alongside words
          favours the people it knows: the overview&rsquo;s model, reading whole posts, was right on 90.8% of later
          posts by senders it had met and on 80.8% of the rest.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>So do you let the router read the From line?</>}
          options={[
            {
              label: "Yes: it exists at posting time and it is accurate",
              verdict: "close",
              response: <>Both true, and in some systems it is exactly right to use: a support desk that knows a
                customer&rsquo;s account should route by it. But here it helps only the 36.5% of new threads from
                people seen before, and a model that leans on it will score well on familiar names while the
                strangers get less attention. That trade has to be measured, not assumed.</>,
            },
            {
              label: "Never: who sent a post should not decide where it goes",
              verdict: "miss",
              response: <>A rule, not a measurement. Who sent a record is often real, useful information, and
                refusing it on principle can throw away accuracy people would want. The problem is not that the
                field is about a person; it is that nobody has yet measured what it adds for the posters the router
                has never seen.</>,
            },
            {
              label: "Not yet: leave it out of the model, and measure what it adds for known and new senders separately",
              verdict: "best",
              response: <>That is the plan. The router reads the subject and the body, and act 3 audits every field
                that describes the sender: what it adds overall, what it adds for people seen before, and what it
                costs everyone else. A field comes back in only if it earns its place on both groups.</>,
            },
          ]}
        />

        <Callout color={POST} title={<>Available is not the same as safe</>}>
          &ldquo;Would this exist when the model decides?&rdquo; catches the fields written afterwards. It does not
          catch a field that is present, accurate and about the wrong thing. For that you need a second question:
          would this field mean the same for a record from someone, or something, the model has never seen?
        </Callout>

        <Followup>
          Pick one record type from your own work, a support ticket, an insurance claim, an order, and write its
          ledger: every field, who or what writes it, when, whether it exists at the moment of the decision, and
          whether it describes the thing, the person, or the answer. Then find the system&rsquo;s own rulebook, a
          form, a schema, a spec, and check the data against the ledger and the documentation. The fields that
          disagree are where the surprises are.
        </Followup>

        <SigRule n={2}>
          <strong>Trace every field to its author and its moment.</strong> Read the domain&rsquo;s rulebook and the
          dataset&rsquo;s documentation, then check both against the data. A field written after the decision is
          out; a field that describes who rather than what goes on the list to measure.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/the-job`, label: <>← What job is the model doing?</> }}
          next={{ href: `${R}/anatomy-of-a-post`, label: <>Next up · Anatomy of a post →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
