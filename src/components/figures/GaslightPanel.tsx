// Reusable "gaslight" section for the Lies-of-P imitation capstone — its equivalent of
// the asteroid capstone's SkyPanel. An always-dark soot-black room (dark even in light
// mode: that's the point) with deterministic ash motes that fade in ONCE on load, an
// optional lamp glow, and an optional marionette-string motif.
//
// Used sparingly — the index hero, act openers, the results banner — so the editorial
// surface stays the norm and the room stays special by contrast. All colours are
// --krat-* tokens (globals.css). Everything here is original geometry: no game art, no
// logo, no screenshot — the capstone documents a project, it does not reproduce a game.

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeAsh(seed: number, n: number) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => ({
    x: Math.round(r() * 1000) / 10,
    y: Math.round(r() * 1000) / 10,
    rr: Math.round((0.3 + r() * 1.5) * 100) / 100,
    o: Math.round((0.12 + r() * 0.55) * 100) / 100,
  }));
}

export function GaslightPanel({
  children,
  motif = false,
  seed = 11,
  motes = 80,
  pad = "34px 30px 22px",
  radius = 18,
}: {
  children: React.ReactNode;
  motif?: boolean;
  seed?: number;
  motes?: number;
  pad?: string;
  radius?: number;
}) {
  const ASH = makeAsh(seed, motes);
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radius,
        border: "1px solid var(--krat-border)",
        background: "var(--krat-soot)",
        padding: pad,
        color: "var(--krat-ink-soft)",
      }}
    >
      {/* the lamp: a warm pool of light falling from the upper left */}
      <div
        className="krat-lamp"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 12% -10%, color-mix(in srgb, var(--krat-brass) 22%, transparent), transparent 62%)",
        }}
      />
      <svg className="krat-ash" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        {ASH.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.rr * 0.16} fill="var(--krat-ash)" opacity={s.o} />
        ))}
      </svg>

      {motif && (
        <svg viewBox="0 0 200 200" width="190" height="190" aria-hidden="true" style={{ position: "absolute", right: -14, top: -30, opacity: 0.55 }}>
          {/* a marionette control bar and its strings — the capstone's thesis in one glyph:
              something is being driven from above, and the strings have slack (latency). */}
          <g stroke="var(--krat-brass)" strokeWidth="1.1" fill="none" opacity="0.85">
            <line x1="52" y1="34" x2="148" y2="22" strokeWidth="3" strokeLinecap="round" />
            <line x1="76" y1="88" x2="66" y2="29" />
            <line x1="104" y1="96" x2="100" y2="26" />
            <line x1="132" y1="86" x2="134" y2="24" />
          </g>
          <g fill="var(--krat-brass-dim)" opacity="0.9">
            <circle cx="76" cy="90" r="3.4" />
            <circle cx="104" cy="98" r="3.4" />
            <circle cx="132" cy="88" r="3.4" />
          </g>
          <circle cx="104" cy="98" r="15" fill="none" stroke="var(--krat-ember)" strokeWidth="1" opacity="0.5" />
        </svg>
      )}

      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
