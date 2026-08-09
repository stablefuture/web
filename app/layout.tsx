import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stablefuture.uk"),
  title: "Stable Future | Is That Career Future-Proof? UK Job Data",
  description:
    "Check any UK job, degree or apprenticeship against real data on pay, openings, competition and AI learnability. Built for parents of teenagers deciding what comes next.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Stable Future | Is That Career Future-Proof? UK Job Data",
    description:
      "Search any UK job, degree or apprenticeship. See its pay, openings, competition and AI learnability from real data, not opinion.",
    url: "/",
    siteName: "Stable Future",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stable Future | Is That Career Future-Proof?",
    description:
      "Search any UK job, degree or apprenticeship. Real data on pay, openings, competition and AI learnability.",
  },
};

// Inline before-paint script: sets `.dark` on <html> based on stored choice
// (or prefers-color-scheme) so the page never paints in the wrong theme.
const themeInitScript = `(function(){try{var s=localStorage.getItem('sf-theme');var d=s?s==='dark':window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
