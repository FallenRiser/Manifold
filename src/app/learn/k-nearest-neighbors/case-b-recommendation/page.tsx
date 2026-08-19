import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Case B: recommendation & collaborative filtering — Manifold",
  description:
    "The original recommender was k-NN. 'Users like you also liked…' is a nearest-neighbour vote over a ratings matrix. Here's user-based collaborative filtering, run for real, beating the baseline by 13%.",
};

export default function CaseBRecommendationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Regression", color: "var(--c-regression)" }, { label: "Case study", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Case B: recommendation &amp; collaborative filtering</>}
        intro={<>
          &ldquo;Customers who bought this also bought…&rdquo; is, underneath, k-NN. Collaborative filtering finds
        users (or items) most similar to you and lets them vote on what you&rsquo;ll like — the nearest-neighbour
        rule pointed at a ratings matrix.
        </>}
      />

      <div className="lesson">
        <h2>The task: fill in the blanks of a ratings matrix</h2>
        <p>
          You have a big, mostly-empty matrix: rows are users, columns are items, and the few filled cells are
          ratings. The goal is to predict the empty ones — how would this user rate an item they haven&rsquo;t seen?
          <strong> User-based collaborative filtering</strong> answers it with k-NN: find the users most similar
          to the target, and predict a similarity-weighted average of <em>their</em> ratings for that item.
        </p>

        <h2>Similarity, then a weighted vote</h2>
        <p>
          Two design choices make it work. First, measure user similarity with <strong>cosine on
          mean-centred ratings</strong> — centring each user by their own average cancels out &ldquo;harsh
          rater vs. generous rater&rdquo; bias, and cosine ignores how many items each has rated. Second, predict
          by adding a weighted deviation back onto the target user&rsquo;s mean:
        </p>
        <MathBlock>{String.raw`\hat{r}_{u,i} = \bar{r}_u + \frac{\sum_{v \in N_k(u)} \text{sim}(u,v)\,(r_{v,i} - \bar{r}_v)}{\sum_{v \in N_k(u)} |\text{sim}(u,v)|}`}</MathBlock>
        <p>
          That is exactly <em>distance-weighted k-NN regression</em> from earlier in the track — the neighbours
          are similar users, the target is a rating, and closer (more similar) users count more.
        </p>

        <h2>A real run</h2>
        <p>
          On a synthetic ratings matrix built from latent taste factors — 200 users, 60 items, ~3,000 observed
          ratings — with a fifth of the observed ratings held out for testing, the code and its actual output are
          below:
        </p>
        <CodeBlock fromScratch={codeB} />
        <CodeOutput label="output">{outputB}</CodeOutput>
        <p>
          User-based k-NN CF reaches <strong>RMSE 1.139</strong> against a <strong>1.306</strong> global-mean
          baseline — a <strong>12.7% improvement</strong> from doing nothing but averaging over similar users.
          (The data is synthetic so the pipeline is honest and reproducible; the number that matters is the{" "}
          <em>relative</em> lift over the baseline, which is what a recommender is judged on.)
        </p>

        <h2>User-based vs. item-based</h2>
        <p>
          The identical machinery runs the other way: <strong>item-based CF</strong> finds items similar to ones
          you already rated and predicts from those. In practice item-based is often preferred — items are more
          stable than users&rsquo; tastes, there are usually fewer of them, and item–item similarities can be
          precomputed offline, making serving fast. Same k-NN idea, transposed matrix.
        </p>

        <Callout color="var(--c-classification)" title={<>Where neighbour-based CF runs out of road</>}>
          Two hard limits. <strong>Sparsity &amp; cold-start</strong>: a brand-new user or item has no ratings, so
            it has no neighbours — k-NN simply can&rsquo;t score it. <strong>Scale</strong>: millions of users make
            all-pairs similarity infeasible. The modern answer keeps the spirit and changes the representation —
            learn dense <em>embeddings</em> (matrix factorization, two-tower models) for users and items, then run{" "}
            <Link href="/learn/k-nearest-neighbors/approximate-nearest-neighbors" style={inlineLink}>approximate
            nearest-neighbour</Link> search over those vectors. It&rsquo;s k-NN all the way down, just over learned
            features instead of raw ratings.
        </Callout>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "User-based collaborative filtering predicts a rating by…",
              options: ["A similarity-weighted average of similar users' ratings for that item", "The item's overall average rating", "Training a neural network per user"],
              answer: 0,
              explain: "It's distance-weighted k-NN regression: the k most similar users vote on the rating, weighted by similarity — 'users like you also liked…'.",
            },
            {
              q: "Why centre each user's ratings before computing cosine similarity?",
              options: ["To cancel out harsh-vs-generous rater bias, so similarity reflects taste not scale", "To make the matrix denser", "Because cosine requires positive values"],
              answer: 0,
              explain: "Subtracting each user's mean removes their personal baseline, so two users count as similar when their relative preferences agree, regardless of how high they rate overall.",
            },
            {
              q: "What breaks neighbour-based CF, pushing systems toward learned embeddings + ANN?",
              options: ["Cold-start (no ratings → no neighbours) and scale (all-pairs similarity is infeasible)", "It's too accurate", "It can't handle numeric ratings"],
              answer: 0,
              explain: "New users/items have no neighbours, and millions of users make exact similarity intractable. Embeddings + approximate k-NN keep the idea while fixing both.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/case-a-digit-recognition", label: <>← Case A: digit recognition</> }} next={{ href: "/learn/k-nearest-neighbors/case-c-similarity-and-anomaly", label: <>Next up · Case C: similarity search &amp; anomaly →</> }} />
      </div>
    </article>
  );
}

const codeB = `import numpy as np

# R: users x items ratings matrix, NaN where unobserved (train split only)
user_mean = np.nanmean(R, axis=1)
Rc = np.nan_to_num(R - user_mean[:, None])          # mean-centred, 0 where missing

# cosine similarity between every pair of users
norm = np.linalg.norm(Rc, axis=1)
sim = (Rc @ Rc.T) / (np.outer(norm, norm) + 1e-9)
np.fill_diagonal(sim, 0.0)

def predict(u, i, k=20):
    rated = np.where(~np.isnan(R[:, i]))[0]          # users who rated item i
    top = rated[np.argsort(sim[u, rated])[::-1][:k]] # u's k most similar among them
    w = sim[u, top]
    return user_mean[u] + (w * Rc[top, i]).sum() / (np.abs(w).sum() + 1e-9)`;

const outputB = `users=200  items=60  observed=2981  test-ratings=596
global-mean baseline RMSE: 1.3059
user-based k-NN CF (k=20) RMSE: 1.1394
improvement over baseline: 12.7%`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
