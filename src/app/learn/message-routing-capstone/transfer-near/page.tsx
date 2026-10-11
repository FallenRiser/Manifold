import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import SpamFolderLab from "@/components/labs/SpamFolderLab";

export const metadata = {
  title: "Transfer test I (near): a spam folder for text messages — Manifold",
  description:
    "The Playbook on a new text dataset: 5,574 text messages, 13% spam. The filter that wins the benchmark sends 58% of real messages to the spam folder once they carry a phone number, because the collectors removed the numbers from the real messages only.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.75 };

const outSms = `messages 5574: real 4827, spam 747 (0.134)
where they came from (the collection's readme): spam from a UK complaints forum (425) and an earlier spam
corpus (322); real messages from a corpus of Singapore university students' texts (3375), a UK thesis (450)
and the earlier corpus (1002). No dates and no senders.

copies: 403 messages repeat an earlier one word for word; with digits, case and spacing ignored, 5140 distinct
  spam with a copy 229 of 747 (0.307), real 505 of 4827 (0.105); copies with both labels: 0
the collectors' placeholders, where they took something out: real 236, spam 0
  &lt;#&gt; 276, &lt;DECIMAL&gt; 23, &lt;TIME&gt; 7, &lt;URL&gt; 3, &lt;EMAIL&gt; 1
a run of five or more digits: real 3 (0.0006), spam 585 (0.783)
a pound sign: real 5 (0.0010), spam 253 (0.339)
median length: real 52 characters, spam 149

the heaviest words, linear SVM on the words (the mean of five folds):
  real: me, can, gt, my, lt, ok, liked, ll, yup, fullonsms, at, place, that, later, home, he
  spam: txt, uk, 150p, claim, www, text, service, mobile, 50, ringtone, stop, call, reply, http, chat, com
the rule a team would ship: spam when a message holds a run of five or more digits. It catches 0.783 of
the spam and sends 3 real messages (0.0006) to the spam folder`;

const outSmsFilter = `five folds, copies kept together; each filter's threshold sends at most 1 real message in 200 (0.5%) to
the spam folder. Then the real messages are scored again with a phone number, a web link or a sum in
pounds added to each.
                     accuracy  spam caught at 0.5%   real messages sent to the folder once they carry
                     (at 0)    random  copies kept  a phone number  a web link  a pound amount
  words              0.9846    0.942   0.936        0.006           0.823       0.002
  pieces of words    0.9898    0.971   0.969        0.577           0.714       0.008
  bge-large          0.9871    0.941   0.940        0.209           0.107       0.134
  words, scrubbed    0.9883    0.942   0.942        0.064           0.151       0.006
  pieces, scrubbed   0.9891    0.967   0.959        0.106           0.117       0.031
the additions: ' Call me on 07700 900123.' (a range the UK regulator keeps for drama), ' It's on
www.bbc.co.uk/news' and ' That's [pound sign]15 each.' 'scrubbed': every link, then every number, replaced
in both classes the way the collectors replaced them in the real messages`;

const CARD: [string, React.ReactNode][] = [
  ["Dataset:", <>SMS Spam Collection v.1 (Almeida and G&oacute;mez Hidalgo, 2011), UCI Machine Learning Repository</>],
  ["Messages:", <>5,574 text messages in English, 747 of them spam (13.4%)</>],
  ["Spam from:", <>a UK forum where people posted the spam they received (425), and an earlier spam corpus (322)</>],
  ["Real from:", <>a corpus volunteered by students at the National University of Singapore (3,375), a UK PhD thesis (450), and the earlier corpus (1,002)</>],
  ["Dates:", <>none, and no senders: the messages are in no particular order</>],
];

const CARRIED: { rule: number; what: string; here: React.ReactNode }[] = [
  { rule: 1, what: "the records it decides", here: <>Every message: there is no lookup to take some away. The decision is a folder the customer rarely opens, so the promise is on the real messages.</> },
  { rule: 8, what: "who handled a record before its label", here: <>The collectors, who took numbers, times and links out of the real messages only. The same mistake as the moderator&rsquo;s notes, on a whole class instead of a forum.</> },
  { rule: 7, what: "the heaviest weights", here: <><span style={mono}>gt</span> and <span style={mono}>lt</span> for real messages, <span style={mono}>uk</span> and <span style={mono}>150p</span> for spam: where the messages were collected, not what they say.</> },
  { rule: 10, what: "group by the unit that ties records", here: <>Copies of one campaign: grouping them costs at most 0.8 points here. There are no dates, so the check against a later period cannot be made, and a report has to say so.</> },
  { rule: 12, what: "the rule a team would ship", here: <>A run of five digits catches 78.3% of spam and blocks 3 real messages. The filters catch 15 to 19 points more, allowed to block up to 24.</> },
  { rule: 17, what: "split every gain by who it reaches", here: <>Pieces of words add 3.3 points of spam caught, paid for by real messages that carry a number or a link.</> },
  { rule: 18, what: "borrow knowledge where data is thin", here: <>The embedding knows language, but it learns its decision from the same labels, and learned the same shortcut.</> },
];

export default function TransferNearPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 7 · Conclude & transfer", color: "var(--c-metrics)" }]}
        time="about 14 minutes"
        title={<>Transfer test I (near): a spam folder for text messages</>}
        intro={<>
          A new dataset, close to the old one: short English texts, two classes instead of twenty. Run the Playbook on it
          before you read the measurements. Most of the rules carry over, and one trap from act 3 is waiting in a new
          place.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={7} article={26} total={27}>
          Which of the rules still apply when the job changes only a little?
        </ArticleOpener>

        <div style={{ margin: "0 0 20px", padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${POST}`, borderRadius: "0 12px 12px 0", display: "grid", gap: 4 }}>
          {CARD.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexWrap: "wrap", gap: "0 10px", fontSize: 13.5, lineHeight: 1.55 }}>
              <span style={{ ...mono, fontSize: 12.5, color: POST, width: 92, flexShrink: 0 }}>{k}</span>
              <span style={{ color: "var(--ink)", flex: "1 1 240px", minWidth: 0 }}>{v}</span>
            </div>
          ))}
        </div>

        <h2>The job</h2>
        <p>
          A mobile network wants a filter that sends spam to a folder its customers rarely open. The two mistakes are not
          alike. A spam that gets through is a nuisance; a real message in the folder is a missed appointment, a missed
          code from the bank, a friend who thinks they were ignored. So the promise is about the real messages: at most 1
          in 200 goes to the folder. The filter is scored by the share of spam it catches within that budget.
        </p>
        <p>
          Accuracy is the wrong yardstick here. A filter that lets everything through is 86.6% accurate, and every filter
          below scores about 98.5%, which says nothing about the folder.
        </p>

        <h2>Your turn first</h2>
        <p>
          Before reading on, answer these in writing. Each is a Playbook rule pointed at the new data; the number after it
          is the rule.
        </p>
        <ol style={ol}>
          <li><strong>What does the filter decide, and what does each mistake cost?</strong> <span style={mono}>#1</span></li>
          <li><strong>Who wrote each message, and who handled it before it was saved with its label?</strong> Read the collection&rsquo;s readme. <span style={mono}>#2, #8</span></li>
          <li><strong>What does an average hide here?</strong> Copies, empties, contradictions. <span style={mono}>#5</span></li>
          <li><strong>What ties messages together, and is there a later period to check against?</strong> <span style={mono}>#10</span></li>
          <li><strong>What would a team ship without a model?</strong> <span style={mono}>#12</span></li>
          <li><strong>What do the heaviest weights read: what a message says, or where it came from?</strong> <span style={mono}>#7</span></li>
          <li><strong>On which messages should the threshold be set?</strong> <span style={mono}>#21</span></li>
        </ol>

        <h2>Who made these messages</h2>
        <p>
          The readme answers half of question 2 before any code runs. The two classes come from different places. The
          spam was copied from a UK forum where people complained about the spam they received, plus an earlier spam
          corpus. Most of the real messages were volunteered by students at the National University of Singapore for a
          corpus that would be made public. The other half of the question is in the messages themselves.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Two of the heaviest words for real messages, in a linear SVM on the words, are <span style={mono}>gt</span> and <span style={mono}>lt</span>. What are they?</>}
          options={["Texting shorthand, for 'got' and 'lot'", "The ends of a placeholder the collectors put where they took out a number", "Greater-than and less-than signs people type"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outSms}</CodeOutput>

        <p>
          <span style={mono}>gt</span> and <span style={mono}>lt</span> are what is left of{" "}
          <span style={mono}>&amp;lt;#&amp;gt;</span>, the escaped form of <span style={mono}>&lt;#&gt;</span>: a
          placeholder the collectors put wherever they took a number out of a real message. 236 real messages carry one,
          and no spam does. The collectors also took out times, links and email addresses. So in this collection a real
          message almost never holds a phone number (3 of 4,827 have a run of five digits), while nearly four spam
          messages in five do. Not because people never text a number, but because the numbers were taken out of one
          class only. It is <Link href={`${R}/the-moderators-fingerprint`} style={link}>page 9</Link>&rsquo;s moderator
          again: someone handled the records before they were saved with their labels, and only one class passed through
          their hands.
        </p>
        <p>
          The rest of the list. 403 messages repeat an earlier one word for word, mostly spam campaigns: 30.7% of spam has
          a copy, against 10.5% of real messages, and no copy carries both labels. The heaviest spam words mix what spam
          says (<span style={mono}>claim</span>, <span style={mono}>ringtone</span>, <span style={mono}>reply</span>) with
          where this spam was collected (<span style={mono}>uk</span>, and <span style={mono}>150p</span>, a UK price per
          message). And the rule a team would ship without a model, &ldquo;a run of five or more digits means
          spam&rdquo;, catches 78.3% of it while blocking 3 real messages. A filter has to beat that at the same budget.
        </p>

        <h2>A test the benchmark never runs</h2>
        <p>
          Three filters, each at its default settings, on five folds with a campaign&rsquo;s copies kept together: a
          linear SVM on the words, one on pieces of words (as on{" "}
          <Link href={`${R}/better-features`} style={link}>page 18</Link>), and a logistic regression on the bge-large
          embedding (<Link href={`${R}/pretrained-embeddings`} style={link}>page 19</Link>). Each one&rsquo;s threshold
          sends 1 real message in 200 to the folder. Then a stress test: the real messages are scored again with the
          kinds of thing the collectors removed added to each one: a phone number from a range the UK regulator keeps
          for drama, a web link, a sum in pounds.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>The filter on pieces of words catches 96.9% of the spam while sending 1 real message in 200 to the folder. Add a phone number to every real message. How many go to the folder now?</>}
          options={["Still about 1 in 200", "About 1 in 20", "More than half"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outSmsFilter}</CodeOutput>

        <p>
          On the collection&rsquo;s own terms the pieces win: 96.9% of spam caught within the budget, against 93.6% for
          the words and 94.0% for the embedding, at an accuracy of 98.98%. Keeping copies together barely moves it, by 0.2
          points for the pieces and 0.6 for the words. The stress test reverses the order. With a phone number added, the
          pieces filter sends 57.7% of real messages to the spam folder, and with a web link, 71.4%. The word filter shrugs
          at the number, because whole numbers like <span style={mono}>07700</span> were never in its vocabulary, but sends
          82.3% of the messages with a link, because <span style={mono}>www</span>, <span style={mono}>uk</span> and{" "}
          <span style={mono}>co</span> were learned as spam. The embedding, which learned language from other text, still
          sends 20.9% of them with a number and 13.4% with a sum in pounds: it learned its decision from the same labels.
        </p>
        <p>
          Scrubbing both classes the way the collectors scrubbed the real ones closes most of the gap. The scrubbed pieces
          filter still catches 95.9% of spam, and sends 10.6%, 11.7% and 3.1% of the stressed real messages to the
          folder. The worst of those is still more than twenty times the budget, and what is left is a question the
          collection cannot answer: how often your customers&rsquo; real messages carry a number or a link. Only their
          messages can.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start on pieces of words at 1 in 200, and read the bars. Switch to words, then bge-large, and watch which addition each one punishes. Then try the two scrubbed filters, and loosen the budget toward 1 in 50.</>}
          insight={<>
            Every filter catches 93% or more of the spam, and every one sends some kind of ordinary real message to the
            folder far more often than the budget allows. Each learned a different trace of how the collectors handled the
            real messages. Scrubbing both classes the same way brings the worst bar down from more than half to between
            one in seven and one in ten, still far above the budget.
          </>}
        >
          <SpamFolderLab />
        </LabFrame>

        <h2>What carried over</h2>
        <p>
          Most of the Playbook ran unchanged, and the rules that mattered most were the ones about where the records came
          from. Compare these with what you wrote down.
        </p>
        <div style={{ display: "grid", gap: 5, margin: "0 0 18px" }}>
          {CARRIED.map((c) => (
            <div key={c.rule} style={{ display: "grid", gridTemplateColumns: "2.4em 1fr", gap: 8, alignItems: "baseline", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${POST}`, borderRadius: "0 10px 10px 0", padding: "8px 12px" }}>
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: POST }}>#{c.rule}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--muted)" }}>
                <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{c.what}.</strong> {c.here}
              </span>
            </div>
          ))}
        </div>

        <DecisionPoint
          accent={POST}
          question={<>A UK network wants a spam folder next month, built on this collection. What do you tell them first?</>}
          options={[
            {
              label: "Ship the pieces filter: it catches the most spam at the budget",
              verdict: "miss",
              response: <>It wins on the collection&rsquo;s own messages, and sends 57.7% of real messages with a phone
                number to the folder, 71.4% with a link. The collection could not show it, because its real messages had
                their numbers and links taken out.</>,
            },
            {
              label: "Ship the word filter: it barely reacts to phone numbers",
              verdict: "miss",
              response: <>It reacts to links instead: 82.3% of real messages with one go to the folder. Its evidence for a
                real message includes the collectors&rsquo; placeholder, and its evidence for spam includes the word
                &ldquo;uk&rdquo;, which every one of the network&rsquo;s customers is likely to write.</>,
            },
            {
              label: "Scrub both classes the same way, then ship the scrubbed pieces filter",
              verdict: "close",
              response: <>The right repair, and it closes most of the gap: 95.9% of spam caught, and about 1 in 10 stressed
                real messages to the folder instead of more than half. But that is still twenty times the budget, and the
                budget was measured mostly on Singapore students&rsquo; messages, not the network&rsquo;s
                customers&rsquo;.</>,
            },
            {
              label: "Scrub both classes, then measure the folder on a sample of the network's own real messages and set the threshold there",
              verdict: "best",
              response: <>The promise is about the customers&rsquo; real messages, so it has to be set on them, as page 22
                set the router&rsquo;s threshold on its newest posts. The collection can train the filter; only the
                network&rsquo;s own messages can say how often a real one carries a number or a link, and how many of
                those the filter would hide.</>,
            },
          ]}
        />

        <Callout color={POST} title={<>The model learns how each class was collected</>}>
          When two classes come from different places, or one was cleaned by hands the other never passed through, a model
          rewards whatever differs between the two piles, and the difference in handling is often the easiest thing to
          find. Benchmarks rarely test for it, because the benchmark&rsquo;s own test split was handled the same way.
          Put back into one class what the cleaning took out of it, and see whether its records change sides.
        </Callout>

        <Followup>
          Take a classifier whose classes were gathered separately: complaints from one system and praise from another,
          fraud cases from an investigations team and normal cases from the main database. List what each source does to a
          record before it is saved: what it removes, what it adds, what format it writes. Then add one source&rsquo;s
          traces to the other&rsquo;s records and count how many change class.
        </Followup>

        <SigRule n={25}>
          <strong>Check that every class was collected and cleaned the same way.</strong> When one class came from another
          source, or another hand cleaned it, the model learns the handling. Put back into one class what was taken out of
          it, and count how many of its records change sides.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/takeaways`, label: <>← Verdict, playbook &amp; notebook</> }}
          next={{ href: `${R}/transfer-far`, label: <>Transfer test II (far) →</> }}
        />
      </div>
    </article>
  );
}
