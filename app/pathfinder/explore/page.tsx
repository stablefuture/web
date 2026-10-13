import type { Metadata } from "next";
import Pathfinder from "../Pathfinder";

// Internal: the earlier self-serve explorer. Families now answer the questions at /pathfinder only.
export const metadata: Metadata = { title: "Pathfinder explorer | Stable Future", robots: { index: false, follow: false } };

export default function PathfinderExplorePage() { return <Pathfinder />; }
