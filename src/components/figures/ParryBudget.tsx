// The Lies-of-P capstone's signature figure — the whole problem in one picture, the way
// NeoField is for the asteroid capstone.
//
// The thesis it carries: this project is a LATENCY problem at least as much as a learning
// problem. A perfect guard has to land inside a window a few frames wide; the agent's
// see -> think -> act chain has to fit inside that window, every time. A model that is
// 100% accurate and 20 ms too slow parries nothing.
//
// ⚠️ HONEST-NUMBERS NOTE: every millisecond here is an ILLUSTRATIVE BUDGET, not a
// measurement — there is no model yet. The figure is stamped as such, and Act 2 of the
// capstone replaces these with real measurements from the user's own machine. Do not
// quote these numbers anywhere as results.

const W = 720;
const H = 236;
const X0 = 62;
const X1 = 690;
const MS_MAX = 80;          // the visible time axis, in milliseconds
const FRAME_MS = 1000 / 60; // 16.67 ms at 60 fps

const SEGMENTS: { label: string; ms: number; tone: "a" | "b" }[] = [
  { label: "capture + downsample", ms: 8, tone: "a" },
  { label: "stack + to GPU", ms: 4, tone: "b" },
  { label: "CNN inference", ms: 12, tone: "a" },
  { label: "input synth + game poll", ms: 16, tone: "b" },
];

const WINDOW_MS = 50;  // assumed perfect-guard window (3 frames) — measured in Act 2
const P99_MS = 78;     // assumed tail of the loop — the run that arrives too late

export function ParryBudget({ onDark = true }: { onDark?: boolean }) {
  const ink = onDark ? "var(--krat-ink)" : "var(--ink)";
  const inkSoft = onDark ? "var(--krat-ink-soft)" : "var(--muted)";
  const faint = onDark ? "var(--krat-faint)" : "var(--faint)";
  const brass = onDark ? "var(--krat-brass)" : "#8a6f16";
  const brassDim = onDark ? "var(--krat-brass-dim)" : "#5c4b12";
  const ember = onDark ? "var(--krat-ember)" : "#c2521f";
  const blood = onDark ? "var(--krat-blood)" : "var(--c-krat)";
  const rule = onDark ? "var(--krat-border)" : "var(--border)";

  const x = (ms: number) => X0 + (ms / MS_MAX) * (X1 - X0);
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  let acc = 0;
  const bars = SEGMENTS.map((s) => {
    const seg = { ...s, start: acc };
    acc += s.ms;
    return seg;
  });
  const total = acc;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block" }}
      role="img"
      aria-label={`The parry budget: a perfect-guard window assumed to be ${WINDOW_MS} milliseconds wide, against an agent loop of capture, stacking, inference and input synthesis totalling ${total} milliseconds, whose slow tail of ${P99_MS} milliseconds arrives after the window has closed.`}
    >
      {/* frame ruler at 60 fps */}
      {Array.from({ length: Math.floor(MS_MAX / FRAME_MS) + 1 }, (_, i) => i * FRAME_MS).map((ms, i) => (
        <g key={`f${i}`}>
          <line x1={x(ms)} y1={30} x2={x(ms)} y2={H - 26} stroke={rule} strokeWidth={1} />
          <text x={x(ms) + 4} y={26} fontSize={9.5} fill={faint} fontFamily={mono}>
            f{i}
          </text>
        </g>
      ))}
      <text x={X0} y={14} fontSize={10} fill={faint} fontFamily={mono}>
        1 FRAME @ 60 FPS = 16.7 MS
      </text>

      {/* the window the game gives you */}
      <rect x={x(0)} y={44} width={x(WINDOW_MS) - x(0)} height={30} rx={4} fill={ember} opacity={0.22} />
      <rect x={x(0)} y={44} width={x(WINDOW_MS) - x(0)} height={30} rx={4} fill="none" stroke={ember} strokeWidth={1.4} />
      <text x={x(0) + 10} y={63} fontSize={12} fill={ink} fontWeight={600}>
        perfect-guard window
      </text>
      <text x={x(WINDOW_MS) - 8} y={63} fontSize={11} fill={ember} textAnchor="end" fontFamily={mono}>
        ~{WINDOW_MS} ms
      </text>
      <text x={X0} y={90} fontSize={10.5} fill={faint}>
        what the game gives you
      </text>

      {/* the deadline */}
      <line x1={x(WINDOW_MS)} y1={40} x2={x(WINDOW_MS)} y2={H - 34} stroke={ember} strokeWidth={1.4} strokeDasharray="4 4" />

      {/* the chain you have to fit inside it */}
      {bars.map((b) => (
        <g key={b.label}>
          <rect
            x={x(b.start)}
            y={116}
            width={Math.max(x(b.start + b.ms) - x(b.start) - 2, 2)}
            height={28}
            rx={3}
            fill={b.tone === "a" ? brass : brassDim}
            opacity={b.tone === "a" ? 0.85 : 0.95}
          />
          <text
            x={x(b.start) + (x(b.start + b.ms) - x(b.start)) / 2}
            y={134}
            fontSize={9.5}
            fill={b.tone === "a" ? "#241d05" : "var(--krat-ink)"}
            textAnchor="middle"
            fontFamily={mono}
          >
            {b.ms}
          </text>
        </g>
      ))}

      {/* the tail that misses */}
      <rect x={x(total)} y={116} width={x(P99_MS) - x(total)} height={28} rx={3} fill={blood} opacity={0.5} />
      <line x1={x(total)} y1={112} x2={x(total)} y2={148} stroke={ink} strokeWidth={1.2} />
      <text x={x(total) + 6} y={162} fontSize={10.5} fill={inkSoft} fontFamily={mono}>
        typical {total} ms — fits, barely
      </text>
      <text x={x(P99_MS)} y={110} fontSize={10.5} fill={blood} textAnchor="end" fontFamily={mono}>
        p99 {P99_MS} ms — too late
      </text>

      <text x={X0} y={186} fontSize={10.5} fill={faint}>
        what your loop has to fit inside it
      </text>

      {/* the legend of the chain */}
      <g>
        {bars.map((b, i) => (
          <g key={`l${b.label}`}>
            <rect x={X0 + i * 152} y={198} width={9} height={9} rx={2} fill={b.tone === "a" ? brass : brassDim} />
            <text x={X0 + i * 152 + 14} y={206} fontSize={10} fill={inkSoft}>
              {b.label}
            </text>
          </g>
        ))}
      </g>

      {/* the honesty stamp — this figure is arithmetic, not a result */}
      <text x={X1} y={230} fontSize={9} fill={faint} textAnchor="end" fontFamily={mono} letterSpacing="0.1em">
        ILLUSTRATIVE BUDGET · MEASURED IN ACT 2
      </text>
    </svg>
  );
}
