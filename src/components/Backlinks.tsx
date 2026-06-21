import Link from "next/link";

export function Backlinks({
  label = "Builds on",
  items,
}: {
  label?: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", margin: "14px 0 4px" }}>
      <span style={{ fontSize: 11.5, color: "var(--faint)", letterSpacing: "0.02em" }}>{label}:</span>
      {items.map((it) => (
        <Link key={it.href + it.label} href={it.href} className="backlink">
          {it.label}
        </Link>
      ))}
    </div>
  );
}
