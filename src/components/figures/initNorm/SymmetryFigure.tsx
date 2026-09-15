// Why a layer initialised to a constant has an effective width of one.
//
// The argument is short — identical incoming weights give identical outputs,
// identical outputs give identical gradients, so the units stay identical for
// ever — and it is exactly the kind of argument readers agree with and do not
// picture. Eight bars that are all the same height, next to eight bars that are
// not, is the picture. The caption then says the part the drawing cannot: that
// the left panel does not improve with training, because the tie is a fixed
// point rather than a coincidence.
//
// Unit outputs from scripts/init_norm_cases.py section 8 (depth 4, width 16,
// two-moons input); shown here for the first hidden layer, first sample.

const UNITS = 8;

// One sample's activations across the first hidden layer's first 8 units.
// Zero init: every unit emits exactly 0. He init: what was actually measured —
// note that three of the eight are also 0, because ReLU zeroes them. Those are
// a different kind of zero: they differ from sample to sample, so the units
// still compute different functions.
const HE_UNITS = [0.5461, 0.0, 1.0302, 0.0, 0.0, 0.0, 2.9246, 1.665];

function Panel({ values, title, sub, tint, allSame }: { values: number[]; title: string; sub: string; tint: string; allSame: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)", marginBottom: 1 }}>{title}</div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 7 }}>{sub}</div>
      <svg viewBox="0 0 200 74" width="100%" role="img" aria-label={title}>
        <line x1={4} y1={62} x2={196} y2={62} stroke="var(--border-strong)" strokeWidth={1} />
        {values.map((v, i) => {
          const h = Math.max(1, (v / max) * 50);
          return (
            <g key={i}>
              <rect x={6 + i * 24} y={62 - h} width={17} height={h} rx={2} fill={tint} opacity={0.82} />
              <text x={14.5 + i * 24} y={71} textAnchor="middle" fontSize={7} fill="var(--faint)">u{i + 1}</text>
            </g>
          );
        })}
        {allSame && (
          <text x={100} y={30} textAnchor="middle" fontSize={9.5} fill="var(--bad)">every unit identical</text>
        )}
      </svg>
    </div>
  );
}

export function SymmetryFigure({ caption }: { caption?: React.ReactNode }) {
  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
        <Panel
          values={Array(UNITS).fill(0)}
          title="Zero init"
          sub="effective width 1"
          tint="var(--bad)"
          allSame
        />
        <Panel
          values={HE_UNITS}
          title="He init"
          sub={`${UNITS} distinct functions (three happen to be off for this sample)`}
          tint="var(--good)"
          allSame={false}
        />
      </div>
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 11, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
