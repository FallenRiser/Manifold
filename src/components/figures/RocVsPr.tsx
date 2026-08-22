// One model, two curves — the whole reason PR-AUC exists, in a picture. Both panels
// grade the SAME size rule (rank by -H) on the SAME 9.73%-positive data. Left: the ROC
// curve bows to the top-left and its area is a flattering 0.87, because both its axes are
// normalised within a class and so ignore the imbalance. Right: the precision-recall curve
// sags — precision never clears ~0.30 — and its area (average precision) is an honest 0.28,
// only ~3x the prevalence floor it must beat. Real curve points from scripts/neo_cases.py.
// Static, rounded coords → SSR-safe, no client component needed.

const ROC: [number, number][] = [
  [0, 0], [0.003, 0.01], [0.01, 0.034], [0.025, 0.077], [0.053, 0.163], [0.101, 0.346],
  [0.161, 0.587], [0.225, 0.893], [0.306, 1], [0.505, 1], [0.743, 1], [1, 1],
];
// precision-recall points as (recall, precision), trimmed of the degenerate rec=0 endpoint
const PR: [number, number][] = [
  [1, 0.097], [1, 0.105], [1, 0.125], [1, 0.172], [1, 0.206], [1, 0.254],
  [0.901, 0.3], [0.614, 0.284], [0.346, 0.269], [0.163, 0.248], [0.075, 0.253], [0.033, 0.263],
];
const PREV = 0.097;

const PLX = 34, PRX = 196, PTY = 14, PBY = 150;
const W = PRX - PLX, Hh = PBY - PTY;
const sx = (v: number) => Math.round((PLX + v * W) * 10) / 10;
const sy = (v: number) => Math.round((PBY - v * Hh) * 10) / 10;

function Panel({
  pts, title, area, areaColor, chance, xlab, ylab,
}: {
  pts: [number, number][];
  title: string;
  area: string;
  areaColor: string;
  chance: React.ReactNode;
  xlab: string;
  ylab: string;
}) {
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${sx(x)},${sy(y)}`).join(" ");
  const fill = `M${sx(pts[0][0])},${sy(0)} ` + pts.map(([x, y]) => `L${sx(x)},${sy(y)}`).join(" ") + ` L${sx(pts[pts.length - 1][0])},${sy(0)} Z`;
  return (
    <svg viewBox="0 0 210 176" width="100%" role="img" aria-label={`${title}, area ${area}`}>
      <text x={PLX} y={10} fontSize={10.5} fill="var(--ink)" fontWeight={600}>{title}</text>
      {/* axes */}
      <line x1={PLX} y1={PBY} x2={PRX} y2={PBY} stroke="var(--border-strong)" strokeWidth={1} />
      <line x1={PLX} y1={PTY} x2={PLX} y2={PBY} stroke="var(--border-strong)" strokeWidth={1} />
      {/* chance reference */}
      {chance}
      {/* shaded area + curve */}
      <path d={fill} fill={areaColor} opacity={0.16} />
      <path d={line} fill="none" stroke={areaColor} strokeWidth={2} strokeLinejoin="round" />
      {/* area label */}
      <text x={PRX - 4} y={PBY - 8} textAnchor="end" fontSize={12} fontWeight={700} fill={areaColor}>{area}</text>
      {/* axis labels */}
      <text x={(PLX + PRX) / 2} y={172} textAnchor="middle" fontSize={9.5} fill="var(--faint)">{xlab}</text>
      <text x={10} y={(PTY + PBY) / 2} textAnchor="middle" fontSize={9.5} fill="var(--faint)" transform={`rotate(-90 10 ${(PTY + PBY) / 2})`}>{ylab}</text>
    </svg>
  );
}

export function RocVsPr() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, margin: "20px 0 4px", padding: "14px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <Panel
        pts={ROC}
        title="ROC curve"
        area="AUC 0.87"
        areaColor="var(--muted)"
        xlab="false positive rate →"
        ylab="true positive rate →"
        chance={<line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--faint)" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />}
      />
      <Panel
        pts={PR}
        title="Precision–recall curve"
        area="AP 0.28"
        areaColor="var(--c-space)"
        xlab="recall →"
        ylab="precision →"
        chance={<line x1={sx(0)} y1={sy(PREV)} x2={sx(1)} y2={sy(PREV)} stroke="var(--faint)" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />}
      />
    </div>
  );
}
