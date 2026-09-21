"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  ["Career checker", "/checker"],
  ["Graduate destinations", "/destinations"],
  ["About", "/about"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="site-header">
      <Link href="/" aria-label="Stable Future — home" className="site-brand" onClick={() => setOpen(false)}>stable future<span aria-hidden="true">↗</span></Link>
      <nav aria-label="Primary" className="site-nav">
        {NAV.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
      </nav>
      <a href="/talk" className="site-contact">Let’s talk <span aria-hidden="true">↗</span></a>
      <button type="button" className="site-menu-button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}<span aria-hidden="true">{open ? "−" : "+"}</span></button>
      {open && <nav id="mobile-nav" aria-label="Mobile navigation" className="site-mobile-nav">
        {NAV.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}<span aria-hidden="true">↗</span></Link>)}
      </nav>}
    </header>
  );
}
