// Transfer test I identity — pulsars. A dark radio-observatory panel with the
// iconic stacked pulse-profile motif (successive rotations of a pulsar, each a
// noisy periodic pulse — the "waterfall" plot every radio astronomer knows). Its
// own skin so a NEW field reads as a new field, distinct from the asteroid sky.
// Always-dark and theme-independent (uses --radio-* tokens); one-shot fade-in
// reveal (reduced-motion neutralises it). Deterministic → SSR-safe.

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One stacked pulse trace: a baseline with a Gaussian-ish pulse near the centre,
// jittered by noise. Returned as an SVG polyline points string in a 100x1 box.
function pulseTrace(rng: () => number, width: number, jitter: number) {
  const N = 60;
  const centre = 0.5 + (rng() - 0.5) * 0.06;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    const g = Math.exp(-((x - centre) ** 2) / (2 * width * width));
    const noise = (rng() - 0.5) * jitter;
    const y = 1 - Math.min(1, Math.max(0, g + noise)); // 0 top, 1 bottom
    pts.push(`${Math.round(x * 1000) / 10},${Math.round(y * 1000) / 10}`);
  }
  return pts.join(" ");
}

const ROWS = (() => {
  const r = mulberry32(31);
  return Array.from({ length: 14 }, (_, i) => ({
    pts: pulseTrace(r, 0.05 + r() * 0.03, 0.22 - i * 0.008),
    o: 0.28 + (i / 14) * 0.6,
  }));
})();

export function PulsarPanel({
  children,
  pad = "34px 30px 24px",
  radius = 18,
}: {
  children: React.ReactNode;
  pad?: string;
  radius?: number;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: radius, border: "1px solid var(--radio-border)", background: "var(--radio-bg)", padding: pad, color: "var(--radio-ink-soft)" }}>
      {/* stacked pulse-profile motif, top-right */}
      <svg className="neo-sky" viewBox="0 0 100 100" width="46%" height="100%" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", right: 0, top: 0, opacity: 0.9 }}>
        {ROWS.map((row, i) => (
          <polyline
            key={i}
            points={row.pts}
            fill="none"
            stroke="var(--radio-pulse)"
            strokeWidth={0.7}
            opacity={row.o}
            transform={`translate(0 ${6 + i * 6.2}) scale(1 0.09)`}
          />
        ))}
      </svg>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
