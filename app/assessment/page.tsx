import type { Metadata } from "next";
import Assessment from "./Assessment";

export const metadata: Metadata = {
  title: "Pathfinder | Stable Future",
  description: "Pathfinder helps students and young people explore careers that suit their interests, qualifications, and views on AI.",
  alternates: { canonical: "/pathfinder" },
  robots: { index: false, follow: false },
};

export default function AssessmentPage() { return <Assessment />; }
