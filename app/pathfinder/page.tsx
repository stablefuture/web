import type { Metadata } from "next";
import Questions from "./Questions";

export const metadata: Metadata = {
  title: "Pathfinder | Stable Future",
  description: "Pathfinder: quick questions about your interests, strengths, and goals, so Ben can prepare your results call.",
  alternates: { canonical: "/pathfinder" },
  robots: { index: false, follow: false },
};

export default function PathfinderPage() { return <Questions />; }
