"use client";

import { useEffect, useRef, useState } from "react";

// k-means as a vector quantizer. We synthesize a colourful image, treat every
// pixel as a point in 3-D RGB space, run k-means to find k representative colours,
// then repaint each pixel with its cluster's colour. Lower k = smaller palette =
// more visible banding. All client-side on a <canvas>.

const SIZE = 132;
const KS = [2, 4, 8, 16];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// a synthetic image: overlapping radial colour blobs + a gradient
function paintSource(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  g.addColorStop(0, "#1b3a6b"); g.addColorStop(1, "#0a8f6f");
  ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE);
  const blobs = [
    { x: 38, y: 40, r: 46, c: "rgba(228,126,48,0.9)" },
    { x: 96, y: 54, r: 40, c: "rgba(196,64,96,0.85)" },
    { x: 64, y: 104, r: 50, c: "rgba(240,206,84,0.8)" },
    { x: 104, y: 100, r: 34, c: "rgba(120,84,168,0.85)" },
  ];
  for (const b of blobs) {
    const rg = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.r);
    rg.addColorStop(0, b.c); rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, SIZE, SIZE);
  }
}

function quantize(data: Uint8ClampedArray, k: number): { palette: number[][]; assign: Uint8Array } {
  const n = data.length / 4;
  const rand = mulberry32(99 + k);
  // k-means++ seeding in RGB
  const px = (i: number) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
  const cents: number[][] = [px(Math.floor(rand() * n))];
  while (cents.length < k) {
    const d2 = new Float64Array(n);
    let tot = 0;
    for (let i = 0; i < n; i++) {
      const p = px(i); let best = Infinity;
      for (const c of cents) { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < best) best = d; }
      d2[i] = best; tot += best;
    }
    let r = rand() * tot, idx = n - 1;
    for (let i = 0; i < n; i++) { r -= d2[i]; if (r <= 0) { idx = i; break; } }
    cents.push(px(idx));
  }
  // Lloyd iterations
  const assign = new Uint8Array(n);
  for (let it = 0; it < 12; it++) {
    for (let i = 0; i < n; i++) {
      const p = px(i); let best = 0, bd = Infinity;
      for (let j = 0; j < k; j++) { const c = cents[j]; const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } }
      assign[i] = best;
    }
    const sum = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) { const j = assign[i]; sum[j][0] += data[i * 4]; sum[j][1] += data[i * 4 + 1]; sum[j][2] += data[i * 4 + 2]; sum[j][3]++; }
    for (let j = 0; j < k; j++) if (sum[j][3] > 0) cents[j] = [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]];
  }
  return { palette: cents.map((c) => c.map(Math.round)), assign };
}

export function ColorQuantizeLab() {
  const srcRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(4);
  const [palette, setPalette] = useState<number[][]>([]);

  useEffect(() => {
    const src = srcRef.current, out = outRef.current;
    if (!src || !out) return;
    const sctx = src.getContext("2d", { willReadFrequently: true })!;
    paintSource(sctx);
    const img = sctx.getImageData(0, 0, SIZE, SIZE);
    const { palette: pal, assign } = quantize(img.data, k);
    const o = new ImageData(SIZE, SIZE);
    for (let i = 0; i < assign.length; i++) {
      const c = pal[assign[i]];
      o.data[i * 4] = c[0]; o.data[i * 4 + 1] = c[1]; o.data[i * 4 + 2] = c[2]; o.data[i * 4 + 3] = 255;
    }
    out.getContext("2d")!.putImageData(o, 0, 0);
    setPalette(pal);
  }, [k]);

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Compress the palette to k colours</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>k =</span>
          {KS.map((kk) => <button key={kk} onClick={() => setK(kk)} style={chip(k === kk)}>{kk}</button>)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <figure style={fig}>
          <canvas ref={srcRef} width={SIZE} height={SIZE} style={canvas} />
          <figcaption style={cap}>original — thousands of colours</figcaption>
        </figure>
        <figure style={fig}>
          <canvas ref={outRef} width={SIZE} height={SIZE} style={canvas} />
          <figcaption style={cap}>quantized — {k} colours</figcaption>
        </figure>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 5 }}>learned palette (the k centroids):</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {palette.map((c, i) => (
            <div key={i} title={`rgb(${c[0]}, ${c[1]}, ${c[2]})`} style={{ width: 22, height: 22, borderRadius: 5, background: `rgb(${c[0]},${c[1]},${c[2]})`, border: "1px solid var(--border-strong)" }} />
          ))}
        </div>
      </div>

      <div style={caption}>
        Each pixel is a point in 3-D RGB space; k-means finds the <strong>k</strong> colours that best
        represent the whole image, then every pixel is repainted with its cluster&rsquo;s colour. This is{" "}
        <em>vector quantization</em> — the centroids are a learned palette. Drop k and the image needs
        fewer bits to store (the basis of indexed-colour formats like GIF), at the cost of visible
        banding.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.55 };
const fig: React.CSSProperties = { margin: 0, textAlign: "center" };
const canvas: React.CSSProperties = { width: 150, height: 150, borderRadius: 8, border: "1px solid var(--border-strong)", imageRendering: "pixelated", display: "block" };
const cap: React.CSSProperties = { fontSize: 11, color: "var(--muted)", marginTop: 5 };
function chip(active: boolean): React.CSSProperties {
  return { fontSize: 12, width: 28, height: 26, borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? "var(--c-clustering)" : "var(--border-strong)"}`, background: active ? "var(--c-clustering)" : "transparent", color: active ? "white" : "var(--muted)" };
}
