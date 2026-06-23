import katex from "katex";

// Server-rendered KaTeX. renderToString runs at build/SSR time, so the output is
// deterministic HTML with zero client JS and no hydration mismatch. throwOnError is off
// so a typo degrades to red source text instead of crashing the page.
function render(tex: string, displayMode: boolean) {
  return katex.renderToString(tex, {
    displayMode,
    throwOnError: false,
    strict: false,
    output: "htmlAndMathml",
  });
}

// Inline math: <M>{String.raw`R^2 = 1 - \frac{SSR}{SST}`}</M>
export function M({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: render(children, false) }} />;
}

// Display (centered block) math, styled to match the old mathBlock panel.
export function MathBlock({ children }: { children: string }) {
  return (
    <div
      style={{
        background: "var(--canvas)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "14px 18px",
        margin: "0.9rem 0 1.3rem",
        overflowX: "auto",
        color: "var(--ink)",
      }}
      dangerouslySetInnerHTML={{ __html: render(children, true) }}
    />
  );
}
