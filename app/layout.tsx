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
    "Check any UK job, degree, or apprenticeship against real data on AI risk and pay. Career advice for students of all ages.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Stable Future | Is That Career Future-Proof? UK Job Data",
    description:
      "Search any UK job, degree, or apprenticeship. See its AI risk and pay from real data, not opinion.",
    url: "/",
    siteName: "Stable Future",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stable Future | Is That Career Future-Proof?",
    description:
      "Search any UK job, degree, or apprenticeship. Real data on AI risk and pay.",
  },
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
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
