import Link from "next/link";

// Shared lesson-page primitives (PROJECT.md §10.5). Every lesson page uses these
// instead of copy-pasted inline styles, so global design changes are one-file edits.

export function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: `color-mix(in srgb, ${color} 13%, var(--surface))`,
        color,
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

export function LessonHeader({
  chips,
  time,
  title,
  intro,
  titleSize = 40,
  introSize = 17,
}: {
  chips: { label: React.ReactNode; color: string }[];
  /** e.g. "about 6 minutes" — rendered as "· about 6 minutes" */
  time?: string;
  title: React.ReactNode;
  intro: React.ReactNode;
  titleSize?: number;
  introSize?: number;
}) {
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        {chips.map((c, i) => (
          <Chip key={i} color={c.color}>{c.label}</Chip>
        ))}
        {time && <span style={{ fontSize: 12, color: "var(--faint)" }}>· {time}</span>}
      </div>
      <h1
        className="font-serif"
        style={{ fontSize: titleSize, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}
      >
        {title}
      </h1>
      <p style={{ fontSize: introSize, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        {intro}
      </p>
    </>
  );
}

export function Callout({
  color,
  title,
  children,
}: {
  color: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} 9%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${color} 22%, var(--border))`,
        borderRadius: 12,
        padding: "13px 15px",
        margin: "1.8rem 0",
      }}
    >
      <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function PrevNext({
  prev,
  next,
}: {
  prev?: { href: string; label: React.ReactNode };
  next?: { href: string; label: React.ReactNode };
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 40,
        paddingTop: 16,
        borderTop: "1px solid var(--border)",
      }}
    >
      {prev ? (
        <Link href={prev.href} style={{ fontSize: 14, color: "var(--brand)", textDecoration: "none" }}>
          {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} style={{ fontSize: 14, fontWeight: 600, color: "var(--brand)", textDecoration: "none", textAlign: "right" }}>
          {next.label}
        </Link>
      )}
    </div>
  );
}
