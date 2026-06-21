import Link from "next/link";

export const metadata = {
  title: "Why predict at all? — Manifold",
  description: "Before any algorithm, there's a question worth sitting with: what does it even mean to predict something from data?",
};

export default function WhyPredictPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Beginner</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Why predict at all?
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Before any algorithm, there&rsquo;s a question worth sitting with: what does it actually
        mean to <em>predict</em> something from data?
      </p>

      <div className="lesson">
        <p>
          You already do this all the time. When you glance at storm clouds and decide to grab an
          umbrella, you&rsquo;re predicting. When a doctor looks at a patient&rsquo;s age and
          cholesterol and assesses their risk, that&rsquo;s prediction. When a bank decides whether
          to approve a loan, it&rsquo;s prediction. The question isn&rsquo;t <em>whether</em> to
          predict — it&rsquo;s whether to do it by gut or by math.
        </p>

        <h2>Patterns in, answers out</h2>
        <p>
          Here&rsquo;s the core observation: the world is not random noise. Things are connected.
          Houses with more rooms tend to cost more. Students who study longer tend to score higher.
          These patterns exist in the past, and if they&rsquo;re stable enough, we can use them to
          say something about the future.
        </p>
        <p>
          A machine learning model is simply a way of <strong>capturing a pattern in data and
          applying it to new cases</strong>. It learns the relationship between what we can
          measure (the <em>features</em>) and what we want to know (the <em>target</em>). Then,
          given a new case where we only have the features, it predicts the target.
        </p>

        {/* scatter illustration */}
        <svg viewBox="0 0 360 200" style={{ width: "100%", height: "auto", display: "block", margin: "1.2rem 0", borderRadius: 12, background: "var(--canvas)", border: "1px solid var(--border-strong)" }}>
          {/* past data */}
          {([
            [40, 155], [55, 140], [70, 128], [85, 118], [100, 108],
            [115, 100], [130, 92], [150, 82], [165, 76], [185, 65],
          ] as [number, number][]).map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={5} fill="var(--c-regression)" fillOpacity={0.8} />
          ))}
          {/* trend line */}
          <line x1={30} y1={162} x2={230} y2={56} stroke="var(--c-regression)" strokeWidth={1.8} strokeDasharray="5 3" strokeOpacity={0.5} />
          {/* future prediction points with ? */}
          {([
            [220, 45], [250, 32], [280, 20],
          ] as [number, number][]).map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={7} fill="var(--surface)" stroke="var(--c-regression)" strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="3 2" />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="var(--c-regression)" fillOpacity={0.7} fontWeight={600}>?</text>
            </g>
          ))}
          {/* divider */}
          <line x1={205} y1={10} x2={205} y2={190} stroke="var(--border)" strokeWidth={1} strokeDasharray="4 3" />
          <text x={110} y={190} textAnchor="middle" fontSize={10} fill="var(--faint)">past observations</text>
          <text x={270} y={190} textAnchor="middle" fontSize={10} fill="var(--c-regression)" fillOpacity={0.7}>new cases →?</text>
          <text x={18} y={192} fontSize={9} fill="var(--faint)">more →</text>
          <text x={18} y={16} fontSize={9} fill="var(--faint)">cost ↑</text>
        </svg>

        <p>
          The dots on the left are data we&rsquo;ve already seen — past sales, past patients, past
          loans. The question marks on the right are the cases we haven&rsquo;t seen yet. The line
          is our best guess at the pattern connecting them. That&rsquo;s the whole game.
        </p>

        <h2>Regression: predicting a number</h2>
        <p>
          Machine learning splits broadly into two families of prediction. <strong>Classification</strong>{" "}
          predicts a category: spam or not, cat or dog, approved or denied. <strong>Regression</strong>{" "}
          predicts a number: exactly how much will this house sell for? How many units will we ship
          next quarter? What will this patient&rsquo;s blood pressure be in six months?
        </p>
        <p>
          We&rsquo;re starting with regression — specifically, <strong>linear regression</strong> — because
          it&rsquo;s the simplest possible model that captures a real pattern. It&rsquo;s also the
          foundation almost every other algorithm builds on top of. Master this, and the rest starts
          clicking into place.
        </p>

        <h2>What makes it machine learning?</h2>
        <p>
          You could draw a line through data by hand. The &ldquo;machine&rdquo; part is that we let
          a computer find the line — and it does so systematically, by measuring how wrong any given
          line is and adjusting until it can&rsquo;t do better. That measurement of wrongness, and
          the process of minimising it, is the engine under all of modern ML. We&rsquo;ll build it
          up piece by piece over the next few pages.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The pattern that repeats
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Every supervised learning model is the same three-part recipe: a <strong>shape</strong>{" "}
            to fit (a line, a tree, a neural network…), a way to measure <strong>wrongness</strong>,
            and a method to <strong>minimise</strong> that wrongness. Linear regression is the
            simplest case of each, which is exactly why it&rsquo;s the right place to start.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/what-a-model-really-is" style={navLink}>
            Next up · What a model really is →
          </Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center",
    background: `color-mix(in srgb, ${color} 13%, var(--surface))`,
    color, fontSize: 12, padding: "3px 10px", borderRadius: 999,
  };
}

const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0",
};
