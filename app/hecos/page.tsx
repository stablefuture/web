import type { Metadata } from "next";
import { Container } from "../components/Container";
import data from "../../public/hecos.json";
import { HecosBrowser } from "./HecosBrowser";

export const metadata: Metadata = {
  title: "HECoS subjects | Stable Future",
  description: "Browse the HECoS subjects valid for Discover Uni 2025/26.",
  robots: { index: false, follow: false },
};

export default function HecosPage() {
  return (
    <main className="py-12 sm:py-16">
      <Container wide>
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Degree mapping research
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Browse HECoS subjects
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            All {data.metadata.validEntries.toLocaleString("en-GB")} entries valid for {data.metadata.collectionLabel}.
            This is the latest published HECoS list for that collection: {data.metadata.standardSubjects.toLocaleString("en-GB")} subject terms,
            plus one teacher-training admin code.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            The snapshot count only covers full-time first degrees that name the subject in a HECoS field.
            Discover Uni also records subjects in other fields, so this is a rough way to narrow the list: zero does not mean the subject has no courses or is obsolete.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Sources: {" "}
            <a className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900" href={data.metadata.sourceUrls.validEntries}>
              HESA 2025/26 valid entries
            </a>
            {" · "}
            <a className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900" href={data.metadata.sourceUrls.vocabulary}>
              HECoS v{data.metadata.hecosVersion}
            </a>
            {" · "}
            <a className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900" href={data.metadata.sourceUrls.mapping}>
              CAH v{data.metadata.cahVersion}
            </a>
          </p>
        </div>

        <HecosBrowser subjects={data.subjects} />
      </Container>
    </main>
  );
}
