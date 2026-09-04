import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";

export const metadata = {
  title: "Stable Future | Career Advice for the AI Era",
  description:
    "Why AI will reshape work, which jobs resist it, and how to stay economically empowered. The thinking behind Stable Future's career checker.",
  alternates: { canonical: "/" },
};

// External links open in a new tab; internal ones stay in place.
function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="underline underline-offset-4 hover:text-ink"
    >
      {children}
    </a>
  );
}

function Figure({ src, alt, source }: { src: string; alt: string; source: React.ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full rounded-xl border border-border-soft"
        loading="lazy"
      />
      <figcaption className="text-xs text-muted">{source}</figcaption>
    </figure>
  );
}

function CheckerCta() {
  return (
    <p className="flex justify-center">
      <a
        href="/checker"
        className="inline-flex items-center gap-2 rounded-full bg-accent-strong px-7 py-4 text-base font-semibold text-on-accent shadow-lg shadow-accent/25 transition hover:-translate-y-0.5 hover:opacity-95 sm:text-lg"
      >
        Check your career path against AI
        <span aria-hidden>→</span>
      </a>
    </p>
  );
}

export default function Home() {
  return (
    <main>
      <Section as="section" tight>
        <Container narrow>
          <div className="flex flex-col gap-12">
            <CheckerCta />

            <section className="flex flex-col gap-12">
              <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  Work in the AI Era
                </h1>
                <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
                  <p>
                    Tech companies are in a trillion-dollar arms race to build
                    artificial general intelligence (AGI): an autonomous system
                    capable of automating almost all work. Whoever gets there will
                    gain trillions more.
                  </p>
                  <p>
                    There are strong reasons to believe this is achievable. There
                    has been rapid and exponential progress in AI&rsquo;s ability
                    to:
                  </p>
                  <ul className="flex flex-col gap-2 pl-5 [&>li]:list-disc">
                    <li>
                      Complete work across{" "}
                      <Ext href="https://artificialanalysis.ai/?intelligence=agentic-index&media-leaderboards=text-to-image&capability-index=agentic#capability-indices">
                        various sectors
                      </Ext>
                      .
                    </li>
                    <li>
                      Automate complex{" "}
                      <Ext href="https://metr.org/time-horizons/">
                        software engineering tasks
                      </Ext>
                      .
                    </li>
                    <li>
                      Solve{" "}
                      <Ext href="https://x.com/QiaochuYuan/status/2079087083663278170">
                        frontier maths problems
                      </Ext>
                      .
                    </li>
                    <li>
                      Automate{" "}
                      <Ext href="https://dashboard.safe.ai/#automation">
                        remote labour
                      </Ext>
                      , with significant progress occurring in <em>months</em>,
                      not years.
                    </li>
                    <li>
                      Use{" "}
                      <Ext href="https://osworld-v2.xlang.ai/">computers</Ext> for
                      real-world tasks.
                    </li>
                    <li>
                      Beat humans at{" "}
                      <Ext href="https://www.metaculus.com/">
                        forecasting global events
                      </Ext>
                      .
                    </li>
                    <li>
                      <Ext href="https://arxiv.org/abs/2606.16475">
                        Out-persuade
                      </Ext>{" "}
                      expert humans.
                    </li>
                  </ul>
                  <p>And many more.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                  The Intelligence Curse
                </h2>
                <Figure
                  src="/about-intelligence-curse.png"
                  alt="The five stages of the intelligence curse, from automation to human disempowerment."
                  source={
                    <>
                      Source: Luke Drago &amp; Rudolf Laine,{" "}
                      <Ext href="https://intelligence-curse.ai/">
                        The Intelligence Curse
                      </Ext>
                    </>
                  }
                />
                <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
                  <p>
                    In{" "}
                    <Ext href="https://intelligence-curse.ai/">
                      The Intelligence Curse
                    </Ext>
                    , Luke Drago and Rudolf Laine depict how this automation could
                    play out:
                  </p>
                  <ol className="flex flex-col gap-2 pl-6 [&>li]:list-decimal">
                    <li>
                      Powerful AI will push automation through existing
                      organisations, starting with entry-level hiring freezes and
                      moving upwards.
                    </li>
                    <li>
                      AI will outcompete even elite talent, ending social mobility
                      and the progress it drives.
                    </li>
                    <li>
                      Non-human factors of production (like capital, resources, and
                      control over AI) will become overwhelmingly more important
                      than humans.
                    </li>
                    <li>
                      This disincentivises powerful actors around the world (like
                      governments or leaders of organisations) to care about humans
                      as they are no longer required for productivity.
                    </li>
                    <li>
                      This could result in the disempowerment of the vast majority
                      of humanity.
                    </li>
                  </ol>
                  <p>
                    <Ext href="https://www.reveliolabs.com/ai-labor-market-tracker">
                      Stage 1 is already underway
                    </Ext>
                    , but the later stages are not an inevitability. They would
                    unfold over the coming decades. To put it mildly, we&rsquo;d
                    quite like to prevent this from happening.
                  </p>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                A Solution to Disempowerment
              </h2>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
                <p>
                  Whilst AI&rsquo;s capabilities are progressing exponentially in
                  some domains, progress remains slow in others. We call this{" "}
                  <Ext href="https://x.com/karpathy/status/1816531576228053133?lang=en">
                    jagged intelligence
                  </Ext>
                  . Whilst they might be superintelligent coders, AI still
                  can&rsquo;t reliably{" "}
                  <Ext href="https://clockbench.ai/">tell the time</Ext>. And even
                  when AI catches up to humans at reading clocks or other niche
                  tasks, it&rsquo;s often only because once a failure becomes a
                  viral meme, it becomes a target to train for.
                </p>
              </div>
              <Figure
                src="/about-jagged-intelligence.png"
                alt="A jagged profile of AI capability across different tasks."
                source={
                  <>
                    Source: Ethan Mollick,{" "}
                    <Ext href="https://www.oneusefulthing.org/p/the-shape-of-ai-jaggedness-bottlenecks">
                      The Shape of AI: Jaggedness, Bottlenecks and Salients
                    </Ext>
                  </>
                }
              />
              <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
                <p>
                  Which brings us to our final trillion-dollar question: which
                  tasks will AI struggle with not just now, but in the future? As
                  always, the answer lies in the data.
                </p>
                <p>
                  For AI to become human-level in any given domain, it needs to
                  learn from good data. This is known as Reinforcement Learning
                  (RL). All this means is:
                </p>
                <ol className="flex flex-col gap-2 pl-6 [&>li]:list-decimal">
                  <li>Show the AI model a problem, like a maths problem.</li>
                  <li>
                    Ask it to solve the problem and compare its answer with the
                    real one.
                  </li>
                  <li>
                    If the answer is correct, reward the model so it&rsquo;s more
                    likely to produce that answer next time (reinforce the
                    learning).
                  </li>
                  <li>Repeat.</li>
                </ol>
                <p>
                  For example, AI will struggle with care work because it&rsquo;s
                  a messy domain; it&rsquo;s hard to measure what good care work
                  is, hard to convert that into the raw data required for
                  rewarding the model, and very expensive to collect the data even
                  if you wanted to (you need Human Feedback, RLHF). Compare this
                  to software development, a highly structured and digital domain;
                  code itself is data, there&rsquo;s loads of it, AI can generate
                  more of it at near-zero cost, and performance is easy to measure
                  (it either runs or it doesn&rsquo;t, and the fewer lines of code
                  the better, so the Rewards are already Verifiable, RLVR, with no
                  human needed).
                </p>
                <p>
                  This variance in available training data creates differing
                  capabilities. In reality, the &ldquo;jagged frontier&rdquo;
                  looks something like this:
                </p>
              </div>
              <Figure
                src="/about-jagged-frontier.png"
                alt="The jagged frontier of AI task performance across occupations."
                source={
                  <>
                    Source:{" "}
                    <Ext href="https://www.anthropic.com/research/labor-market-impacts">
                      Anthropic
                    </Ext>
                  </>
                }
              />
              <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
                <p>
                  As AI expands into the contours of verifiable domains, we can
                  remain economically empowered in two ways.
                </p>
                <ol className="flex flex-col gap-2 pl-6 [&>li]:list-decimal">
                  <li>
                    Go where AI can&rsquo;t (i.e. jobs that resist the
                    reinforcement learning required to train AI).
                  </li>
                  <li>
                    Go where humans using AI beat AI on its own (i.e. jobs
                    that resist substitution by AI).
                  </li>
                </ol>
                <p>
                  This creates our two key measures: AI Learnability and
                  AI substitution.
                </p>
                <ul className="flex flex-col gap-2 pl-5 [&>li]:list-disc">
                  <li>Surgeons are low learnability, low AI substitution.</li>
                  <li>
                    Accountants are high learnability, high AI substitution: we
                    won&rsquo;t need junior accountants much longer.
                  </li>
                </ul>
              </div>
            </section>

            <CheckerCta />
          </div>
        </Container>
      </Section>
    </main>
  );
}
