"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const cases = [
  { id: "A", title: "Startup Revenue", href: "/learn/linear-regression/end-to-end-worked-case/startup-revenue" },
  { id: "B", title: "House Prices", href: "/learn/linear-regression/end-to-end-worked-case/house-prices" },
  { id: "C", title: "Medical Costs", href: "/learn/linear-regression/end-to-end-worked-case/medical-costs" },
];

export function CaseTracker() {
  const pathname = usePathname();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "16px 20px",
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      marginBottom: 32,
    }}>
      <Link href="/learn/linear-regression/end-to-end-worked-case" style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: "var(--ink)", 
        textDecoration: "none",
        marginRight: 12
      }}>
        Overview
      </Link>
      
      {cases.map((c, i) => {
        const isActive = pathname === c.href;
        const isPast = cases.findIndex(x => x.href === pathname) > i;
        
        return (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 1, background: "var(--border)" }} />
            <Link
              href={c.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                opacity: isActive ? 1 : 0.6,
                transition: "opacity 0.2s"
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: isActive || isPast ? "var(--brand)" : "transparent",
                border: isActive || isPast ? "1px solid var(--brand)" : "1px solid var(--muted)",
                color: isActive || isPast ? "white" : "var(--muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
              }}>
                {isPast ? "✓" : c.id}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500, color: isActive ? "var(--brand)" : "var(--ink)" }}>
                {c.title}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
