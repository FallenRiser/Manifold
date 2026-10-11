import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule, ROUTING_ACTS } from "@/components/capstone/newsreader";
import { Scorecard } from "@/components/capstone/PredictionRegister";
import WholeSystemLab from "@/components/labs/WholeSystemLab";
import { asset } from "@/lib/asset";

export const metadata = {
  title: "Verdict, playbook & notebook — Manifold",
  description:
    "The finished router, put back into the system it serves: next month, 92% of posts are placed without a person and 95% of those land in the right forum. The register settled, the 24-rule Playbook, and a notebook that rebuilds the router from the raw posts.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

const outSystem = `the 7532 later posts: replies to a thread the system knows go where the thread lives (the lookup, page
2); the router reads the 2527 new threads and the first reply of each of the 539 threads whose opener is
missing (the earliest by article number), and files those whose gap reaches its threshold (1.036)
                                   posts   right   filed  right among filed
  new threads                       2527  0.8809  0.797   0.9439
  first replies, opener missing      539  0.8961  0.835   0.9556

where each later post ends up, at the router's threshold (a person's placements counted right):
  filed by the lookup, right                      4249  0.564
  filed by the router, right                      2330  0.309
  given to a person                                603  0.080
  wrong: the router's own misfiles                 133  0.018
  wrong: replies that followed them                149  0.020
  wrong: replies in a thread held in two forums     68  0.009
placed without a person: 6929 of 7532 (0.920), right 0.9495 (0.9328-0.9627, threads resampled)
every later post, a person's placements counted right: 0.9535
(the router alone on every later post, replies included: 0.8979; on the replies the lookup files: 0.9077,
 the lookup 0.9514)

the same system at other thresholds:
  threshold              without a person   right      a person reads   replies that followed a misfile
  0 (file everything)    7532 (1.000)       0.9075     0 (0.000)        272
  0.5                    7220 (0.959)       0.9361     312 (0.041)      196
  1.036 (the router's)   6929 (0.920)       0.9495     603 (0.080)      149
  2                      6406 (0.851)       0.9727     1126 (0.149)     46
  3                      5930 (0.787)       0.9808     1602 (0.213)     6
  none filed             4466 (0.593)       0.9819     3066 (0.407)     0`;

// the router, rung by rung: accuracy on next month's new threads (the first row is the tutorial's test)
const LADDER: { what: React.ReactNode; v: string; page: string; href: string }[] = [
  { what: <>The tutorial&rsquo;s test: a linear SVM on a random split of all the posts</>, v: "0.925", page: "page 1", href: R },
  { what: <>The same SVM on the job: next month&rsquo;s new threads</>, v: "0.824", page: "page 1", href: R },
  { what: <>After the leak audit: subject and body, the moderator&rsquo;s notes and stray signatures out</>, v: "0.817", page: "page 10", href: `${R}/closing-the-channels` },
  { what: <>Complement naive Bayes, given its own best features</>, v: "0.822", page: "page 14", href: `${R}/naive-bayes` },
  { what: <>Reading all four (pairs, pieces, the subject, the quotes) and the sender&rsquo;s history</>, v: "0.856", page: "page 18", href: `${R}/better-features` },
  { what: <>With a pretrained sentence embedding beside the counts: the final router</>, v: "0.881", page: "page 19", href: `${R}/pretrained-embeddings` },
];

type Rule = { n: number; act: number; page: string; head: React.ReactNode; body: React.ReactNode };
const PLAYBOOK: Rule[] = [
  { n: 1, act: 1, page: "the-job",
    head: <>Score the model on the records it will actually decide.</>,
    body: <>First find what a lookup, a rule or an inherited label already settles and set it aside; then write down what the model&rsquo;s answer sets in motion, and what a wrong one costs.</> },
  { n: 2, act: 1, page: "how-the-data-was-made",
    head: <>Trace every field to its author and its moment.</>,
    body: <>Read the domain&rsquo;s rulebook and the dataset&rsquo;s documentation, then check both against the data. A field written after the decision is out; a field that describes who rather than what goes on the list to measure.</> },
  { n: 3, act: 1, page: "anatomy-of-a-post",
    head: <>Check the tool that cuts your records into parts, on a random sample, before trusting anything measured with it.</>,
    body: <>When a cut is uncertain, make the uncertain piece a part of its own instead of deleting it or leaving it hidden.</> },
  { n: 4, act: 1, page: "research-questions",
    head: <>Write each prediction down before you look: the decision it feeds, the result you expect, and the result that would prove it wrong.</>,
    body: <>Check first that your test set can resolve a difference that size.</> },
  { n: 5, act: 2, page: "first-look",
    head: <>Look for the records an average hides: the empty, the huge, the repeated and the contradictory.</>,
    body: <>Count each group, read some of it, and decide what to do with it by how the live system would meet it.</> },
  { n: 6, act: 2, page: "words-into-numbers",
    head: <>Treat the vectorizer as part of the model:</>,
    body: <>fit it on training data only, tune each variant separately before comparing them, and read what fills the most common columns.</> },
  { n: 7, act: 2, page: "reading-the-weights",
    head: <>Read the heaviest weights, and ask of each whether it is there because of what a record says or who produced it.</>,
    body: <>Then measure what it contributes on the job&rsquo;s records before acting on it.</> },
  { n: 8, act: 3, page: "the-moderators-fingerprint",
    head: <>List everyone who touches a record before it is saved with its label.</>,
    body: <>Anything written after the label was chosen comes out of the features, even when removing it moves no prediction, because it will never be there when the model runs.</> },
  { n: 9, act: 3, page: "closing-the-channels",
    head: <>Close each channel on its own and all together, on the records the model will meet, and split the result by the group the channel identifies.</>,
    body: <>An average of zero can be a gain for one group paid for by another.</> },
  { n: 10, act: 4, page: "the-split",
    head: <>Group validation folds by the unit that ties records together, score them on the records the model will face, and weight them to the mix it will face.</>,
    body: <>Check the result once against a later period before trusting it with choices.</> },
  { n: 11, act: 4, page: "the-metric",
    head: <>Rank by the count that matches one decision of the system, and report every group beside it with its interval.</>,
    body: <>Name the groups whose whole interval sits below the floor, on the harness and again on live traffic.</> },
  { n: 12, act: 4, page: "baselines",
    head: <>Score the cheapest honest alternative on the same harness: the majority of the right records, and the rule a team would ship without a model.</>,
    body: <>Keep both in every report, and check whether the rule beats the model on the records it is surest of.</> },
  { n: 13, act: 5, page: "naive-bayes",
    head: <>Compare each model at its own best features, and pay for the search.</>,
    body: <>Choose settings on some folds and score them on the others; a lead that survives that is a lead.</> },
  { n: 14, act: 5, page: "logistic-regression",
    head: <>Choose the model on what cannot be added later.</>,
    body: <>A probability can be fitted to any score that sorts the records well; a point of accuracy cannot.</> },
  { n: 15, act: 5, page: "linear-svm",
    head: <>Choose on the records the job sends the model.</>,
    body: <>A model that wins by remembering its training data wins only where the job repeats itself, and a random split rewards remembering.</> },
  { n: 16, act: 5, page: "kernels-and-trees",
    head: <>Bend the boundary only where the data has neighbours.</>,
    body: <>When a record&rsquo;s nearest neighbour is nearly as far away as a typical record, a kernel either stays straight or sees nothing, and a tree routes on the features a record lacks.</> },
  { n: 17, act: 5, page: "better-features",
    head: <>Split every gain by who it reaches.</>,
    body: <>A feature that adds a point overall can add six to the people the model already knows and take thirteen from the ones who change their habits; report the gain by group before you keep it.</> },
  { n: 18, act: 5, page: "pretrained-embeddings",
    head: <>Borrow knowledge where your data is thin.</>,
    body: <>A pretrained model adds most to the records your own data says least about, the short ones and the ones from strangers; measure it there, and keep what your own data knows beside it.</> },
  { n: 19, act: 5, page: "choosing-the-model",
    head: <>Break a tie on what the system depends on.</>,
    body: <>When two models score the same, choose on the groups you watch, the trust in their confidence and the cost to refit, and make a combination of the two show its gain next month before it earns a second model.</> },
  { n: 20, act: 6, page: "reading-the-errors",
    head: <>Read a random sample of the errors before you change anything.</>,
    body: <>Counts show where the mistakes go; only reading shows why. Label a random forty before you count them, and keep one label for your own pipeline.</> },
  { n: 21, act: 6, page: "automate-or-hand-off",
    head: <>Set a promise on your newest data, then keep checking it.</>,
    body: <>A threshold is a claim about next month. Folds that mix old and new data flatter it; the latest slice measures the drift, and a random check of what the threshold lets through tells you when it has moved.</> },
  { n: 22, act: 6, page: "the-label-budget",
    head: <>Measure a new class beside the old ones, and weight it.</>,
    body: <>A learning curve that cuts every class at once hides what one small class costs among big ones. Cut only the new class, give it an average class&rsquo;s pull, and read the examples before you multiply them.</> },
  { n: 23, act: 6, page: "when-the-world-changes",
    head: <>Confidence only ranks the classes you have.</>,
    body: <>A new class, or a subject that spreads into a second class, gets the old answer with full confidence. Catch it outside the model: hold the neighbours when a class opens, and watch every class on its own.</> },
  { n: 24, act: 7, page: "takeaways",
    head: <>Report what the whole system delivers on all of its traffic.</>,
    body: <>Count what it placed without a person and how often that was right, what it left for people, and the mistakes it copied: a misplaced record takes the records that follow it along.</> },
  { n: 25, act: 7, page: "transfer-near",
    head: <>Check that every class was collected and cleaned the same way.</>,
    body: <>When one class came from another source, or another hand cleaned it, the model learns the handling. Put back into one class what was taken out of it, and count how many of its records change sides.</> },
  { n: 26, act: 7, page: "transfer-far",
    head: <>Give every label its own decision.</>,
    body: <>When a record can carry many labels, each label is a yes or no with its own threshold, its own baseline and its own score. Report the rare ones by themselves, and where a label has too few examples to learn, let a rule a person can write stand in.</> },
];

const DEFEND: { q: string; a: React.ReactNode }[] = [
  {
    q: "Tutorials get 93% on this dataset. Why does your model get 88%?",
    a: <>Because it is graded on a different job. The same linear SVM scores 0.925 on a random split and 0.824 on the
      threads posted after its training data. A random split puts a thread&rsquo;s replies on both sides of the line,
      so the test grades the model on conversations it has already read. On the job, the final router routes 0.881 of
      next month&rsquo;s new threads right, and the system around it places 92% of all next month&rsquo;s posts without
      a person, 95% of them in the right forum.</>,
  },
  {
    q: "Headers and signatures make the model more accurate. Why take them out?",
    a: <>On the posts the router actually reads, they add nothing: 0.8239 for the whole post against 0.8235 for the
      subject and body. The header lines help senders the router has met by 3.58 points and cost new senders 0.87. On a
      random split, most of what the header lines, quotes and signatures are worth together comes from the quotes,
      which are the thread&rsquo;s own text. The moderator&rsquo;s notes came out for a different reason: they were
      written after the forum was chosen, so they are never there when a post arrives.</>,
  },
  {
    q: "You promise 95%. How do you know it holds next month?",
    a: <>Only by checking. A threshold set on the thread-grouped harness delivered 93.9% next month, and so did one
      set on folds grouped by sender. Set on each forum&rsquo;s latest quarter, it delivered 94.4%, with an interval
      that reaches 95%. Each month a person reads a random 300 of the filed posts, which measures the share right to
      within 2.5 points and says when the threshold has moved.</>,
  },
  {
    q: "Why naive Bayes, and not the SVM or something newer?",
    a: <>With the same features, history and embedding, the linear SVM is level with it: 0.08 points ahead on the
      harness and 0.44 behind next month, neither settled. Naive Bayes refits in 3.6 seconds against the SVM&rsquo;s
      133, which matters when a new forum&rsquo;s labels arrive in batches and the router is refitted after each one.
      The newer part is there too: the sentence embedding brings what a model trained on other text knows about
      language, beside what these posts know about their forums.</>,
  },
  {
    q: "A new forum opens tomorrow. What happens?",
    a: <>Left alone, the router files 37% of its threads without a person, three in four of them in a neighbouring
      forum, because its confidence only compares the forums it knows. Holding the new forum&rsquo;s family for a
      person cuts that to 9.1%, and the person reading those threads files the first posts the router needs. With
      about 80 of them, weighted to an average forum&rsquo;s pull, the router routes 73.7% of the forum&rsquo;s threads
      right and takes over.</>,
  },
  {
    q: "Wouldn't refitting on newer posts have fixed the Waco drift?",
    a: <>It did not. Refitted with half a month of newer posts, the router changed by an amount 1,261 threads cannot
      settle, and 10 of 18 talk.politics.misc threads about Waco still went to guns. The subject now belongs to two
      forums, and the text of a post does not say which one its sender chose. What caught it was watching each forum
      on its own.</>,
  },
];

const detailsBox: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", margin: "0 0 8px" };
const summaryRow: React.CSSProperties = { cursor: "pointer", fontWeight: 500, fontSize: 14.5, color: "var(--ink)" };

export default function TakeawaysPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 7 · Conclude & transfer", color: "var(--c-metrics)" }]}
        time="about 15 minutes"
        title={<>Verdict, playbook &amp; notebook</>}
        intro={<>
          A tutorial says 93%. The finished router routes 88.1% of next month&rsquo;s new threads right. This page puts
          it back into the system it was built for and asks what that system does with next month&rsquo;s posts. Then
          it settles the register, gathers the Playbook, and hands you a notebook that rebuilds the router from the raw
          posts.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={7} article={25} total={27}>
          What does the finished system deliver, and how would someone else check it?
        </ArticleOpener>

        <h2>The model&rsquo;s number</h2>
        <p>
          <Link href={R} style={link}>Page 1</Link> opened with two numbers for the same linear SVM: 0.925 on a random
          split, the test every tutorial runs, and 0.824 on the job it would actually do, routing the threads posted
          after its training data was collected. Everything since has worked on the second number:
        </p>

        <div style={{ display: "grid", gap: 4, margin: "14px 0 18px" }}>
          {LADDER.map((r, k) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 14px", alignItems: "baseline", padding: "7px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${k ? POST : "var(--border-strong)"}`, borderRadius: "0 8px 8px 0" }}>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: k ? "var(--ink)" : "var(--muted)" }}>
                {r.what} <Link href={r.href} style={{ ...mono, fontSize: 11, color: POST, whiteSpace: "nowrap" }}>{r.page}</Link>
              </span>
              <span style={{ ...mono, fontSize: 15, fontWeight: 600, color: k ? "var(--ink)" : "var(--muted)" }}>{r.v}</span>
            </div>
          ))}
        </div>

        <p>
          The audit cost the router seven tenths of a point and was kept anyway. The moderator&rsquo;s notes were
          written after each forum was chosen, so they are never there when a post arrives, and the stray signatures
          mostly name people the router has already met. The six points after it came from a model that counts better,
          from reading more of each post (pairs of words, pieces of words, the subject twice, the quotes), from the
          sender&rsquo;s history, and from a pretrained embedding that knows language the posts never taught it. Each
          step was chosen on the thread-grouped harness and checked against the later posts.
        </p>
        <p>
          But 0.881 is the model&rsquo;s number, and nobody runs a model on its own. On{" "}
          <Link href={`${R}/the-job`} style={link}>page 2</Link> the job turned out to be smaller than the pile of posts:
          two in three later posts are replies, and a lookup by subject files them without any model. The router reads
          what is left, files what it is sure of and hands the rest to a person. The number that matters at the end is
          what that whole system does with next month&rsquo;s posts.
        </p>

        <h2>The whole system, next month</h2>
        <p>
          Every later post takes one of three paths. A reply to a thread the system already knows goes where the thread
          lives. The router reads the new threads, and the first reply of each thread whose opening post is missing from
          the data, and files the ones whose gap reaches its threshold. Everything else goes to a person, whose placement
          is counted right here. The remaining replies follow their thread, wherever its first post was placed, which
          means a misfiled thread takes its replies with it.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Of next month&rsquo;s 7,532 posts, what share does the system place without a person, and how many of those land in the right forum?</>}
          options={["About 80%, at 94% right, like the router's new threads", "About 90%, at about 95% right", "Nearly all of them, at 98% right, like the lookup"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outSystem}</CodeOutput>

        <p>
          The system places 6,929 of the 7,532 posts without a person, 92.0%, and 94.95% of them land in the right
          forum. The interval, 93.3% to 96.3%, resamples whole threads, because the posts in one thread are right or
          wrong together. A person reads the other 603, 8.0% of the month: 514 new threads and 89 first replies. If the
          person places those right, 95.35% of all next month&rsquo;s posts end up in the right forum.
        </p>
        <p>
          That beats the tutorial&rsquo;s 0.925, and not because of the model. Reading every later post itself, the router
          would get 0.898. On the replies the lookup files it gets 0.908 against the lookup&rsquo;s 0.951. The system gets
          its number by never asking the model to do the lookup&rsquo;s job, and by letting it hand over what it is not
          sure of. The first replies it does read come out about as well as the new threads, 0.896 against 0.881.
        </p>
        <p>
          The 350 wrong placements have three causes. 133 are the router&rsquo;s own misfiles. 149 are replies that
          followed those misfiles into the wrong forum, so each misfiled thread costs about two posts, not one. The last
          68 are replies in threads that ran in two forums at once, which a lookup by subject cannot get right for both.
        </p>

        <h2>What a person&rsquo;s reading buys</h2>
        <p>
          The threshold decides how the work is split between the router and a person, and the bottom of the output
          shows the trade. File everything the router reads, and 697 posts land in the wrong forum, 272 of them replies
          that followed a misfile. Hand everything to a person, and the 81 left are the lookup&rsquo;s two-forum threads.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Raising the threshold from 1.04 to 2 nearly doubles what a person reads, from 603 posts to 1,126. What happens to the 350 wrong placements?</>}
          options={["A few dozen fewer", "About half of them go", "Nearly all of them go"]}
          nudge="Locked in. Try it in the lab."
        />

        <LabFrame
          accent={POST}
          tryThis={<>Start at the router&rsquo;s threshold. Slide left to file everything the router reads, and watch the replies that follow its misfiles grow. Then slide right past 2, and on until a person reads all 3,066 posts the router would.</>}
          insight={<>
            The first posts a person reads are the ones the router is least sure of, and each one saves more than half
            a wrong placement. Between 1.04 and 2, each saves a third of one. Past 2, a person reads 1,940 more posts to
            save 94 placements. Where to stop is a price: a person&rsquo;s minute against a misplaced post and the
            replies it takes with it.
          </>}
        >
          <WholeSystemLab />
        </LabFrame>

        <p>
          Half of them go: from 350 to 175. The first 603 posts a person reads remove 347 wrong placements, 0.58 for
          each post read; the next 523 remove 175, 0.33 each; reading the rest, 1,940 more posts, removes 94. Where to
          set the threshold is the operators&rsquo; call, made on what a misplaced thread costs against a
          moderator&rsquo;s time. The capstone set it from a promise: 95% right among the new threads the router files,
          on <Link href={`${R}/automate-or-hand-off`} style={link}>page 22</Link>, and the whole system comes out at
          about the same share. Three guards keep that true after launch: a random 300 filed posts read each month,
          the neighbours held for a person whenever a forum opens, and every forum watched on its own.
        </p>

        <h2>The register, settled</h2>
        <p>
          On <Link href={`${R}/research-questions`} style={link}>page 5</Link> the register wrote down seven
          predictions before act 2 looked at the posts, each with the result that would prove it wrong, and left one
          number open as an estimate. Here is how each came out, with your bets if you placed them in this browser.
        </p>

        <Scorecard />

        <p>
          Two confirmed, three wrong, two that the posts could not settle. The wrong ones changed the most. H3
          sent the audit after the quotes, which carried the thread&rsquo;s own text rather than anyone&rsquo;s name. H6
          moved the threshold onto each forum&rsquo;s latest posts. H7 added the family hold. Each was written so it
          could fail, and that is why each failure changed a decision.
        </p>

        <h2>The Playbook</h2>
        <p>
          Every page signed off with one rule. Here are all twenty-six, by act, each linked to the page that earned
          it; the last two come from the transfer tests that follow this page. None of them mentions Usenet: they are
          what to do with the next pile of text that comes with a job attached.
        </p>

        {ROUTING_ACTS.map((a) => {
          const rules = PLAYBOOK.filter((r) => r.act === a.n);
          return (
            <section key={a.n} aria-labelledby={`act-${a.n}`} style={{ margin: "0 0 14px" }}>
              <div id={`act-${a.n}`} style={{ ...mono, fontSize: 11.5, color: "var(--faint)", margin: "0 0 5px" }}>
                act {a.n} · {a.name.toLowerCase()}
              </div>
              <div style={{ display: "grid", gap: 5 }}>
                {rules.map((r) => (
                  <div key={r.n} style={{ display: "grid", gridTemplateColumns: "2.1em 1fr", gap: 8, alignItems: "baseline", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${POST}`, borderRadius: "0 10px 10px 0", padding: "8px 12px" }}>
                    <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: POST }}>#{r.n}</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--muted)" }}>
                      <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{r.head}</strong> {r.body}{" "}
                      {r.page !== "takeaways" && (
                        <Link href={`${R}/${r.page}`} style={{ ...mono, fontSize: 11, color: POST, whiteSpace: "nowrap" }}>p.&nbsp;{r.n + 1}</Link>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <h2 id="reproduce-it-yourself">Rebuild it: the notebook</h2>
        <p>
          The notebook rebuilds the router from the raw posts in one file you can run top to bottom: the posts cut into
          their parts, the lookup, the tutorial&rsquo;s number against the job&rsquo;s, the audited view, the
          thread-grouped harness, the final router, its threshold, the whole system on next month&rsquo;s posts, a forum
          left out (H7) and the label budget at 80 posts (E1). Each step says what it printed when the capstone ran it,
          so you can check every line against these pages.
        </p>
        <p>
          It needs scikit-learn, sentence-transformers and a GPU for the embedding. On Colab, pick a GPU runtime and run
          all; the posts download on the first run. On the machine that built the capstone, the embedding took about
          20 minutes and everything else about 10, and a second run reuses the saved embedding.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "0 0 1.4rem" }}>
          <a href={asset("/capstone/message-routing-capstone.ipynb")} download style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textDecoration: "none" }}>
            <span style={{ ...mono, fontSize: 13.5, fontWeight: 600, color: POST }}>&darr; message-routing-capstone.ipynb</span>
            <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>
              the router rebuilt from the raw posts, with the numbers each step printed here
            </span>
          </a>
        </div>

        <h2>Defend it</h2>
        <p>
          A result you cannot defend is a result someone else will take apart. These are the questions a sceptical
          reviewer asks about a text classifier like this one. Answer each out loud before you open it.
        </p>
        {DEFEND.map((d) => (
          <details key={d.q} style={detailsBox}>
            <summary style={summaryRow}>{d.q}</summary>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--muted)", padding: "8px 2px 4px" }}>{d.a}</div>
          </details>
        ))}

        <DecisionPoint
          accent={POST}
          question={<>The launch review wants one line on how well the router works. What do you write?</>}
          options={[
            {
              label: "It is 92.5% accurate, on a random split of the posts",
              verdict: "miss",
              response: <>That measures a job nobody has. A random split grades the router on threads whose replies it
                trained on; on next month&rsquo;s new threads the same SVM scores 0.824, and the review would be
                planning around a number the router never reaches.</>,
            },
            {
              label: "It routes 88.1% of next month's new threads to the right forum",
              verdict: "close",
              response: <>True, and the right population for the model. But it is the model&rsquo;s number. The system
                files three in five posts by lookup, hands 8% to a person, and copies each misfile into its replies, so
                the review learns neither how much work is left for people nor how many posts land wrong.</>,
            },
            {
              label: "Of the new threads it files by itself, 94.4% are right",
              verdict: "close",
              response: <>That is the promise the threshold was set for, measured next month, with an interval that
                reaches 95%. It leaves out the replies that follow each misfiled thread (149 of them), the
                lookup&rsquo;s own misses and the share of the month a person still reads.</>,
            },
            {
              label: "It places 92% of next month's posts without a person, 95% of them right, and leaves 8% for a person",
              verdict: "best",
              response: <>That is what the system delivers on all of its traffic: 6,929 posts placed at 94.95% (93.3% to
                96.3%), 603 for a person. Add the three guards that keep it true (a monthly random check, the family
                hold, each forum watched on its own) and the review can plan staff and trust the number next month.</>,
            },
          ]}
        />

        <Callout color={POST} title={<>Report the system, not the model</>}>
          A model&rsquo;s accuracy answers a question nobody operates: what happens when the model reads everything.
          The system around it reads less, hands some of it to people, and copies each mistake into whatever follows it.
          Report what the system does with all of its traffic: what it placed without a person, how often that was
          right, what it left for people, and the guards that keep those numbers true next month.
        </Callout>

        <Followup>
          Draw every path a record takes in a system you run, from arrival to its final place: rules, lookups, the
          model, a person. For each path, count next month&rsquo;s records and how many land right. Then find the records
          that inherit another record&rsquo;s decision (replies, follow-up tickets, linked orders) and count how many
          wrong placements they add to each mistake the model makes.
        </Followup>

        <SigRule n={24}>
          <strong>Report what the whole system delivers on all of its traffic.</strong> Count what it placed without a
          person and how often that was right, what it left for people, and the mistakes it copied: a misplaced record
          takes the records that follow it along.
        </SigRule>

        <p>
          Two pages remain. Each hands you a new text dataset with a job attached, one close to this one and one far
          from it, and asks you to run the Playbook on it before you see what the measurements found.
        </p>

        <PrevNext
          prev={{ href: `${R}/when-the-world-changes`, label: <>← When the world changes</> }}
          next={{ href: `${R}/transfer-near`, label: <>Transfer test I (near) →</> }}
        />
      </div>
    </article>
  );
}
