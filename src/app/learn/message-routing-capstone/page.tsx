import { Callout, PrevNext } from "@/components/lesson";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { Printout, RawPost, PartKey } from "@/components/capstone/newsreader";
import specimen from "@/data/routing/specimen.json";

export const metadata = {
  title: "Capstone: Message routing — Manifold",
  description:
    "A complete text-classification project on 18,846 real Usenet posts: build the router that files a new post in the right forum. A linear SVM scores 0.925 on a random split, and 0.824 on the posts the router would actually meet. The capstone works out why, builds an evaluation that predicts the future, and designs a system that routes what it is sure of and hands the rest to a person.",
};

const POST = "var(--c-post)";
const chip: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  borderRadius: 999,
  padding: "3px 10px",
};
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

export default function RoutingCapstoneHubPage() {
  return (
    <article>
      {/* ---------- the printout hero ---------- */}
      <Printout py={26}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ ...chip, color: "var(--nr-paper)", background: "var(--nr-accent)" }}>Capstone</span>
          <span style={{ ...chip, color: "var(--nr-ink-soft)", border: "1px solid var(--nr-rule)" }}>
            End-to-end · text classification
          </span>
        </div>
        <h1
          className="font-display"
          style={{ fontSize: "clamp(32px, 6.4vw, 46px)", lineHeight: 1.06, margin: "0 0 14px", maxWidth: 640, color: "var(--nr-ink)" }}
        >
          Which forum does this post <em>belong</em> in?
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 620, margin: 0, color: "var(--nr-ink-soft)" }}>
          In 1993, twenty Usenet forums took in thousands of posts, and some landed in the wrong place. We build the
          router that reads a new post and files it: one real dataset taken all the way, worked the way a data
          scientist works a text problem that will meet real traffic.
        </p>

        <div style={{ marginTop: 22, borderTop: "1px dashed var(--nr-rule)", paddingTop: 14 }}>
          <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 8 }}>
            test post 4,984 of 7,532 · filed in {specimen.forum} · a reply
          </div>
          <RawPost lines={specimen.lines} fontSize={11.5} />
          <PartKey />
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--nr-ink-soft)", margin: "12px 0 0", maxWidth: 640 }}>
            Read whole, the model files this reply correctly. But its score for {specimen.forum} comes almost entirely
            from the ringed words: a motorcycle club&rsquo;s membership number in the signature, the question the
            poster quoted, their name and their employer&rsquo;s server. Of the +1.435 that words contribute, the
            subject and the one line the poster actually wrote contribute +0.047.{" "}
            <strong style={{ color: "var(--nr-ink)" }}>
              Read the way a router reads a new post, subject and body only, it goes to sci.electronics, by 0.012.
            </strong>
          </p>
        </div>
      </Printout>

      {/* ---------- editorial body ---------- */}
      <div className="lesson" style={{ marginTop: 18 }}>
        <ModelAnatomy
          accent={POST}
          form={<>A linear classifier: one weight per word for each of the 20 forums (about 110,000 words), later joined by a pretrained sentence embedding. The forum with the highest score gets the post.</>}
          loss={<>Hinge loss to train. Judged on accuracy on <strong>new threads</strong>, and on how many of them it can file on its own at an accuracy it promised in advance.</>}
          optimiser={<>Before any fitting: decide which posts the model is for and what it may read, and lock an evaluation that predicts next month. Then climb, one justified rung at a time.</>}
        />

        <h2>The easy number, and the number the job gets</h2>
        <p>
          Train a linear SVM on a random split of the 18,846 posts, let it read every byte, and it scores{" "}
          <strong>0.925</strong> (0.921 to 0.928 over five random splits). It is a fine-looking number, and it
          does not survive contact with the job.
        </p>
        <p>
          Two things inflate it. Two-thirds of the posts are replies, and a reply goes wherever its thread already
          is: there is nothing to route. The job is the <em>new</em> threads. And a random split drops replies from
          one thread on both sides of the line, so the model is tested on conversations it has already read, by
          people it has already met. Train on the earlier posts, test on the later ones, score only the 2,527 new
          threads, and the same model scores <strong>0.824</strong>.
        </p>
        <p>
          Then comes the surprise. On those new threads, everything the model could read in the headers, the quotes
          and the signatures is worth nothing: the whole post scores 0.8239, the subject and body alone 0.8235. The
          names and servers it had learned were inflating exactly the posts that never needed a model.
        </p>

        <Callout color={POST} title={<>Where we end up</>}>
          Putting a pretrained sentence embedding beside the word counts lifts accuracy on new threads from{" "}
          <strong>0.824 to 0.860</strong>. A router that files only the posts it is sure of, with its threshold
          set on older posts to be 95% accurate, files <strong>81%</strong> of the new threads by itself, and on
          the later posts it delivers <strong>93.3%, not 95%</strong>. Why the promise slipped, and what a real
          system does about it, is most of the last act. By the end, the router routes <strong>0.881</strong> of the
          new threads right, files 80% of them by itself at 94.4%, and hands the rest to a moderator with three
          suggestions, the right forum among them 92.6% of the time.
        </Callout>

        <h2>The situations you will meet</h2>
        <p>
          Classifying 20 Newsgroups is a textbook exercise. Routing real posts is not, and the difference is what
          this capstone is about. Along the way you will meet, each one measured:
        </p>
        <ul style={ul}>
          <li><strong>Text instead of columns.</strong> Eleven thousand training posts become 110,000 features, most of them zero. Which models thrive there, and which drown?</li>
          <li><strong>A model that reads <em>who</em> instead of <em>what</em>.</strong> Read whole, it is right on 90.8% of later posts by people it met in training, and on 80.8% of posts by anyone new.</li>
          <li><strong>A mark left by the labelling process itself.</strong> One of the forums was moderated, and its moderator&rsquo;s server name turns up in 147 of that forum&rsquo;s 599 training posts, and in 1 of the other 10,715.</li>
          <li><strong>A balanced benchmark that is not balanced on the job.</strong> Among new threads, one forum sends 14.0% of the posts and another 1.1%.</li>
          <li><strong>A validation that flatters.</strong> Random 5-fold cross-validation overestimates the later posts by 7.1 points; grouping the folds by thread lands within 0.7.</li>
          <li><strong>The pretrained embedding question.</strong> A small embedding model loses to plain word counts on its own (0.783 against 0.824), a large one draws level with them (0.832, a difference 2,527 posts cannot settle), and either one placed beside the word counts beats both.</li>
          <li><strong>A system with a person in it,</strong> and a promise about accuracy that has to hold next month.</li>
          <li><strong>Labels that cost money,</strong> and forums, topics and vocabulary that change.</li>
        </ul>

        <h2>How this capstone teaches</h2>
        <p>
          This is not a recipe to copy. The aim is that you could be handed a pile of text from a field you know
          nothing about, with a job attached, and know how to think about it. So every page runs the same four beats:
        </p>
        <ol style={ul}>
          <li><strong>The question a data scientist asks</strong>, phrased for any project, before the posts come into it. It sits at the top of each page as the <em>Subject</em> of a post.</li>
          <li><strong>How you would find out</strong>: the reusable method, and why it works.</li>
          <li><strong>Do it here</strong>: you predict the outcome first, then see what the posts actually say.</li>
          <li><strong>Your turn</strong>: how would you catch this in support tickets, emails, reviews or medical notes?</li>
        </ol>
        <p>
          Each page adds one rule to a running <strong>Playbook</strong>, signed at the bottom of the page the way a
          Usenet post was signed. At the end you get the whole Playbook, a notebook that rebuilds the router from the
          raw posts, and two fresh text datasets to work through yourself before you see what the measurements found.
        </p>

        <h2>The arc</h2>
        <ol style={ul}>
          <li><strong>Frame the job</strong>: which posts the model is for, what a mistake costs, and how each byte of a post came to be there.</li>
          <li><strong>First contact</strong>: meet the posts, turn words into numbers, and read what the first model learned.</li>
          <li><strong>The leak audit</strong>: find every part of a post that gives the answer away, and measure what each is worth.</li>
          <li><strong>Lock the harness</strong>: a split that predicts the future, a metric on the right posts, and the baseline to beat.</li>
          <li><strong>Model, rung by rung</strong>: naive Bayes, logistic regression, the linear SVM, kernels and trees, better features, pretrained embeddings.</li>
          <li><strong>Build the system around it</strong>: read the errors, decide what to automate, budget the labels, and plan for a world that moves.</li>
          <li><strong>Conclude and transfer</strong>: the verdict, the Playbook, and two new datasets.</li>
        </ol>

        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Everything runs on your own machine: <code>fetch_20newsgroups</code> downloads the dataset (about 14 MB) once.
          Real posts are shown with personal details dotted out; every number comes from the unmodified data.
        </p>

        <PrevNext
          prev={{ href: "/learn/support-vector-machines/when-to-use-an-svm", label: <>← When to use an SVM</> }}
          next={{ href: "/learn/message-routing-capstone/the-job", label: <>Next up · What job is the model doing? →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
