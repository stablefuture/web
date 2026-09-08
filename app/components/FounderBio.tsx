export function FounderBio() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-3xl font-extrabold tracking-tight text-ink">Who we are</h2>
      <div className="grid gap-10 sm:grid-cols-[13rem_1fr] sm:items-start">
        <figure className="mx-auto w-56 sm:mx-0 sm:w-full">
          <div className="relative">
            <div aria-hidden className="absolute inset-0 -translate-x-3 -translate-y-3 rounded-2xl bg-accent/20" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ben-grime.jpg"
              alt="Ben Grime"
              width={797}
              height={900}
              className="relative w-full rounded-2xl"
            />
          </div>
          <figcaption className="mt-4 text-sm leading-snug">
            <span className="block font-semibold text-ink">Ben Grime</span>
            <span className="text-muted">Founder</span>
          </figcaption>
        </figure>
        <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
          <p>
            Stable Future was founded by Ben Grime, an AI consultant based in
            the UK with a BA in Maths and Philosophy and an MSc in
            Data Science.
          </p>
          <p>
            After two years as an AI Engineer, Ben left to work on the
            problems society will face in the AI era.
          </p>
        </div>
      </div>
    </section>
  );
}
