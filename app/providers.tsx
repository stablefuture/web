"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Pathfinder is a private, in-memory prototype, including for minors.
    if (["/assessment", "/pathfinder"].some(path => window.location.pathname.startsWith(path))) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key || key === "PLACEHOLDER") return;

    posthog.init(key, {
      api_host: host || "https://eu.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage",
      autocapture: { url_ignorelist: ["/assessment", "/pathfinder"] },
      session_recording: { blockSelector: "[data-private]", maskAllInputs: true },
      before_send: (event) => ["/assessment", "/pathfinder"].some(path => window.location.pathname.startsWith(path)) ? null : event,
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
