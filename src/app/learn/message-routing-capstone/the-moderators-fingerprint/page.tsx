import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule, Printout, RawPost, PartKey } from "@/components/capstone/newsreader";
import { Settled } from "@/components/capstone/PredictionRegister";
import { NoteShareTop } from "@/components/figures/routing/FingerprintFigures";
import NotesLab from "@/components/labs/NotesLab";
import fp from "@/data/routing/fingerprint.json";

export const metadata = {
  title: "The moderator's fingerprint — Manifold",
  description:
    "One forum's moderator wrote notes into the posts he approved, and his initials became one of its heaviest words. The notes move no route on the new threads. They move how sure the router is, and they can never be there when the router works.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const outFingerprint = `the moderator's server, athos.rutgers.edu, anywhere in the earlier posts:
  soc.religion.christian   147 of 599
  the other 19 forums      1 of 10715

the moderator's notes, bracketed blocks signed with his initials, in the body
(the part of the post the router's view reads)       earlier posts    later posts
  soc.religion.christian, posts with one                68 of  599      42 of  398
  the other 19 forums                                    0               0
  soc.religion.christian new threads with one           24 of  171      14 of  115
  in the earlier posts: 80 notes in 68 posts from 59 different senders; sent from the
  moderator's own address: 0. 17 more posts carry one after the poster's signature,
  and 11 quote one in a reply
  words inside notes: 10521 of the forum's 160984 words in the router's view (6.5%);
  a note runs to a median of 69 words, the longest 959
  earlier posts whose body holds some other bracketed block of 20+ characters: 416

soc.religion.christian's twenty heaviest words in the router's view (linear SVM, C=0.3):
  the initials rank 4 (weight 1.85); 80 of their 83 uses in the forum's earlier posts are
  inside a note, the rest are posters naming him. Of the other 19 words, none has more
  than 11% of its uses inside notes

a scan that knows nothing about moderators, on the earlier posts' router's view:
  words in 20+ posts, 95%+ of those posts in one forum: 158. The initials are one, used by
  61 different senders; 'bike', the most widely used, by 136
  the same 158 sorted by how often a word wears the same wrapping (the 2 characters before it,
  the 1 after): the initials rank 8, 97.6% of their uses wrapped '--' before and ']' after;
  the 7 above them come from 3 signatures typed without a '-- ' line (5 words) and 2
  subject lines repeated down their threads`;

const outNotesCost = `taking the notes out, the 2527 later new threads (linear SVM, C=0.3)
                                                   accuracy   routes changed
  as collected: notes in earlier and later posts     0.8235
  notes taken out of the later posts                 0.8235     1
  taken out of both                                  0.8231     4, 3 of them posts with no note
  both vs as collected: -0.04 points (95%: -0.16 to +0.08); right only without the notes:
  1 post, right only with them: 2
  the route that moves when the notes leave the later posts: post 6580, filed in
  soc.religion.christian, goes to talk.religion.misc instead of alt.atheism

the 14 later new threads with a note: routed right 13 with it, 13 without it
  margin over the runner-up: median 0.89 with the note, 0.71 without (all later new
  threads: 0.67); it falls by more than half in 3
  the moderator wrote more of the post than the poster did in 2 (59% and 73% of its words)`;

export default function ModeratorsFingerprintPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 3 · The leak audit", color: "var(--c-metrics)" }]}
        time="about 12 minutes"
        title={<>The moderator&rsquo;s fingerprint</>}
        intro={<>
          One of the twenty forums had a gatekeeper. Every post passed through one person before anyone could
          read it, and now and then he wrote in it. His words are in the data, inside the part of the post the
          router reads.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={3} article={9} total={27}>
          Who else wrote in these posts, and when did they write it?
        </ArticleOpener>

        <h2>Everyone who touches a record</h2>
        <p>
          Page 3 asked who writes each header line, and found two that are written after the forum is chosen:
          Xref and Approved. The body deserves the same question. A post is written by its sender, but a post to
          a moderated forum passes through one more pair of hands before anyone reads it. soc.religion.christian&rsquo;s
          moderator read every submission, posted the ones he accepted from his own server, and could change them
          on the way.
        </p>
        <p>
          Page 8 left a suspect in that forum&rsquo;s list: three letters, c&bull;&bull;, the fourth-heaviest word
          the router&rsquo;s view has for soc.religion.christian, and in none of the posts that carry it the
          sender&rsquo;s own. H2 in the register bet that the moderator had written into the bodies. Here is a
          later post with those letters in it.
        </p>

        <figure style={{ margin: "22px 0 6px" }}>
          <Printout py={12}>
            <RawPost lines={fp.specimen.lines} />
            <PartKey parts={["meta", "subject", "body"]} pen="not written by the poster" />
          </Printout>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 8 }}>
            A later new thread in soc.religion.christian, printed as it was collected, with personal details
            masked. The router&rsquo;s view reads the subject and everything below the header lines, the last two
            lines included.
          </figcaption>
        </figure>

        <p>
          The poster asks a question and signs off with a motto and a username. Then a bracketed note arrives in
          a different voice, addressed to the whole forum and signed &ldquo;--c&bull;&bull;&rdquo;. It asks
          readers to answer by email: a decision about the forum&rsquo;s traffic, made by the person who runs it.
        </p>

        <h2>Who wrote the notes</h2>
        <p>
          A bracketed block signed with those initials is easy to find with a pattern, so the rest is counting.
        </p>

        <CodeOutput source="scripts/routing_cases.py">{outFingerprint}</CodeOutput>

        <p>The notes are the moderator&rsquo;s, and the counts say why.</p>
        <ul style={ol}>
          <li><strong>Only his forum.</strong> 68 of soc.religion.christian&rsquo;s 599 earlier posts carry one in the body; none of the other 10,715 do.</li>
          <li><strong>Many senders, never the sender.</strong> The 68 posts come from 59 different people, and none from the moderator&rsquo;s own address.</li>
          <li><strong>After the signature.</strong> 17 more posts carry a note below the poster&rsquo;s &ldquo;--&nbsp;&rdquo; line, where a poster has already finished.</li>
          <li><strong>The voice.</strong> The notes decide what the forum carries. One tells a poster that Islam has its own newsgroup, one lets a post crossposted from alt.sex through while declining to carry the discussion, one says a recurring topic is allowed only now and then.</li>
        </ul>
        <p>
          They are not a word or two. A note runs to a median of 69 words and up to 959, and together they make
          up 6.5% of everything the router&rsquo;s view reads in that forum&rsquo;s earlier posts. 80 of the
          initials&rsquo; 83 uses sit inside a note; in the other three, a poster names him.
        </p>

        <h2>Could a scan have found it?</h2>
        <p>
          Page 8 found the initials by reading the weights. A check that knows nothing about moderators would be
          worth more, because it can run on the next dataset too. The obvious one fails. Count the words that stay
          in one forum while many different people use them, and the initials are one of 158, used by 61 senders,
          beside topic words like bike, used by 136. To a count, a mark written into many people&rsquo;s posts
          looks exactly like a topic.
        </p>
        <p>
          What gives it away is its form. A topic word turns up in every kind of sentence. A mark made by habit
          arrives the same way every time: 97.6% of the initials&rsquo; uses have &ldquo;--&rdquo; in front and
          &ldquo;]&rdquo; behind. Sort the 158 by how often a word wears the same wrapping, and the initials come
          8th. The seven above them are pasted text too: three signatures typed without a &ldquo;--&nbsp;&rdquo;
          line, and two subject lines repeated down their threads. The scan makes a short list; reading it is
          still the job.
        </p>

        <h2>What the notes are worth</h2>
        <p>
          The notes can never reach a live router. The moderator writes them after the post has been sent to his
          forum, and the router&rsquo;s job is to choose the forum. So the fair test takes them out of the later
          posts, and then out of the training posts as well.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>
            Fourteen later new threads in soc.religion.christian carry a note. Take the notes out, the way the
            router would receive those posts. How many of the fourteen does the router stop routing right?
          </>}
          options={["None of them", "A few", "Most of them"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outNotesCost}</CodeOutput>

        <p>
          None. The router files 13 of the fourteen right with the note and the same 13 without it. The one it
          gets wrong is the post crossposted from alt.sex: with its note it goes to alt.atheism, without it to
          talk.religion.misc. One route moves, from one wrong forum to another, and accuracy on the 2,527 does not
          move at all.
        </p>
        <p>
          Retraining without the notes as well moves four routes. 0.8235 becomes 0.8231, one post, and the
          interval cannot tell that from zero. Three of the four posts never carried a note; they moved because
          every weight shifts a little when 68 training posts change.
        </p>
        <p>
          What the notes do change is how sure the router is. Page 6 measured that as the margin: how far the
          winning forum&rsquo;s score is ahead of the runner-up. With their notes, the fourteen have a median
          margin of 0.89, well above the 0.67 of the later new threads as a whole. Without them it is 0.71, and in
          three posts the margin falls by more than half.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Open &ldquo;25 words or less&hellip;&rdquo; and &ldquo;HAROLD CAMPING&rdquo;, two short posts with short notes. Then &ldquo;Islam = Satanic ???&rdquo;, where the moderator wrote most of the post.</>}
          insight={<>
            No post changes forum; the margin is what moves, and the size of the post matters more than the size
            of the note. Four words from the moderator take almost half the margin off a 55-word post. His
            492-word reply to &ldquo;Islam = Satanic ???&rdquo; takes off a sixth, because the poster&rsquo;s own
            words already say where the post belongs.
          </>}
        >
          <NotesLab />
        </LabFrame>

        <p>
          No route moved because the notes sit in posts that already say what they are about. A question
          about baptism, Mary or a Christian book is routed to soc.religion.christian by its own words; the
          moderator&rsquo;s reply on top only makes the router surer. That is also why it matters. Act 6 decides
          which posts to file without a person by how sure the router is, and certainty that leans on words
          written after the decision promises more than the router can keep.
        </p>

        <h2>The register: H2</h2>
        <Settled id="H2">
          The initials rank 4th of soc.religion.christian&rsquo;s twenty heaviest words in the router&rsquo;s
          view, and 80 of their 83 uses in the forum&rsquo;s earlier posts sit inside the moderator&rsquo;s notes.
          The other nineteen words are the posters&rsquo;: none has more than 11% of its uses inside a note. The
          moderator&rsquo;s words reach the body, and one of them is among the twenty.
        </Settled>

        <NoteShareTop top={fp.top} forum={fp.forum} />

        <Callout color={POST} title={<>The moderator was routing too</>}>
          Read the notes and a second router appears. One sends a poster to the newsgroup for Islam, one lets a
          post from alt.sex through but not the discussion behind it, one admits a recurring topic only now and
          then. In this forum the label is one person&rsquo;s decision about what belongs, and the router is being
          trained to copy it. The post from alt.sex, the one of the fourteen the router cannot place, is in the
          forum because he let it in.
        </Callout>

        <DecisionPoint
          accent={POST}
          question={<>The notes move no route. What goes into the router&rsquo;s view from here on?</>}
          options={[
            {
              label: "Keep them: they cost nothing",
              verdict: "miss",
              response: <>They cost nothing on these 2,527 posts, but they can never be there when the router
                works: the moderator writes them after the forum has been chosen. A model trained on them puts
                weight on a word it will never be shown, and they inflate the very certainty act 6 will automate on.</>,
            },
            {
              label: "Cut every bracketed block",
              verdict: "close",
              response: <>It catches the notes, and the posters&rsquo; own words in 416 other earlier posts with
                them: people bracket asides, citations and edits too. Remove what the moderator wrote, not what
                looks like it.</>,
            },
            {
              label: "Cut the signed notes, from the training posts and the later ones",
              verdict: "best",
              response: <>The pattern is narrow: it takes 80 of the initials&rsquo; 83 uses and leaves the three
                where a poster names him. And the reason to cut is when the text was written, not what it costs:
                anything added after the label was chosen is the label.</>,
            },
          ]}
        />

        <p>
          So the notes come out. Taken out of the later posts they turn no right route wrong and no wrong one
          right, so the router&rsquo;s 0.8235 is already what it scores on posts that never carried one. The
          router&rsquo;s view itself is settled once, at the end of this act, together with page 4&rsquo;s tail,
          and page 10 re-measures under it.
        </p>

        <Followup>
          Draw the life of one of your records, from the moment it is created to the moment it is saved with its
          label, and name every person and system that touches it on the way: the agent who moves a ticket to
          Billing and leaves a note, the nurse who triages a referral, the reviewer who approves a claim, the
          script that stamps a queue name. Anything written after the label was chosen is the label speaking. Find
          it by where it sits and how it is wrapped, and take it out, even when taking it out moves no prediction.
        </Followup>

        <SigRule n={8}>
          <strong>List everyone who touches a record before it is saved with its label.</strong> Anything written
          after the label was chosen comes out of the features, even when removing it moves no prediction, because
          it will never be there when the model runs.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/reading-the-weights`, label: <>← Reading the weights</> }}
          next={{ href: `${R}/closing-the-channels`, label: <>Next up · Closing the channels →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
