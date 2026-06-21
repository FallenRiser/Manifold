export function LossLandscapeArt() {
  return (
    <svg
      viewBox="0 0 260 232"
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="An abstract loss-landscape: nested contour rings with a path descending to the minimum."
    >
      <defs>
        <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand)" stopOpacity="0.16" />
          <stop offset="0.38" stopColor="var(--brand-2)" stopOpacity="0.13" />
          <stop offset="0.7" stopColor="var(--c-fundamentals)" stopOpacity="0.12" />
          <stop offset="1" stopColor="var(--c-clustering)" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="260" height="232" rx="14" fill="url(#wash)" />
      <g transform="rotate(-12 162 138)" fill="none" stroke="var(--ink)" strokeWidth="1.1">
        <ellipse cx="158" cy="140" rx="112" ry="92" strokeOpacity="0.1" />
        <ellipse cx="160" cy="138" rx="92" ry="75" strokeOpacity="0.13" />
        <ellipse cx="162" cy="137" rx="72" ry="59" strokeOpacity="0.16" />
        <ellipse cx="164" cy="136" rx="54" ry="44" strokeOpacity="0.19" />
        <ellipse cx="165" cy="135" rx="38" ry="31" strokeOpacity="0.22" />
        <ellipse cx="166" cy="135" rx="24" ry="19" strokeOpacity="0.26" />
        <ellipse cx="167" cy="134" rx="12" ry="9.5" strokeOpacity="0.32" />
      </g>
      <g fill="none" stroke="var(--ink)" strokeWidth="1" strokeOpacity="0.14">
        <ellipse cx="58" cy="58" rx="34" ry="26" transform="rotate(18 58 58)" />
        <ellipse cx="58" cy="58" rx="20" ry="15" transform="rotate(18 58 58)" />
        <ellipse cx="58" cy="58" rx="8" ry="6" transform="rotate(18 58 58)" />
      </g>
      <path
        d="M44,46 C 78,66 78,104 116,118 S 150,132 165,134"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      <circle cx="44" cy="46" r="2.4" fill="var(--brand)" />
      <circle cx="96" cy="96" r="2.2" fill="var(--brand)" />
      <circle cx="134" cy="124" r="2.2" fill="var(--brand-2)" />
      <circle cx="166" cy="134" r="3.4" fill="var(--brand-3)" />
    </svg>
  );
}
