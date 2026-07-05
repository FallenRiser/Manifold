// Themed SVG figures for the capstone modeling pages. Every number here is the real
// output of the experiment in scripts (5-fold CV on estate_train.csv, seed 42):
// linear family ~0.65, polynomial ridge 0.71, tree ensembles 0.83-0.86, stacking 0.858.
// We render as SVG (not matplotlib PNG) so the plots stay theme-correct in light/dark.

type Row = { name: string; r2: number; rmse?: number; kind: "base" | "linear" | "tree" | "win" };

export const LEADERBOARD: Row[] = [
  { name: "Baseline (mean)", r2: 0.0, rmse: 1.156, kind: "base" },
  { name: "Linear / Ridge / Lasso", r2: 0.653, rmse: 0.681, kind: "linear" },
  { name: "Ridge + spatial", r2: 0.672, rmse: 0.662, kind: "linear" },
  { name: "Ridge + poly²", r2: 0.711, rmse: 0.621, kind: "linear" },
  { name: "Random forest", r2: 0.834, rmse: 0.47, kind: "tree" },
  { name: "HistGradientBoosting", r2: 0.846, rmse: 0.454, kind: "tree" },
  { name: "LightGBM", r2: 0.855, rmse: 0.44, kind: "tree" },
  { name: "XGBoost", r2: 0.856, rmse: 0.439, kind: "tree" },
  { name: "Stacking ensemble", r2: 0.858, rmse: 0.435, kind: "win" },
];

const COLOR: Record<Row["kind"], string> = {
  base: "var(--faint)",
  linear: "var(--c-regression)",
  tree: "var(--c-trees)",
  win: "var(--brand)",
};

// Horizontal bar leaderboard of CV R². Optionally pass a sliced `rows` set.
export function ModelLeaderboard({ rows = LEADERBOARD }: { rows?: Row[] }) {
  const W = 360, H = 18 + rows.length * 22, padL = 124, padR = 34, padT = 8;
  const max = 0.9, rowH = (H - padT - 14) / rows.length;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {rows.map((m, i) => {
        const y = padT + i * rowH, win = m.kind === "win";
        return (
          <g key={m.name}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={8} fill={win ? "var(--brand)" : "var(--muted)"} fontWeight={win ? 600 : 400} textAnchor="end">{m.name}</text>
            <rect x={padL} y={Math.round((y + 3) * 100) / 100} width={Math.max(0.5, Math.round((bx(m.r2) - padL) * 100) / 100)} height={Math.round((rowH - 6) * 100) / 100} fill={COLOR[m.kind]} fillOpacity={m.kind === "base" ? 0.5 : 0.82} rx={1.5} />
            <text x={bx(m.r2) + 4} y={y + rowH / 2 + 2} fontSize={8} fill="var(--muted)">{m.r2.toFixed(3)}</text>
          </g>
        );
      })}
      <text x={(padL + W - padR) / 2} y={H - 3} fontSize={8} fill="var(--faint)" textAnchor="middle">5-fold CV R² — higher is better</text>
    </svg>
  );
}

const IMP = [
  { f: "IncomeLevel", v: 0.276 }, { f: "dist_coast", v: 0.267 }, { f: "Latitude", v: 0.233 },
  { f: "Longitude", v: 0.163 }, { f: "RoomsPerHousehold", v: 0.116 }, { f: "dist_sf", v: 0.069 },
  { f: "dist_la", v: 0.03 }, { f: "BedroomsRatio", v: 0.02 }, { f: "PropertyAge", v: 0.016 },
  { f: "TotalRooms", v: 0.006 }, { f: "AvgOccupancy", v: 0.006 },
];

export function PermImportanceFig() {
  const W = 340, H = 210, padL = 110, padR = 34;
  const max = 0.3, rowH = (H - 14) / IMP.length;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {IMP.map((d, i) => {
        const y = 8 + i * rowH, geo = ["dist_coast", "Latitude", "Longitude", "dist_sf", "dist_la"].includes(d.f);
        return (
          <g key={d.f}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={8} fill={geo ? "var(--c-trees)" : "var(--muted)"} textAnchor="end">{d.f}</text>
            <rect x={padL} y={Math.round((y + 1.5) * 100) / 100} width={Math.max(0.5, Math.round((bx(d.v) - padL) * 100) / 100)} height={Math.round((rowH - 3.5) * 100) / 100} fill={geo ? "var(--c-trees)" : "var(--c-regression)"} fillOpacity={0.8} rx={1.5} />
            <text x={bx(d.v) + 4} y={y + rowH / 2 + 2} fontSize={7.5} fill="var(--muted)">{d.v.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

const PDP = {
  income: { x: [1.63, 2.16, 2.69, 3.23, 3.76, 4.29, 4.82, 5.35, 5.88, 6.41, 6.95, 7.48], y: [1.7, 1.72, 1.84, 1.94, 2.02, 2.13, 2.21, 2.41, 2.63, 2.82, 3.12, 3.1], xlabel: "block median income →", xlo: 1.5, xhi: 7.6, ylo: 1.5, yhi: 3.3 },
  coast: { x: [0.08, 0.24, 0.4, 0.56, 0.72, 0.87, 1.03, 1.19, 1.35, 1.51, 1.67, 1.83], y: [2.54, 2.24, 2.22, 2.17, 1.99, 1.57, 1.52, 1.45, 1.44, 1.4, 1.4, 1.37], xlabel: "distance to coast →", xlo: 0, xhi: 1.9, ylo: 1.3, yhi: 2.6 },
};

export function PdpFig({ which }: { which: "income" | "coast" }) {
  const d = PDP[which];
  const W = 320, H = 168, padL = 30, padB = 24, padT = 12;
  const sx = (v: number) => Math.round((padL + ((v - d.xlo) / (d.xhi - d.xlo)) * (W - padL - 12)) * 100) / 100;
  const sy = (v: number) => Math.round((H - padB - ((v - d.ylo) / (d.yhi - d.ylo)) * (H - padT - padB)) * 100) / 100;
  const color = which === "coast" ? "var(--c-trees)" : "var(--c-regression)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      <polyline points={d.x.map((x, i) => `${sx(x)},${sy(d.y[i])}`).join(" ")} fill="none" stroke={color} strokeWidth={2.6} />
      {d.x.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(d.y[i])} r={2.4} fill={color} />)}
      <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">{d.xlabel}</text>
      <text x={11} y={H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 11 ${H / 2})`}>price ($100k)</text>
    </svg>
  );
}

// Actual vs predicted scatter (sample of CV predictions from the stacking model).
const AVP: [number, number][] = [[1.29,1.48],[3.5,3.23],[2.4,2.56],[0.82,1.0],[2.21,2.44],[1.03,1.24],[2.49,4.08],[0.94,1.2],[1.12,1.17],[0.82,0.89],[1.09,1.1],[2.01,2.15],[2.04,2.49],[1.61,1.75],[0.62,0.73],[1.81,2.32],[2.8,2.81],[1.4,1.88],[5.0,4.85],[1.83,1.63],[1.5,1.5],[0.52,0.6],[0.88,0.9],[0.79,0.9],[2.4,2.44],[3.62,3.32],[2.71,3.04],[3.01,2.76],[1.19,0.98],[1.46,1.23],[2.98,2.53],[1.16,1.27],[0.88,0.98],[1.85,1.82],[2.94,2.39],[1.46,1.5],[0.41,0.89],[2.15,2.11],[2.1,2.25],[2.1,1.86],[2.88,4.04],[2.33,2.15],[3.57,3.02],[0.67,0.76],[2.36,1.92],[0.83,0.92],[0.54,0.89],[2.57,2.63],[2.53,2.59],[0.7,0.74],[0.69,0.88],[1.6,1.7],[2.56,1.95],[2.91,2.59],[2.32,2.01],[1.29,0.76],[3.46,3.65],[1.09,1.05],[1.2,1.61],[1.57,1.53],[3.15,2.62],[3.35,3.38],[1.88,3.62],[1.76,1.71],[1.62,3.04],[1.65,1.6],[0.48,0.49],[1.5,1.83],[1.58,1.61],[0.67,0.77],[1.18,1.4],[3.38,3.55],[0.84,0.97],[1.88,2.12],[1.35,2.11],[2.06,2.26],[0.95,1.15],[1.48,1.91],[1.54,1.8],[2.25,0.86],[1.85,1.52],[1.2,1.39],[2.95,2.86],[0.68,0.71],[0.84,1.08],[2.99,3.15],[3.58,3.72],[1.67,1.61],[4.28,4.67],[0.66,0.79],[2.27,2.03],[3.37,2.96],[0.75,1.16],[1.87,2.24],[3.54,3.8],[0.8,0.76],[5.0,5.13],[1.36,1.34],[3.39,3.6],[3.88,4.3],[1.1,1.35],[2.21,2.21],[2.57,3.1],[2.5,2.14],[1.78,1.77],[0.93,1.09],[1.74,2.18],[4.77,2.99],[3.16,2.08],[2.58,2.75],[2.25,2.46],[1.7,2.03],[1.18,1.3],[2.73,3.07],[1.95,1.78],[1.44,1.37],[3.45,3.21],[3.67,3.97],[1.72,1.76],[0.84,1.11],[1.13,1.18],[0.98,0.82],[0.89,0.82],[2.38,1.66],[1.76,1.74],[2.63,2.63],[4.87,4.67],[1.65,1.93],[2.43,2.26],[1.03,1.35]];

export function ActualVsPredictedFig() {
  const W = 300, H = 270, pad = 30, lo = 0, hi = 5.3;
  const sx = (v: number) => Math.round((pad + ((v - lo) / (hi - lo)) * (W - pad - 10)) * 100) / 100;
  const sy = (v: number) => Math.round((H - pad - ((v - lo) / (hi - lo)) * (H - pad - 10)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      <line x1={sx(0)} y1={sy(0)} x2={sx(5)} y2={sy(5)} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={sx(0)} y1={sy(5)} x2={sx(5)} y2={sy(5)} stroke="var(--faint)" strokeWidth={0.6} strokeOpacity={0.5} />
      {AVP.map(([a, p], i) => <circle key={i} cx={sx(a)} cy={sy(p)} r={2.1} fill="var(--c-trees)" fillOpacity={0.45} />)}
      <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">actual price →</text>
      <text x={10} y={H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`}>predicted →</text>
      <text x={sx(0.1)} y={sy(5) - 4} fontSize={7.5} fill="var(--faint)">5.0 cap</text>
    </svg>
  );
}

const LC = { sizes: [1100, 3082, 5063, 7045, 9026, 11008], train: [0.999, 0.999, 0.996, 0.992, 0.988, 0.984], val: [0.773, 0.816, 0.832, 0.841, 0.848, 0.853] };

export function LearningCurveFig() {
  const W = 330, H = 200, padL = 34, padB = 26, padT = 14, padR = 12;
  const xlo = 1000, xhi = 11200, ylo = 0.74, yhi = 1.01;
  const sx = (v: number) => Math.round((padL + ((v - xlo) / (xhi - xlo)) * (W - padL - padR)) * 100) / 100;
  const sy = (v: number) => Math.round((H - padB - ((v - ylo) / (yhi - ylo)) * (H - padT - padB)) * 100) / 100;
  const line = (arr: number[]) => LC.sizes.map((s, i) => `${sx(s)},${sy(arr[i])}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {[0.8, 0.9, 1.0].map((g) => <g key={g}><line x1={padL} y1={sy(g)} x2={W - padR} y2={sy(g)} stroke="var(--border)" strokeWidth={0.5} /><text x={padL - 3} y={sy(g) + 3} fontSize={7} fill="var(--faint)" textAnchor="end">{g.toFixed(1)}</text></g>)}
      <polyline points={line(LC.train)} fill="none" stroke="var(--faint)" strokeWidth={2.2} />
      {LC.sizes.map((s, i) => <circle key={i} cx={sx(s)} cy={sy(LC.train[i])} r={2.2} fill="var(--faint)" />)}
      <polyline points={line(LC.val)} fill="none" stroke="var(--c-trees)" strokeWidth={2.6} />
      {LC.sizes.map((s, i) => <circle key={i} cx={sx(s)} cy={sy(LC.val[i])} r={2.4} fill="var(--c-trees)" />)}
      <text x={sx(7045)} y={sy(0.999) - 5} fontSize={8} fill="var(--muted)" textAnchor="middle">training</text>
      <text x={sx(7045)} y={sy(0.841) + 13} fontSize={8} fill="var(--c-trees)" textAnchor="middle">validation</text>
      <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">training-set size →</text>
    </svg>
  );
}

// Residuals vs fitted (holdout) — fan + the visible diagonal line of capped points.
const RES: [number, number][] = [[1.49,0.72],[1.43,0.82],[2.21,0.79],[1.4,-0.08],[0.64,0.03],[2.6,-0.27],[3.19,0.12],[1.4,0.03],[2.08,-0.14],[1.41,0.04],[0.79,0.0],[2.17,-0.65],[1.92,0.01],[1.04,0.09],[1.63,0.09],[2.35,-0.88],[2.74,-1.08],[3.03,-0.32],[1.5,-0.2],[0.8,0.0],[2.11,0.09],[2.54,-0.89],[4.55,-1.05],[1.42,0.01],[1.86,-0.16],[1.43,-0.24],[2.5,-0.54],[1.24,0.2],[0.92,0.01],[0.54,0.01],[1.43,0.1],[1.86,-0.26],[1.96,-0.12],[1.96,0.37],[1.26,-0.11],[0.84,-0.06],[1.0,0.3],[2.64,-0.1],[1.91,-0.29],[1.08,-0.1],[0.98,-0.1],[1.07,-0.3],[2.26,-0.45],[2.9,0.09],[2.53,-0.14],[1.73,-0.11],[2.12,-0.01],[3.32,-0.66],[1.03,0.07],[2.46,0.36],[1.54,-0.02],[1.06,-0.36],[1.25,-0.04],[1.62,0.02],[1.19,-0.18],[2.17,0.73],[3.91,-1.37],[2.79,-0.16],[2.03,-0.28],[3.62,-0.31],[0.96,-0.01],[4.87,0.13],[1.2,0.05],[2.05,-0.38],[1.07,-0.34],[1.22,0.66],[3.42,-0.53],[1.79,0.09],[2.37,-0.52],[1.36,-0.27],[1.54,0.12],[1.3,-0.36],[1.32,-0.12],[1.37,0.2],[1.64,-0.01],[5.0,0.0],[1.69,-0.09],[2.6,0.0],[3.83,0.07],[2.9,-0.16],[3.0,-1.83],[1.9,0.24],[0.95,-0.04],[4.55,0.45],[2.96,-0.07],[2.11,-0.17],[2.5,-0.14],[1.03,-0.17],[2.03,-0.09],[2.77,-0.36],[0.85,0.21],[1.36,-0.04],[1.58,-0.22],[1.22,-0.24],[0.56,-0.04],[0.96,0.18],[2.11,1.39],[2.02,-0.32],[0.91,0.02],[2.81,0.4],[4.3,-1.43],[1.18,-0.06],[3.41,-0.16],[1.14,0.73],[4.05,0.74],[2.22,0.11],[2.2,0.38],[1.85,-0.31],[1.01,0.05],[2.52,-0.09],[1.22,-0.1],[4.92,0.08],[1.77,0.18],[2.06,-0.13],[1.59,0.12],[1.4,0.8],[0.64,0.04],[1.34,-0.39],[0.88,-0.37],[1.33,-0.18],[2.07,0.62],[1.59,-0.14],[3.1,0.21],[1.98,0.18],[0.77,-0.15],[3.11,1.12],[1.21,0.25],[2.13,0.26],[0.78,-0.25],[1.73,0.61]];

export function ResidualFig() {
  const W = 330, H = 200, padL = 32, padB = 24, padT = 12, padR = 12;
  const xlo = 0.3, xhi = 5.2, ylo = -2.0, yhi = 1.6;
  const sx = (v: number) => Math.round((padL + ((v - xlo) / (xhi - xlo)) * (W - padL - padR)) * 100) / 100;
  const sy = (v: number) => Math.round((H - padB - ((v - ylo) / (yhi - ylo)) * (H - padT - padB)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      <line x1={padL} y1={sy(0)} x2={W - padR} y2={sy(0)} stroke="var(--border-strong)" strokeWidth={0.8} strokeDasharray="3 3" />
      {RES.map(([f, r], i) => <circle key={i} cx={sx(f)} cy={sy(r)} r={2} fill="var(--c-regression)" fillOpacity={0.42} />)}
      <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">fitted (predicted) price →</text>
      <text x={10} y={H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`}>residual →</text>
    </svg>
  );
}

// Random CV vs spatial CV: how much of the score is neighbour-leakage.
export function SpatialCVFig() {
  const data = [
    { name: "random 5-fold CV", v: 0.856, kind: "report" as const },
    { name: "spatial GroupKFold", v: 0.699, kind: "honest" as const },
  ];
  const W = 330, H = 110, padL = 118, padR = 40, padT = 10;
  const max = 0.9, rowH = (H - padT - 8) / data.length;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {data.map((d, i) => {
        const y = padT + i * rowH, honest = d.kind === "honest";
        return (
          <g key={d.name}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={8.5} fill={honest ? "var(--warn)" : "var(--muted)"} textAnchor="end">{d.name}</text>
            <rect x={padL} y={Math.round((y + 4) * 100) / 100} width={Math.round((bx(d.v) - padL) * 100) / 100} height={Math.round((rowH - 8) * 100) / 100} fill={honest ? "var(--warn)" : "var(--c-trees)"} fillOpacity={0.8} rx={1.5} />
            <text x={bx(d.v) + 4} y={y + rowH / 2 + 2} fontSize={8.5} fill="var(--muted)">{d.v.toFixed(3)}</text>
          </g>
        );
      })}
      <text x={(padL + W - padR) / 2} y={H - 2} fontSize={8} fill="var(--faint)" textAnchor="middle">R² — same model, two ways of splitting</text>
    </svg>
  );
}

// Cap-zone vs normal RMSE: censoring still bites even the best model.
export function CapZoneFig() {
  const data = [{ name: "normal (y < 4.5)", v: 0.398 }, { name: "cap zone (y ≥ 4.5)", v: 0.911 }];
  const W = 320, H = 110, padL = 110, padR = 40, padT = 10;
  const max = 1.0, rowH = (H - padT - 8) / data.length;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {data.map((d, i) => {
        const y = padT + i * rowH, hot = i === 1;
        return (
          <g key={d.name}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={8.5} fill={hot ? "var(--bad)" : "var(--muted)"} textAnchor="end">{d.name}</text>
            <rect x={padL} y={Math.round((y + 4) * 100) / 100} width={Math.round((bx(d.v) - padL) * 100) / 100} height={Math.round((rowH - 8) * 100) / 100} fill={hot ? "var(--bad)" : "var(--c-trees)"} fillOpacity={0.8} rx={1.5} />
            <text x={bx(d.v) + 4} y={y + rowH / 2 + 2} fontSize={8.5} fill="var(--muted)">{d.v.toFixed(3)}</text>
          </g>
        );
      })}
      <text x={(padL + W - padR) / 2} y={H - 2} fontSize={8} fill="var(--faint)" textAnchor="middle">holdout RMSE by zone — lower is better</text>
    </svg>
  );
}
