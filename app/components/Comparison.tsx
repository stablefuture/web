"use client";

import { useState } from "react";

type Props = {
  problems: string[];
  outcomes: string[];
};

export function Comparison({ problems, outcomes }: Props) {
  const [side, setSide] = useState<"alone" | "with">("alone");
  const items = side === "alone" ? problems : outcomes;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Segmented pill toggle */}
      <div
        role="tablist"
        aria-label="Compare paths"
        className="inline-flex rounded-full border border-border-soft bg-surface-alt p-1 shadow-sm"
      >
        <button
          role="tab"
          aria-selected={side === "alone"}
          type="button"
          onClick={() => setSide("alone")}
          className={[
            "rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-200 ease-out sm:text-base sm:px-7",
            side === "alone"
              ? "bg-accent-strong text-on-accent shadow"
              : "text-muted hover:text-ink",
          ].join(" ")}
        >
          On your own
        </button>
        <button
          role="tab"
          aria-selected={side === "with"}
          type="button"
          onClick={() => setSide("with")}
          className={[
            "rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-200 ease-out sm:text-base sm:px-7",
            side === "with"
              ? "bg-accent-strong text-on-accent shadow"
              : "text-muted hover:text-ink",
          ].join(" ")}
        >
          With Stable Future
        </button>
      </div>

      {/* Card — key remount triggers the fade-in defined in globals.css */}
      <div
        key={side}
        className="sf-fade-in w-full rounded-3xl border border-border-soft bg-brand-950 p-8 text-white shadow-xl sm:p-10"
      >
        <h3 className="mb-6 text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
          {side === "alone" ? "On your own" : "With Stable Future"}
        </h3>
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-4">
              <Mark kind={side === "alone" ? "cross" : "check"} />
              <span className="text-base leading-relaxed text-white/90 sm:text-lg">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Mark({ kind }: { kind: "cross" | "check" }) {
  if (kind === "cross") {
    return (
      <span
        aria-hidden="true"
        className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l5 5 9-11" />
      </svg>
    </span>
  );
}
