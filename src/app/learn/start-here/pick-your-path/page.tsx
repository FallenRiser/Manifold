import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-fundamentals)";

export const metadata = {
  title: "Pick your path — Manifold",
  description: "You know what ML is and how this site works. Here's where to go next, depending on what you're after.",
};

export default function PickYourPathPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Start here", color: ACCENT }]}
        time="about 3 minutes"
        title={<>Pick your path</>}
        intro={<>
          You&rsquo;ve met the big idea, the three families, and the three-part anatomy. Time to
          start a real track.
        </>}
      />

      <div className="lesson">
        <p>
          One honest recommendation before the options: if you&rsquo;re new,{" "}
          <strong>start with linear regression</strong> — and not because it&rsquo;s easy.
          It&rsquo;s the smallest model in which <em>every</em> big idea already appears: loss
          surfaces, gradient descent, overfitting, regularisation. Learn them where you can see
          them, and every later method becomes a variation on a theme you know.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "1.6rem 0" }}>
          <PathCard
            color="var(--c-regression)"
            title="The main road — predict a number"
            body={<>The core sequence. Linear regression from first principles, then regularisation
              (taming overfitting), then polynomial features (curves without giving up the machinery).</>}
            href="/learn/linear-regression"
            cta="Start linear regression"
          />
          <PathCard
            color="var(--c-clustering)"
            title="No labels — find the structure"
            body={<>The unsupervised route: k-means clustering, from the two-step dance of the
              algorithm to the honest question of whether your clusters are real.</>}
            href="/learn/k-means"
            cta="Start k-means"
          />
          <PathCard
            color="var(--c-metrics)"
            title="See the whole job, end to end"
            body={<>A senior-style walkthrough of one real dataset — exploration, cleaning, features,
              models, diagnosis — with every number reproducible from the shipped notebook. Best
              after the regression tracks, but skimmable any time you want to see where it all leads.</>}
            href="/learn/california-housing-capstone"
            cta="Preview the capstone"
          />
        </div>

        <p>
          Or browse <Link href="/map" style={{ color: "var(--brand)" }}>the full map</Link> —
          everything that&rsquo;s built, and everything that&rsquo;s coming, in one view.
        </p>

        <Quiz
          accent={ACCENT}
          title="Checkpoint — the whole onboarding in three questions"
          questions={[
            {
              q: "A model is trained on photos, each tagged by hand as \"contains a bird\" or \"no bird\". Which kind of learning, and which flavour?",
              options: ["Supervised classification", "Supervised regression", "Unsupervised clustering"],
              answer: 0,
              explain: "Answers came attached to the data (supervised), and the answer is a category, not a number (classification).",
            },
            {
              q: "Training a model means…",
              options: ["Storing the data so it can be looked up later", "Repeatedly adjusting the model to shrink a wrongness score", "Writing rules by hand until the output looks right"],
              answer: 1,
              explain: "The loop you ran in the first lab: propose, measure the loss, adjust, repeat. Storage isn't learning, and hand-written rules are exactly what ML replaces.",
            },
            {
              q: "Why does a model's error on its training data almost never reach zero?",
              options: ["Computers can't do exact arithmetic", "Real data has scatter that no reasonable rule can explain", "The optimiser always stops too early"],
              answer: 1,
              explain: "Two identical-sized houses still sell for different prices. A model that drove training error to zero would be memorising that noise — the overfitting story the regression track tells in full.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/start-here/how-to-read-this-site", label: <>← How to read this site</> }}
          next={{ href: "/learn/linear-regression/why-predict-at-all", label: <>Begin · Linear regression →</> }}
        />
      </div>
    </article>
  );
}

function PathCard({ color, title, body, href, cta }: {
  color: string; title: string; body: React.ReactNode; href: string; cta: string;
}) {
  return (
    <div style={{
      background: `color-mix(in srgb, ${color} 5%, var(--surface-2))`,
      border: `1px solid color-mix(in srgb, ${color} 20%, var(--border))`,
      borderRadius: 14,
      padding: "16px 18px",
    }}>
      <div className="font-display" style={{ fontSize: 15, fontWeight: 600, color, marginBottom: 6 }}>{title}</div>
      <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--muted)", lineHeight: 1.65 }}>{body}</p>
      <Link href={href} style={{ fontSize: 13.5, fontWeight: 550, color, textDecoration: "none" }}>
        {cta} →
      </Link>
    </div>
  );
}
