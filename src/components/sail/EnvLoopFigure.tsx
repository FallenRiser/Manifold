// The agent–environment boundary as a picture: who owns what, and the two calls that cross the line.

export function EnvLoopFigure() {
  const W = 640, H = 250;
  const boxStyle = (x: number, c: string) => ({ x, y: 40, width: 220, height: 170, rx: 14, fill: `color-mix(in srgb, ${c} 7%, var(--surface))`, stroke: `color-mix(in srgb, ${c} 45%, var(--border))` });
  const item = (x: number, y: number, t: string) => <text x={x} y={y} fontSize={12.5} fill="var(--muted)">• {t}</text>;
  return (
    <figure style={{ margin: "1.2rem 0 1.5rem" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label="The agent sends an action; the environment returns obs, reward, terminated, truncated and info">
        <defs>
          <marker id="loop-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
          </marker>
        </defs>
        <rect {...boxStyle(20, "var(--c-regression)")} />
        <text x={40} y={70} fontSize={15} fontWeight={600} fill="var(--ink)">The agent owns</text>
        {item(40, 98, "its policy: obs → action")}
        {item(40, 122, "what it learns (a Q-table)")}
        {item(40, 146, "its own exploration randomness")}
        {item(40, 170, "nothing about the physics")}

        <rect {...boxStyle(400, "var(--c-rl)")} />
        <text x={420} y={70} fontSize={15} fontWeight={600} fill="var(--ink)">The environment owns</text>
        {item(420, 98, "the true state (x, y, h, u)")}
        {item(420, 122, "rules: physics, reward, endings")}
        {item(420, 146, "the clock")}
        {item(420, 170, "its own seeded random stream")}

        <path d="M245,92 C300,78 345,78 396,92" fill="none" stroke="var(--ink)" strokeWidth={1.6} markerEnd="url(#loop-arrow)" />
        <text x={320} y={72} fontSize={12.5} textAnchor="middle" fill="var(--ink)" fontFamily="ui-monospace, monospace">step(action)</text>

        <path d="M396,150 C345,166 300,166 245,150" fill="none" stroke="var(--ink)" strokeWidth={1.6} markerEnd="url(#loop-arrow)" />
        <text x={320} y={184} fontSize={11.5} textAnchor="middle" fill="var(--ink)" fontFamily="ui-monospace, monospace">obs, reward,</text>
        <text x={320} y={199} fontSize={11.5} textAnchor="middle" fill="var(--ink)" fontFamily="ui-monospace, monospace">terminated, truncated, info</text>

        <text x={320} y={20} fontSize={12} textAnchor="middle" fill="var(--faint)" fontFamily="ui-monospace, monospace">reset(seed) → (obs, info) starts each race</text>
        <path d="M320,26 C360,32 380,36 396,46" fill="none" stroke="var(--faint)" strokeWidth={1.2} strokeDasharray="4 3" markerEnd="url(#loop-arrow)" />
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", lineHeight: 1.5 }}>
        Only the two calls cross the line. <code>info</code> comes back too, but it is for you — your logs and tests — and never goes into the policy.
      </figcaption>
    </figure>
  );
}
