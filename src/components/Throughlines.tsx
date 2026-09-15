import Link from "next/link";
import { FAMILIES, FOUNDATIONS } from "@/lib/siteMap";

// The paths between the families, stated.
//
// This replaced a node-and-arc diagram (CurriculumAtlas, removed 2026-09-15). The diagram drew
// these same seven connections as unlabelled curves between ten boxes — so the picture could show
// THAT two families were linked but never WHY, and every word of the actual content lived in the
// caption underneath it. It also re-listed the same ten families that the cards directly below it
// already list. A graphic whose entire payload is its own caption has not earned its ink (§12.2),
// so the payload is now the element: one line per link, each naming the idea that carries across.

const LINKS: [string, string, string][] = [
  ["Regression", "Classification", "the same linear model, squashed through a sigmoid"],
  ["Classification", "Trees & ensembles", "another way to carve up the same input space"],
  ["Classification", "Neural networks", "stack the perceptron and train the whole stack at once"],
  ["Classification", "Clustering", "the distance idea behind k-NN, with the labels taken away"],
  ["Clustering", "Dimensionality reduction", "both hunt for structure with nothing to predict"],
  ["Optimization", "Regression", "gradient descent is what actually fits the line"],
  ["Optimization", "Neural networks", "backpropagation is that same engine, chain-ruled"],
];

const COLOR: Record<string, string> = Object.fromEntries(
  [...FAMILIES, ...FOUNDATIONS].map((g) => [g.name, g.color]),
);
const HREF: Record<string, string | undefined> = Object.fromEntries(
  [...FAMILIES, ...FOUNDATIONS].map((g) => [g.name, g.tracks.find((t) => t.href)?.href]),
);

export function Throughlines() {
  return (
    <div className="throughlines">
      {LINKS.map(([a, b, why]) => (
        <div key={`${a}-${b}`} className="throughline">
          <span className="throughline-pair">
            <Family name={a} />
            <span className="throughline-arrow">→</span>
            <Family name={b} />
          </span>
          <span className="throughline-why">{why}</span>
        </div>
      ))}
    </div>
  );
}

function Family({ name }: { name: string }) {
  const href = HREF[name];
  const style = { color: COLOR[name] ?? "var(--ink)" };
  return href ? (
    <Link href={href} className="throughline-fam" style={style}>{name}</Link>
  ) : (
    <span className="throughline-fam" style={style}>{name}</span>
  );
}
