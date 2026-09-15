import { XAVIER_VS_HE } from "./data";

// Gradient ratio (last layer / first layer) at initialisation, for each
// activation under each of the two named schemes. From scripts/init_norm_cases.py
// section 3: 10 layers of width 64.
//
// The figure exists because the table it replaces has one entry six orders of
// magnitude larger than the others, and a reader scanning a column of decimals
// does not feel that. On a log axis, sigmoid's bar runs off toward the right
// while tanh's and ReLU's sit on top of 1 — and the ordering flips between the
// two schemes in a way that is the page's actual point: He is better for ReLU
// and WORSE for tanh.

const LO = 0, HI = 7; // decades
const X0 = 68, X1 = 372;
const px = (v: number) => X0 + ((Math.log10(Math.max(v, 1)) - LO) / (HI - LO)) * (X1 - X0);

export function GradRatioBars({ caption }: { caption?: React.ReactNode }) {
  const rows = XAVIER_VS_HE.flatMap((r) => [
    { label: `${r.act} · Xavier`, v: r.xavier, tint: "var(--warn)" },
    { label: `${r.act} · He`, v: r.he, tint: "var(--c-neural)" },
  ]);
  const H = 26 + rows.length * 20 + 22;

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <svg viewBox={`0 0 400 ${H}`} width="100%" role="img" aria-label="gradient ratio at initialisation">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
          <g key={d}>
            <line x1={px(10 ** d)} y1={14} x2={px(10 ** d)} y2={18 + rows.length * 20} stroke="var(--border-strong)" strokeWidth={0.6} />
            <text x={px(10 ** d)} y={H - 10} textAnchor="middle" fontSize={7.5} fill="var(--faint)">
              {d === 0 ? "1" : `1e${d}`}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = 20 + i * 20;
          return (
            <g key={r.label}>
              <text x={X0 - 7} y={y + 9} textAnchor="end" fontSize={9} fill="var(--ink)">{r.label}</text>
              <rect x={X0} y={y + 1} width={Math.max(1.5, px(r.v) - X0)} height={11} rx={2} fill={r.tint} opacity={0.85} />
              <text x={Math.min(px(r.v) + 6, 340)} y={y + 10} fontSize={8.5} fill="var(--muted)" fontFamily="ui-monospace, SFMono-Regular, monospace">
                {r.v > 1000 ? r.v.toExponential(2) : r.v.toFixed(2)}
              </text>
            </g>
          );
        })}
        <text x={(X0 + X1) / 2} y={H - 1} textAnchor="middle" fontSize={8} fill="var(--faint)">
          gradient norm, last layer ÷ first layer (log scale) →
        </text>
      </svg>
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
