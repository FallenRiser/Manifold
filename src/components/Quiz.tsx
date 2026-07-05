"use client";

import { useState } from "react";

// Chapter checkpoint quiz (PROJECT.md §4 active-recall doctrine): 2–3
// instant-feedback questions at the end of each chapter. Retrieval beats
// re-reading — the reader commits to an answer before seeing the truth.

export type QuizQuestion = {
  q: React.ReactNode;
  options: string[];
  answer: number; // index into options
  explain: React.ReactNode; // shown after answering, right or wrong
};

export function Quiz({
  title = "Checkpoint",
  questions,
  accent = "var(--c-regression)",
}: {
  title?: string;
  questions: QuizQuestion[];
  accent?: string;
}) {
  const [picked, setPicked] = useState<(number | null)[]>(questions.map(() => null));

  const answered = picked.filter((p) => p !== null).length;
  const correct = picked.filter((p, i) => p === questions[i].answer).length;
  const done = answered === questions.length;

  return (
    <div
      style={{
        background: `color-mix(in srgb, ${accent} 5%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${accent} 22%, var(--border))`,
        borderRadius: 14,
        padding: "16px 18px",
        margin: "2rem 0 1.6rem",
      }}
    >
      <div className="font-display" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, marginBottom: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        Answer from memory before you move on — that&rsquo;s the part that makes it stick.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {questions.map((qq, qi) => {
          const p = picked[qi];
          const revealed = p !== null;
          return (
            <div key={qi}>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink)", lineHeight: 1.55, marginBottom: 8 }}>
                <span style={{ color: "var(--faint)", marginRight: 6 }}>{qi + 1}.</span>
                {qq.q}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {qq.options.map((opt, oi) => {
                  const isPick = p === oi;
                  const isAnswer = oi === qq.answer;
                  const border = revealed
                    ? isAnswer
                      ? "var(--good)"
                      : isPick
                        ? "var(--bad)"
                        : "var(--border)"
                    : "var(--border-strong)";
                  return (
                    <button
                      key={oi}
                      onClick={() => {
                        if (revealed) return;
                        setPicked((prev) => prev.map((v, i) => (i === qi ? oi : v)));
                      }}
                      disabled={revealed}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 10,
                        width: "100%",
                        textAlign: "left",
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        padding: "8px 11px",
                        borderRadius: 10,
                        border: `1px solid ${border}`,
                        background: revealed && isAnswer
                          ? "color-mix(in srgb, var(--good) 8%, var(--surface))"
                          : revealed && isPick
                            ? "color-mix(in srgb, var(--bad) 7%, var(--surface))"
                            : "var(--surface)",
                        color: "var(--ink)",
                        cursor: revealed ? "default" : "pointer",
                        opacity: revealed && !isPick && !isAnswer ? 0.55 : 1,
                        transition: "border-color 0.15s ease, opacity 0.2s ease",
                      }}
                    >
                      <span className="font-display" style={{ fontSize: 11.5, fontWeight: 600, color: revealed && isAnswer ? "var(--good)" : revealed && isPick ? "var(--bad)" : "var(--muted)", flexShrink: 0 }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span style={{ flex: 1 }}>{opt}</span>
                      {revealed && isAnswer && (
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--good)", flexShrink: 0 }}>✓</span>
                      )}
                      {revealed && isPick && !isAnswer && (
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--bad)", flexShrink: 0 }}>✗</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {revealed && (
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)", padding: "7px 2px 0 27px" }}>
                  {p === qq.answer ? (
                    <span style={{ color: "var(--good)", fontWeight: 500 }}>Right. </span>
                  ) : (
                    <span style={{ color: "var(--bad)", fontWeight: 500 }}>
                      Not quite — {String.fromCharCode(65 + qq.answer)}.{" "}
                    </span>
                  )}
                  {qq.explain}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {done && (
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 600, color: correct === questions.length ? "var(--good)" : "var(--ink)" }}>
            {correct} / {questions.length}.
          </span>{" "}
          {correct === questions.length
            ? "All of it stuck — carry on."
            : "Worth a skim back over the ones you missed before moving on — the next chapter builds on them."}
        </div>
      )}
    </div>
  );
}
