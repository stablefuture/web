"use client";

import { usePathname } from "next/navigation";

// The landing page and lead magnet carry their own minimal navigation.
// Remaining tools (Pathfinder, talk form) keep the shared header and footer.
const BARE = ["/ai-career-check", "/privacy"];

export function SiteChrome({ header, footer, children }: { header: React.ReactNode; footer: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const bare = pathname === "/" || BARE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return <>{!bare && header}{children}{!bare && footer}</>;
}
