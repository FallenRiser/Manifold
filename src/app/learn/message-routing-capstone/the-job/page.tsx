import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { RouterFlow, ForumMix, fmt, share, rate } from "@/components/figures/routing/JobFigures";
import job from "@/data/routing/job.json";

export const metadata = {
  title: "What job is the model doing? — Manifold",
  description:
    "Before choosing a model, find the records it will actually decide. Two in three Usenet posts are replies that a thread lookup files at 98% with no model. The model's job is the new threads; a mistake on one is paid again by every reply it draws, and the traffic it sees is far from balanced.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const forsale = job.mix.find((m) => m.forum === "misc.forsale")!;
const atheism = job.mix.find((m) => m.forum === "alt.atheism")!;

const codeLookup = String.raw`import re
from collections import Counter, defaultdict
from sklearn.datasets import fetch_20newsgroups

earlier = fetch_20newsgroups(subset="train")   # posts before the cut-off date
later = fetch_20newsgroups(subset="test")      # posts after it

def subject(post):
    header = post.split("\n\n", 1)[0]
    for line in header.split("\n"):
        if line.lower().startswith("subject:"):
            return line.split(":", 1)[1].strip()
    return ""

def is_reply(post):
    return re.match(r"\s*re\s*:", subject(post), re.I) is not None

def thread(post):
    # the subject without any "Re:", "Fwd:" or "[tag]" in front of it
    return re.sub(r"^((re|fwd?)\s*:\s*|\[.*?\]\s*)+", "", subject(post).lower()).strip()

# the router's memory: every thread filed before the cut-off, and where it went
memory = defaultdict(Counter)
for post, forum in zip(earlier.data, earlier.target):
    memory[thread(post)][forum] += 1

replies = [(p, f) for p, f in zip(later.data, later.target) if is_reply(p)]
known = [(p, f) for p, f in replies if thread(p) in memory]
right = sum(memory[thread(p)].most_common(1)[0][0] == f for p, f in known)
print(len(replies), len(known), right / len(known))   # 5005 2330 0.975...`;

const outJob = `later posts 7532:  replies 5005 (0.664)   new threads 2527 (0.336)

a reply is filed wherever its thread already lives (thread = subject without 'Re:')
  thread filed before the cut-off         2330 replies   lookup right 0.9751
  thread opened by a later new post       1573 replies   lookup right 0.9917
  thread's first post not in the data     1102 replies   in 539 threads
  where the thread's forum is known       3903 replies   lookup right 0.9818
  its 71 misses sit in 23 threads that ran in more than one forum; the largest:
    'after 2000 years, can we say that christian morality is'
      talk.religion.misc 48, alt.atheism 34
    'waco burning'
      talk.politics.guns 9, talk.politics.misc 9

filed by the lookup, no model             4466 (0.593)
need the model: 2527 new threads
  + the first reply of each of the 539     3066 (0.407)`;

const outFollowers = `the model files each later new thread (router's view, linear SVM C=0.3)
  all 2527 new threads                   right 0.8235
  opened a thread that drew no reply     right 0.8148  (n=1836)
  opened a thread that drew replies      right 0.8462  (n=611)

their 1573 replies go wherever the model filed the thread
  replies in the right forum             0.7584  (380 in the wrong one)
  threads with a reply in the wrong one  93 of 593
  the 5 biggest of them carry            181 of the 380
    'challenge to microsoft supporters.'  69 replies
      a comp.os.ms-windows.misc thread, filed in comp.sys.mac.hardware
    'europe vs. muslim bosnians'  54 replies
      a talk.politics.mideast thread, filed in alt.atheism`;

export default function TheJobPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 1 · Frame the job", color: "var(--c-metrics)" }]}
        time="about 11 minutes"
        title={<>What job is the model doing?</>}
        intro={<>
          A dataset is a pile of labelled examples. A job is a process with a model somewhere inside it. Before
          choosing any model, trace the process: which records reach the model, what happens to its answer, and
          what a wrong answer costs. Here the answers change which posts we score, and what we count as success.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={1} article={2} total={27}>
          Which records will the model actually decide, what happens to its answer, and what does a wrong one cost?
        </ArticleOpener>

        <h2>Trace the process, not the dataset</h2>
        <p>
          The dataset hands you rows and labels, and it is tempting to score a model on all of them. But a model in
          production sits inside a workflow. Some records never reach it, because something cheaper already knows
          the answer. Some of its answers are acted on at once; others go to a person as a suggestion. And its
          mistakes cost different amounts depending on what happens next.
        </p>
        <p>So before any modelling, sketch the workflow and ask four things:</p>
        <ol style={ol}>
          <li><strong>Which records arrive, and which already have their answer?</strong> A lookup, a rule, or a label inherited from something earlier.</li>
          <li><strong>What happens to the model&rsquo;s answer?</strong> Is it acted on, or shown to a person?</li>
          <li><strong>What does a wrong answer cost,</strong> and does the cost stop at that one record?</li>
          <li><strong>So which records do we score, and by what number?</strong></li>
        </ol>

        <h2>A post arrives</h2>
        <p>
          In 1993 a Usenet post did one of two things: it opened a new thread, or it replied to one. A reply went,
          by default, wherever its thread already was, because the newsreader copied the parent&rsquo;s forum into
          the reply. So a reply&rsquo;s forum is settled by the thread it belongs to. To file it, a router does not
          need a model. It needs a memory of where each thread lives.
        </p>
        <p>How much of the traffic is that?</p>

        <GuessSlider
          accent={POST}
          prompt={<>Of the {fmt(job.posts)} posts in the later period, what percentage are replies to an existing thread?</>}
          min={0}
          max={100}
          step={1}
          start={30}
          decimals={1}
          actual={Number(((100 * job.replies) / job.posts).toFixed(1))}
          reveal={<>
            {fmt(job.replies)} of the {fmt(job.posts)} later posts have a subject that starts &ldquo;Re:&rdquo;. Two
            posts in every three arrive with their forum already decided.
          </>}
        />

        <p>
          A real newsreader links a reply to its parent through the Message-ID and References headers. This release
          of the data carries neither. What survives is the subject line: a reply keeps its thread&rsquo;s subject
          with &ldquo;Re:&rdquo; in front. So the router&rsquo;s memory is keyed by the subject with the
          &ldquo;Re:&rdquo; stripped. Here is the heart of it:
        </p>

        <CodeBlock fromScratch={codeLookup} />

        <p>and the full measurement, over every later reply:</p>
        <CodeOutput source="scripts/routing_cases.py">{outJob}</CodeOutput>

        <p>
          Replies to threads the router already knows go to the right forum {rate(job.lookup_right)} of the time,
          with no model. The misses come from how conversations work: 71 replies sit in 23 threads that ran in two
          forums at once. An argument over Christian morality ran in both talk.religion.misc and alt.atheism, and a
          thread titled &ldquo;waco burning&rdquo; split evenly between the gun forum and the general politics
          forum. A lookup returns one forum, so a conversation held in two will always cost it something.
        </p>
        <p>
          The third group matters most. {fmt(job.missing)} replies belong to {fmt(job.missing_threads)} threads
          whose opening post is not in the data: the collection missed it, or the thread changed its subject along
          the way. When the first of those replies arrives, the router has nothing to look up, so it has to be routed like a new post.
          The replies after it follow it.
        </p>

        <RouterFlow d={job} />

        <p>
          So the model&rsquo;s traffic is {fmt(job.model)} posts, {share(job.model, job.posts)} of what arrives:
          the {fmt(job.new)} new threads, plus one reply for each thread the router meets in the middle. From here
          on the model is scored on the new threads, {share(job.new, job.model, 0)} of its traffic and the posts
          this whole capstone is built around.
        </p>

        <Callout color={POST} title={<>The replies were never the model&rsquo;s job</>}>
          Scoring a model on every post, replies included, would credit it with work a lookup does at{" "}
          {rate(job.lookup_right)} with no model at all, and would blur how it does on the posts that actually
          need it.
        </Callout>

        <h2>A wrong route is paid more than once</h2>
        <p>
          A reply follows its thread, and that cuts both ways. If the router files a new thread in the wrong forum,
          the replies it draws follow it there, or never come, because the people who could have answered never
          saw it. A mistake on a new thread is not one mistake.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>
            The model files 82.4% of the later new threads in the right forum. Now count the replies those threads
            drew instead of the threads themselves. If every reply goes wherever the model filed its thread, what
            share of the replies land in the right forum?
          </>}
          options={[
            "About the same, around 82%",
            "More than 82%: threads that draw replies are clearer, so the model gets them right more often",
            "Fewer than 82%",
          ]}
          nudge="Locked in. Two effects pull in opposite directions here."
        />

        <CodeOutput source="scripts/routing_cases.py">{outFollowers}</CodeOutput>

        <p>
          Both effects are real. Threads that drew replies are a little easier: the model files 84.6% of them right,
          against 81.5% of the threads nobody answered. But the replies are not spread evenly. Count the replies
          instead of the threads and the model is right only 75.8% of the time, and 181 of the 380 misplaced
          replies come from just five threads. The biggest, &ldquo;challenge to microsoft supporters.&rdquo;, is a
          Windows thread with 69 replies that the model filed under Mac hardware.
        </p>
        <p>
          Had the model really misfiled those threads, the conversations would not have gone the same way; counting
          the replies measures what was at stake, not what would have happened. It is the usual shape of mistakes
          in a system with consequences: a few errors carry most of the cost, and average accuracy does not see
          them. Act 6 comes back to it when we read the errors.
        </p>

        <h2>What does a mistake cost, and who pays?</h2>
        <p>
          The data can tell us how often the router is wrong. It cannot tell us what a mistake costs. That comes
          from the people who run the forums, and it shapes the whole system. A new thread can end up in one of
          three places:
        </p>
        <ul style={ol}>
          <li><strong>Filed in the right forum.</strong> The post reaches the people who can answer it.</li>
          <li><strong>Filed in the wrong one.</strong> The people who could answer never see it, the forum it lands in gets a post it did not want, and its replies follow it. Someone moves it later, or the poster gives up.</li>
          <li><strong>Handed to a person.</strong> A moderator reads it and picks the forum, faster with three good suggestions. It costs their time, and the post waits.</li>
        </ul>
        <p>
          That trade decides the design. The router files a post itself only when it is sure, and hands the rest to
          a moderator with its three best guesses. How sure is sure enough is the operators&rsquo; call, not ours.
          We will take theirs to be <strong>95%</strong>: among the posts the router files by itself, no more than
          one in twenty goes to the wrong forum. And the threshold that delivers it has to be fixed before the posts
          it will judge arrive, which act 6 shows is harder than it sounds.
        </p>

        <h2>The model&rsquo;s traffic is not balanced</h2>
        <p>
          Choosing the right posts has one more consequence. The dataset was built to be close to even: every forum
          holds between {share(Math.min(...job.mix.map((m) => m.all)), job.posts)} and{" "}
          {share(Math.max(...job.mix.map((m) => m.all)), job.posts)} of the later posts.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Among the new threads alone, the posts the model is for, how even is it?</>}
          options={[
            "Still about 5% each",
            "Somewhat uneven, say 3% to 8%",
            "Very uneven: some forums over twice their share, others under a quarter of it",
          ]}
          nudge="Locked in. The figure has all twenty forums."
        />

        <ForumMix d={job} />

        <p>
          misc.forsale is {share(forsale.all, job.posts)} of the later posts but {share(forsale.new, job.new)} of
          the new threads, because {share(forsale.new, forsale.all)} of its posts open a thread of their own: they
          are mostly ads, and each ad starts a thread.
          alt.atheism is {share(atheism.all, job.posts)} of the posts and {share(atheism.new, job.new)} of the new
          threads: {share(atheism.all - atheism.new, atheism.all)} of its posts are replies in arguments already
          under way. The benchmark is balanced; the job is not. The forum that sells sends{" "}
          {Math.round(forsale.new / atheism.new)} times as many new threads as the forum that argues, and
          act 4 has to decide whether a mistake on each should count the same.
        </p>

        <h2>The job, written down</h2>
        <p>
          Written now, before there is a favourite model, and held for the rest of the capstone:
        </p>
        <dl style={spec}>
          {[
            ["Traffic", <>Posts that open a new thread, posted after the training data was collected: {fmt(job.new)} of the {fmt(job.posts)} later posts. Replies go to the thread lookup.</>],
            ["Reads", <>The subject and what the poster wrote. The header lines, quoted text and signature stay out until the leak audit in act 3 measures what each would add.</>],
            ["Answers", <>A forum, and how far it is ahead of the runner-up. Far enough ahead: filed. Otherwise a moderator gets the three best forums.</>],
            ["Scored by", <>Accuracy on the new threads, to compare models. For the system, the share of new threads filed automatically while their accuracy holds at 95%, with the threshold fixed on older posts. For the hand-off, how often the right forum is among the three suggestions.</>],
          ].map(([k, v]) => (
            <div key={k as string} style={{ display: "grid", gridTemplateColumns: "minmax(0, 6.5em) minmax(0, 1fr)", gap: "0 14px", padding: "9px 0", borderTop: "1px solid var(--border)" }}>
              <dt style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12, color: POST, paddingTop: 2 }}>{k}</dt>
              <dd style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>{v}</dd>
            </div>
          ))}
        </dl>

        <DecisionPoint
          accent={POST}
          question={<>The operators want one number at the top of your report. Which?</>}
          options={[
            {
              label: "Accuracy on every later post, reading the whole post: 0.862",
              verdict: "miss",
              response: <>It is the biggest number, and it answers the wrong question. Two-thirds of those posts
                are replies that the lookup files at {rate(job.lookup_right)} with no model. The number credits the
                model with work it will never do, and says little about the posts it will.</>,
            },
            {
              label: "Accuracy on the new threads: 0.824",
              verdict: "close",
              response: <>The right number for comparing two models, and the one the model ladder in act 5 uses.
                But operators do not live with accuracy. They live with how many posts get misfiled and how many
                land on a moderator&rsquo;s desk, and 0.824 tells them neither.</>,
            },
            {
              label: "The share of new threads filed automatically at the promised 95%, and the size of the moderators' queue",
              verdict: "best",
              response: <>The number the operators can plan around: how many posts arrive already filed, how often
                those are wrong, and how many a person has to read. It is also the hardest one to keep, because the
                promise is made on old posts and kept on new ones. Act 6 builds it.</>,
            },
          ]}
        />

        <Followup>
          Find the records in your own data that already have their answer: a follow-up email that joins an open
          ticket, a repeat order that ships the way the last one did, a lab result attached to an existing case.
          Count them, set them aside, and score the model on what is left. Then ask what follows a wrong answer. A
          misrouted ticket drags its follow-ups with it, and a few big cases may carry most of the cost.
        </Followup>

        <SigRule n={1}>
          <strong>Score the model on the records it will actually decide.</strong> First find what a lookup, a rule
          or an inherited label already settles and set it aside; then write down what the model&rsquo;s answer sets
          in motion, and what a wrong one costs.
        </SigRule>

        <PrevNext
          prev={{ href: R, label: <>← Overview &amp; goal</> }}
          next={{ href: `${R}/how-the-data-was-made`, label: <>Next up · How the data was made →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const spec: React.CSSProperties = { margin: "8px 0 18px", borderBottom: "1px solid var(--border)" };
