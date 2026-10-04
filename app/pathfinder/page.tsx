import type { Metadata } from "next";
import Pathfinder from "./Pathfinder";

export const metadata: Metadata = {
  title: "Pathfinder | Stable Future",
  description: "Pathfinder helps students and young people explore careers that suit their interests, qualifications, and views on AI.",
  alternates: { canonical: "/pathfinder" },
  robots: { index: false, follow: false },
};

export default function PathfinderPage() { return <Pathfinder />; }
