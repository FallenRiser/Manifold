"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastVisit, type LastVisit } from "@/lib/progress";

// "Continue where you left off" — rendered on the landing page once the reader
// has opened any lesson. Loads after mount, so first-time visitors see nothing.

export function ContinueCard() {
  const [last, setLast] = useState<LastVisit | null>(null);

  useEffect(() => {
    setLast(getLastVisit());
  }, []);

  if (!last) return null;

  return (
    <Link
      href={last.path}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        marginTop: 22,
        padding: "9px 16px 9px 12px",
        background: "var(--surface)",
        border: `1px solid color-mix(in srgb, ${last.accent} 30%, var(--border))`,
        borderRadius: 12,
        textDecoration: "none",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: last.accent, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "var(--muted)" }}>
        Continue <span style={{ color: "var(--ink)", fontWeight: 500 }}>{last.trackTitle}</span> · {last.pageTitle} →
      </span>
    </Link>
  );
}
