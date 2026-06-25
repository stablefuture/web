import { type CSSProperties } from "react";

// The brand SVGs are masked so the artwork colour follows `currentColor` —
// set the colour with a text-* class on the caller (e.g. text-ink, text-white).
function maskStyle(src: string, ratio: string): CSSProperties {
  return {
    display: "block",
    aspectRatio: ratio,
    backgroundColor: "currentColor",
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };
}

export function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Stable Future"
      className={className}
      style={maskStyle("/sf-mark.svg", "1033 / 1299")}
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Stable Future"
      className={className}
      style={maskStyle("/sf-wordmark.svg", "716 / 234")}
    />
  );
}
