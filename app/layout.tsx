import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SiteChrome } from "./components/SiteChrome";

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
  title: "Stable Future | Is your child’s career ready for AI?",
  description: "Career advice for families navigating AI, for students of any age.",
  openGraph: { siteName: "Stable Future", locale: "en_GB", type: "website" },
  twitter: { card: "summary_large_image" },
  // Google Search Console ownership (bengrime1@gmail.com). Keep, or verification lapses.
  verification: { google: "JZojDcX5sE7nKrbw5NOWeMG0x5I_4ZIQSOeM7ued1jY" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <SiteChrome header={<Header />} footer={<Footer />}>
            {children}
          </SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
