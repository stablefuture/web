"use client";

import { useState } from "react";
import { Mark } from "@/app/components/Logo";

type Props = {
  problems: string[];
  outcomes: string[];
};

export function Comparison({ problems, outcomes }: Props) {
  const [side, setSide] = useState<"alone" | "with">("alone");
  const withActive = side === "with";
  const items = withActive ? outcomes : problems;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Segmented toggle — trend icons signal the stakes of each path. */}
      <div
        role="tablist"
        aria-label="Compare paths"
        className="inline-flex rounded-full border border-border-soft bg-surface-alt p-1 shadow-sm"
      >
        <button
          role="tab"
          aria-selected={!withActive}
          type="button"
          onClick={() => setSide("alone")}
          className={[
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-200 ease-out sm:px-7 sm:text-base",
            !withActive
              ? "bg-ink text-background shadow"
              : "text-muted hover:text-ink",
          ].join(" ")}
        >
          <TrendDown className="h-4 w-4" />
          On your own
        </button>
        <button
          role="tab"
          aria-selected={withActive}
          type="button"
          onClick={() => setSide("with")}
          className={[
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-200 ease-out sm:px-7 sm:text-base",
            withActive
              ? "bg-accent-strong text-on-accent shadow-[0_0_28px_-4px_#a855f7]"
              : "text-accent-strong hover:bg-accent-strong/90 hover:text-on-accent hover:shadow-[0_0_24px_-6px_#a855f7]",
          ].join(" ")}
        >
          <TrendUp className="h-4 w-4" />
          With Stable Future
        </button>
      </div>

      {/* Card — gradient + glow invites the "with us" path; flat dark for "alone". */}
      <div
        key={side}
        className={[
          "sf-fade-in w-full rounded-3xl border p-8 text-white shadow-xl sm:p-10",
          withActive
            ? "border-accent/40 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 shadow-[0_0_70px_-18px_#a855f7]"
            : "border-border-soft bg-brand-950",
        ].join(" ")}
      >
        <div className="mb-6 flex items-center gap-3">
          {withActive && <Mark className="h-8 text-white" />}
          <h3 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            {withActive ? "With Stable Future" : "On your own"}
          </h3>
        </div>
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-4">
              <StatusMark kind={withActive ? "check" : "cross"} />
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

function StatusMark({ kind }: { kind: "cross" | "check" }) {
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
      className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
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

function TrendDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 7 9 13 13 10 21 18" />
      <polyline points="15 18 21 18 21 12" />
    </svg>
  );
}

function TrendUp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 17 9 11 13 14 21 6" />
      <polyline points="15 6 21 6 21 12" />
    </svg>
  );
}
