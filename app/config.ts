// Edit these as they become available. Empty values are handled gracefully:
// - VSL_URL empty → hero shows a tasteful placeholder frame, not a broken embed.
// - BOOKING_URL empty → application confirmation shows "we'll be in touch"
//   instead of a "book your call" button.
// - SCARCITY_ENABLED false → scarcity section is hidden entirely.

// Embeddable video URL (YouTube/Vimeo/Loom embed src). Leave empty until ready.
export const VSL_URL = "";

// Booking link (Calendly / TidyCal). Leave empty until ready.
export const BOOKING_URL = "https://cal.eu/ben-grime/strategy-call";

// Scarcity section: hidden when false. Copy must be truthful — no fake
// "SOLD OUT", no invented cohort numbers, no countdown timers.
export const SCARCITY_ENABLED = false;
export const SCARCITY_TEXT =
  "We work with a limited number of families at a time, so every plan gets proper attention. If the calendar's open, you can book.";

// Link-preview image (app/opengraph-image.jpg). Pages that set their own
// openGraph must list it, because Next.js replaces the inherited openGraph.
export const SHARE_IMAGE = { url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "Stable Future: How does AI impact your career path? Career advice for families navigating AI." };
