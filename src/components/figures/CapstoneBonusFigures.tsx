// Themed SVG figures for the capstone bonus page (censored boosting + SHAP).
// Every number is the real output of the bonus experiment run on estate_train.csv
// with the SAME pipeline that produced the published capstone numbers
// (original cleaning + spatial features; 5-fold CV seed 42; holdout =
// train_test_split 20%, seed 42 — identical to the model-selection page):
// plain LightGBM CV 0.855/0.440; Tobit-objective LightGBM (sigma 0.4) CV 0.855/0.440;
// cap-zone holdout RMSE 0.911 -> 0.848; SHAP base value 2.067.

// ---- cap-zone RMSE: plain vs censored objective, by zone -------------------
const ZONES = [
  { zone: "normal (y < 4.5)", n: 3069, plain: 0.398, censored: 0.407 },
  { zone: "cap zone (y ≥ 4.5)", n: 234, plain: 0.911, censored: 0.848 },
];

export function CensoredZoneFig() {
  const W = 340, H = 132, padL = 112, padR = 44, padT = 10, groupH = 50, barH = 16;
  const max = 1.0;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {ZONES.map((z, i) => {
        const y = padT + i * groupH;
        return (
          <g key={z.zone}>
            <text x={padL - 6} y={y + groupH / 2 - 2} fontSize={8.5} fill={i === 1 ? "var(--bad)" : "var(--muted)"} textAnchor="end">{z.zone}</text>
            <text x={padL - 6} y={y + groupH / 2 + 9} fontSize={7} fill="var(--faint)" textAnchor="end">n = {z.n}</text>
            <rect x={padL} y={y + 4} width={Math.round((bx(z.plain) - padL) * 100) / 100} height={barH} fill="var(--faint)" fillOpacity={0.65} rx={1.5} />
            <text x={bx(z.plain) + 4} y={y + 4 + barH / 2 + 3} fontSize={8} fill="var(--muted)">{z.plain.toFixed(3)}</text>
            <rect x={padL} y={y + 6 + barH} width={Math.round((bx(z.censored) - padL) * 100) / 100} height={barH} fill="var(--brand-2)" fillOpacity={0.85} rx={1.5} />
            <text x={bx(z.censored) + 4} y={y + 6 + barH + barH / 2 + 3} fontSize={8} fill="var(--muted)">{z.censored.toFixed(3)}</text>
          </g>
        );
      })}
      <g>
        <rect x={padL} y={H - 15} width={8} height={7} fill="var(--faint)" fillOpacity={0.65} rx={1} />
        <text x={padL + 12} y={H - 9} fontSize={7.5} fill="var(--muted)">plain objective</text>
        <rect x={padL + 78} y={H - 15} width={8} height={7} fill="var(--brand-2)" fillOpacity={0.85} rx={1} />
        <text x={padL + 90} y={H - 9} fontSize={7.5} fill="var(--muted)">censored (Tobit) objective</text>
      </g>
      <text x={(padL + W - padR) / 2} y={9} fontSize={8} fill="var(--faint)" textAnchor="middle">holdout RMSE — lower is better</text>
    </svg>
  );
}

// ---- what the censored model believes about capped blocks -----------------
// 173 capped blocks in the holdout: plain model's mean prediction 4.533 (stuck
// under the cap); censored model's latent mean 5.117, median 5.157, max 7.087.
export function LatentValueFig() {
  const W = 340, H = 118, padL = 20, padR = 16, axisY = 74;
  const lo = 4.2, hi = 7.4;
  const sx = (v: number) => Math.round((padL + ((v - lo) / (hi - lo)) * (W - padL - padR)) * 100) / 100;
  const ticks = [4.5, 5.0, 5.5, 6.0, 6.5, 7.0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      <line x1={padL} y1={axisY} x2={W - padR} y2={axisY} stroke="var(--border-strong)" strokeWidth={1} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} y1={axisY - 3} x2={sx(t)} y2={axisY + 3} stroke="var(--border-strong)" strokeWidth={1} />
          <text x={sx(t)} y={axisY + 14} fontSize={7.5} fill="var(--faint)" textAnchor="middle">{t.toFixed(1)}</text>
        </g>
      ))}
      {/* the cap */}
      <line x1={sx(5)} y1={16} x2={sx(5)} y2={axisY} stroke="var(--bad)" strokeWidth={1.2} strokeDasharray="4 3" />
      <text x={sx(5)} y={12} fontSize={8} fill="var(--bad)" textAnchor="middle">the 5.0 cap</text>
      {/* plain model, stuck below */}
      <circle cx={sx(4.533)} cy={axisY - 22} r={4} fill="var(--faint)" />
      <text x={sx(4.533)} y={axisY - 32} fontSize={7.5} fill="var(--muted)" textAnchor="middle">plain model</text>
      <text x={sx(4.533)} y={axisY - 12} fontSize={7.5} fill="var(--muted)" textAnchor="middle">4.53</text>
      {/* censored model latent mean / max */}
      <circle cx={sx(5.117)} cy={axisY - 22} r={4} fill="var(--brand-2)" />
      <text x={sx(5.117)} y={axisY - 32} fontSize={7.5} fill="var(--brand-2)" textAnchor="middle">latent mean</text>
      <text x={sx(5.117)} y={axisY - 12} fontSize={7.5} fill="var(--muted)" textAnchor="middle">5.12</text>
      <circle cx={sx(7.087)} cy={axisY - 22} r={4} fill="var(--brand-2)" fillOpacity={0.55} />
      <text x={sx(7.087)} y={axisY - 32} fontSize={7.5} fill="var(--brand-2)" textAnchor="middle">latent max</text>
      <text x={sx(7.087)} y={axisY - 12} fontSize={7.5} fill="var(--muted)" textAnchor="middle">7.09</text>
      <text x={W / 2} y={H - 6} fontSize={8} fill="var(--faint)" textAnchor="middle">
        mean prediction for the 173 capped holdout blocks ($100k)
      </text>
    </svg>
  );
}

// ---- SHAP -------------------------------------------------------------------
// Global mean |SHAP| on the holdout (3,303 blocks), plain LightGBM, 16 features.
const SHAP_GLOBAL: [string, number][] = [
  ["IncomeLevel", 0.344], ["dist_coast", 0.333], ["RoomsPerHousehold", 0.211],
  ["Latitude", 0.195], ["Longitude", 0.14], ["dist_sf", 0.099], ["dist_la", 0.062],
  ["BedroomsRatio", 0.051], ["AvgOccupancy", 0.038], ["PropertyAge", 0.035],
  ["TotalRooms", 0.025], ["inc_per_room", 0.024], ["NeighborhoodPop", 0.019],
  ["TotalBedrooms", 0.016], ["log_rooms", 0.007], ["log_pop", 0.005],
];

export function ShapGlobalFig() {
  const W = 340, H = 14 + SHAP_GLOBAL.length * 15, padL = 118, padR = 34;
  const max = 0.38, rowH = 15;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  const GEO = ["dist_coast", "Latitude", "Longitude", "dist_sf", "dist_la"];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {SHAP_GLOBAL.map(([f, v], i) => {
        const y = 7 + i * rowH, geo = GEO.includes(f);
        return (
          <g key={f}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={7.5} fill={geo ? "var(--c-trees)" : "var(--muted)"} textAnchor="end">{f}</text>
            <rect x={padL} y={y + 1.5} width={Math.max(0.5, Math.round((bx(v) - padL) * 100) / 100)} height={rowH - 4} fill={geo ? "var(--c-trees)" : "var(--c-regression)"} fillOpacity={0.8} rx={1.5} />
            <text x={bx(v) + 4} y={y + rowH / 2 + 2} fontSize={7.5} fill="var(--muted)">{v.toFixed(3)}</text>
          </g>
        );
      })}
      <text x={(padL + W - padR) / 2} y={H - 3} fontSize={7.5} fill="var(--faint)" textAnchor="middle">mean |SHAP value| ($100k) on the holdout</text>
    </svg>
  );
}

// Per-prediction waterfalls: base value 2.067 -> individual prediction.
// Positive pushes in riso pink, negative in riso blue (SHAP's own convention).
type Waterfall = {
  title: string;
  actual: number;
  pred: number;
  contribs: [string, number][]; // sorted by |value|, top 7
  rest: number; // sum of the remaining 9 features
};

export const WATERFALLS: Record<"coastal" | "inland" | "capped", Waterfall> = {
  coastal: {
    title: "Peninsula block near SF · income 4.7, 0.26° to the city",
    actual: 3.62,
    pred: 4.199,
    contribs: [
      ["Longitude = −122.3", 0.555], ["RoomsPerHousehold = 2.4", 0.347], ["dist_coast = 0.33", 0.314],
      ["IncomeLevel = 4.7", 0.269], ["dist_sf = 0.26", 0.224], ["Latitude = 37.5", 0.184],
      ["dist_la = 5.4", 0.094],
    ],
    rest: 0.146,
  },
  inland: {
    title: "Central Valley block · income 3.1, 1.8° inland",
    actual: 0.96,
    pred: 0.788,
    contribs: [
      ["dist_coast = 1.8", -0.692], ["IncomeLevel = 3.1", -0.199], ["Latitude = 36.5", -0.197],
      ["RoomsPerHousehold = 1.6", -0.095], ["dist_la = 2.8", -0.065], ["Longitude = −119.6", 0.045],
      ["dist_sf = 3.1", -0.029],
    ],
    rest: -0.047,
  },
  capped: {
    title: "Capped block (true ≥ 5.0) · tiny population 63, income 2.7",
    actual: 5.0,
    pred: 2.46,
    contribs: [
      ["dist_coast = 0.6", 0.229], ["IncomeLevel = 2.7", -0.195], ["NeighborhoodPop = 63", 0.1],
      ["Longitude = −119.1", 0.091], ["AvgOccupancy = 0.9", 0.082], ["BedroomsRatio = 0.31", -0.056],
      ["TotalRooms = 3.0", 0.05],
    ],
    rest: 0.092,
  },
};

export const BASE = 2.067;

export function ShapWaterfallFig({ which }: { which: keyof typeof WATERFALLS }) {
  const d = WATERFALLS[which];
  const rows: [string, number][] = [...d.contribs, ["9 remaining features", d.rest]];
  // cumulative positions
  const cums: number[] = [BASE];
  rows.forEach(([, v]) => cums.push(cums[cums.length - 1] + v));
  const lo = Math.min(...cums) - 0.25, hi = Math.max(...cums) + 0.35;
  const W = 340, padL = 128, padR = 12, rowH = 17, padT = 24, padB = 34;
  const H = padT + rows.length * rowH + padB;
  const sx = (v: number) => Math.round((padL + ((v - lo) / (hi - lo)) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {/* base value line */}
      <line x1={sx(BASE)} y1={padT - 10} x2={sx(BASE)} y2={H - padB + 6} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3" />
      <text x={sx(BASE)} y={padT - 14} fontSize={7.5} fill="var(--faint)" textAnchor="middle">base 2.07</text>
      {rows.map(([label, v], i) => {
        const y = padT + i * rowH;
        const x0 = sx(cums[i]), x1 = sx(cums[i + 1]);
        const pos = v >= 0;
        return (
          <g key={label}>
            <text x={padL - 6} y={y + rowH / 2 + 2.5} fontSize={7.5} fill="var(--muted)" textAnchor="end">{label}</text>
            <rect x={Math.min(x0, x1)} y={y + 2.5} width={Math.max(1, Math.abs(x1 - x0))} height={rowH - 5.5}
              fill={pos ? "var(--brand-2)" : "var(--c-regression)"} fillOpacity={0.82} rx={1.5} />
            {i < rows.length - 1 && (
              <line x1={x1} y1={y + 2.5} x2={x1} y2={y + rowH + 2.5} stroke="var(--faint)" strokeWidth={0.6} strokeOpacity={0.7} />
            )}
            <text x={(pos ? Math.max(x0, x1) : Math.min(x0, x1)) + (pos ? 4 : -4)} y={y + rowH / 2 + 2.5}
              fontSize={7} fill="var(--muted)" textAnchor={pos ? "start" : "end"}>{v > 0 ? "+" : ""}{v.toFixed(2)}</text>
          </g>
        );
      })}
      {/* final prediction marker */}
      <g>
        <line x1={sx(d.pred)} y1={padT + rows.length * rowH + 2} x2={sx(d.pred)} y2={padT + rows.length * rowH + 10} stroke="var(--ink)" strokeWidth={1.4} />
        <text x={sx(d.pred)} y={padT + rows.length * rowH + 20} fontSize={8} fill="var(--ink)" fontWeight={600} textAnchor="middle">prediction {d.pred.toFixed(2)}</text>
        <text x={sx(d.pred)} y={padT + rows.length * rowH + 30} fontSize={7.5} fill="var(--muted)" textAnchor="middle">actual {d.actual.toFixed(2)}</text>
      </g>
    </svg>
  );
}
