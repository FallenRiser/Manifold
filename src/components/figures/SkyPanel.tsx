// Reusable "deep-space" section for the asteroid-hazard capstone. An always-dark
// panel (dark even in light mode — that's the point) with a deterministic starfield
// that fades in ONCE on load (see .neo-sky in globals.css; reduced-motion neutralises
// it) and an optional orbit motif. Used sparingly for special moments — the index
// hero, act openers, the transfer-test intros — so the main editorial surface stays
// the norm and the sky stays special by contrast. All colours are --space-* tokens.

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStars(seed: number, n: number) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => ({
    x: Math.round(r() * 1000) / 10,
    y: Math.round(r() * 1000) / 10,
    rr: Math.round((0.4 + r() * 1.3) * 100) / 100,
    o: Math.round((0.15 + r() * 0.6) * 100) / 100,
  }));
}

export function SkyPanel({
  children,
  motif = false,
  seed = 7,
  stars = 70,
  pad = "34px 30px 22px",
  radius = 18,
}: {
  children: React.ReactNode;
  motif?: boolean;
  seed?: number;
  stars?: number;
  pad?: string;
  radius?: number;
}) {
  const STARS = makeStars(seed, stars);
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: radius, border: "1px solid var(--space-border)", background: "var(--space-sky)", padding: pad, color: "var(--space-ink-soft)" }}>
      <svg className="neo-sky" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.rr * 0.18} fill="var(--space-star)" opacity={s.o} />
        ))}
      </svg>
      {motif && (
        <svg viewBox="0 0 200 200" width="180" height="180" aria-hidden="true" style={{ position: "absolute", right: -22, top: -26, opacity: 0.5 }}>
          <ellipse cx="100" cy="100" rx="86" ry="34" fill="none" stroke="var(--space-safe)" strokeWidth="1" opacity="0.5" transform="rotate(-24 100 100)" />
          <ellipse cx="100" cy="100" rx="60" ry="60" fill="none" stroke="var(--space-orbit)" strokeWidth="1" opacity="0.5" />
          <circle cx="100" cy="100" r="9" fill="var(--c-regression)" opacity="0.85" />
          <circle cx="171" cy="83" r="3.2" fill="var(--space-haz)" />
        </svg>
      )}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
