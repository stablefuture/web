import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";

export const metadata = {
  title: "Methodology | How the checker works",
  description:
    "How Stable Future scores every job on two measures, how much AI could learn to do and whether it would replace the worker, and where the numbers come from.",
  alternates: { canonical: "/methodology" },
};

// Short citations shown on hover at each marker, so a reader can see the source
// without jumping to the list at the bottom.
const SOURCES: Record<number, string> = {
  1: "Tomei, P. M. & Klein Teeselink, B. (2026). What Jobs Can AI Learn? Measuring Exposure by Reinforcement Learning. arXiv:2605.02598.",
  2: "Pizzinelli, C. et al. (2023). Labor Market Exposure to AI: Cross-country Differences and Distributional Implications. IMF Working Paper WP/23/216.",
  3: "O*NET 30.0 Database, National Center for O*NET Development (CC BY 4.0).",
  4: "Liu, Y., Wang, H. & Yu, S. (2025). Labor Demand in the Age of Generative AI. World Bank Policy Research Working Paper 11263.",
  5: "NFER, The Skills Imperative 2035. Used as a benchmark to check the US-UK mapping.",
  6: "NFER, The Skills Imperative 2035. Employment projections by occupation to 2035, used for the growth half of openings.",
  7: "ONS, Census 2021. Occupation by age, used for the retirement half of openings.",
  8: "HESA, Table 50 (DT051): HE qualifiers by subject and level, 2024/25. Undergraduate qualifiers only.",
  9: "DfE, Apprenticeships and traineeships. Starts by standard, 2024/25.",
};

function Sup({ n }: { n: number }) {
  return (
    <sup
      title={SOURCES[n]}
      className="cursor-help text-[0.65em] text-accent-strong underline decoration-dotted underline-offset-2"
    >
      {n}
    </sup>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-bold tracking-tight text-ink">{children}</h3>
  );
}

export default function Methodology() {
  return (
    <main>
      <Section as="section">
        <Container narrow>
          <div className="flex flex-col gap-5 text-base leading-relaxed text-muted">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              How the checker works
            </h1>
            <p>
              Written to be read by a student, a parent, a careers adviser, or a
              journalist checking our work.
            </p>

            <H2>The short version</H2>
            <p>
              Every job gets two underlying measures. The first is{" "}
              <strong className="text-ink">
                how much of the work AI could learn to do
              </strong>
              . The second is{" "}
              <strong className="text-ink">
                whether AI would replace the person doing it, or help them do it
                better
              </strong>
              .
            </p>
            <p>
              We combine these into a single{" "}
              <strong className="text-ink">risk</strong> score, so you can compare
              jobs at a glance. We still show the two measures behind it, because a
              job can score high on one and low on the other, and seeing that is
              often more useful than the combined number alone.
            </p>

            <H2>The two questions</H2>
            <p>
              <strong className="text-ink">
                AI learnability: how much of this job could AI learn to do?
              </strong>
            </p>
            <p>
              Every job is made of tasks. Some tasks a computer can practise at,
              over and over, until it gets good at them. Others it cannot.
              Learnability measures how much of a job is made of the first kind.
            </p>
            <p>
              <strong className="text-ink">
                Substitution: would AI replace the person, or help them?
              </strong>
            </p>
            <p>
              Some work is hard to hand over even when a computer could do the
              steps. Work where you are responsible for someone&rsquo;s safety.
              Work where a mistake is serious. Work where you decide what happens
              next. Substitution measures how little of that protection a job
              has.
            </p>
            <p>
              <strong className="text-ink">
                Both run the same way round: a higher score means more affected.
              </strong>
            </p>

            <H2>Where the numbers come from</H2>
            <H3>AI learnability</H3>
            <p>
              We use the <strong className="text-ink">RL Feasibility Index</strong>,
              published by Philip Moreira Tomei and Bouke Klein Teeselink.
              <Sup n={1} /> We use their published scores. We did not produce
              them, and we credit them on every figure.
            </p>
            <p>
              Here is what they did. They took{" "}
              <strong className="text-ink">17,951 tasks</strong> covering{" "}
              <strong className="text-ink">894 American job categories</strong>{" "}
              from O*NET, the US government&rsquo;s occupational database.
              <Sup n={3} /> An AI model rated each task on eight things, among
              them whether success can be checked automatically, and whether the
              work can be practised cheaply.
              <Sup n={1} />
            </p>
            <p>
              Tasks needing real physical presence are scored{" "}
              <strong className="text-ink">zero</strong>, deliberately.
              <Sup n={1} /> That is why hands-on trades score low. In our build,{" "}
              <strong className="text-ink">7,311 of the 17,951 tasks</strong>{" "}
              were scored this way.
            </p>
            <p>
              We then combine each job&rsquo;s tasks into one score, giving more
              weight to the tasks O*NET records as more important to that job.
              <Sup n={3} /> This is the same method the authors use.
              <Sup n={1} />
            </p>

            <H3>Substitution</H3>
            <p>
              This one we calculate ourselves, from public data, because no one
              publishes it as a finished file.
            </p>
            <p>
              The recipe comes from an International Monetary Fund working paper
              by Carlo Pizzinelli and colleagues.
              <Sup n={2} /> It uses <strong className="text-ink">eleven</strong>{" "}
              measures of what a job is actually like, plus the level of
              preparation it takes, all from O*NET.
              <Sup n={3} /> Things like: how much face-to-face work there is,
              whether you are responsible for other people&rsquo;s health and
              safety, how serious a mistake would be, and how much freedom you
              have to decide your own priorities.
            </p>
            <p>
              Those combine into six groups, and the six average into a single
              measure of how much a job{" "}
              <strong className="text-ink">protects</strong> the person doing it.
              We then flip it round, so a higher number means less protection,
              following Yan Liu, He Wang and Shu Yu at the World Bank, who use the
              measure this way.
              <Sup n={4} />
            </p>
            <p>
              Calculating it ourselves has an advantage: O*NET updates, and so
              can we. A published file would be frozen at 2023.
            </p>

            <H3>Why this measure is worth having</H3>
            <p>
              Liu, Wang and Yu tested it against{" "}
              <strong className="text-ink">285 million American job adverts</strong>{" "}
              posted between early 2018 and mid-2025. After ChatGPT launched,
              adverts for jobs above the halfway mark on substitution fell{" "}
              <strong className="text-ink">12%</strong> compared with jobs below
              it. The gap widened over time, from 6% in the first year to 18% by
              the third.
              <Sup n={4} />
            </p>
            <p>
              The roles hit hardest are the ones young people start in. Jobs
              asking for no advanced degree fell{" "}
              <strong className="text-ink">18%</strong>, and jobs asking for no
              lengthy experience fell <strong className="text-ink">20%</strong>.
              Administrative support fell <strong className="text-ink">40%</strong>
              .<Sup n={4} />
            </p>
            <p>
              That is their finding, on their American advert data, using their
              own cut-off. It is not a prediction about any UK job on this site,
              and our scores cannot reproduce it. We mention it because it is the
              only one of our two measures with published evidence about{" "}
              <strong className="text-ink">entry-level</strong> hiring
              specifically, which is who we are here for.
            </p>

            <H2>How we checked our working</H2>
            <p>
              The Pizzinelli paper names the jobs that should land at each end.
              <Sup n={2} /> When we rebuilt the measure,{" "}
              <strong className="text-ink">
                oral and maxillofacial surgeons
              </strong>{" "}
              came out as the most protected job and{" "}
              <strong className="text-ink">hand cutters and trimmers</strong> as
              the least, exactly as published, and the middle of our range
              matched too. If that test had failed, the build would have stopped.
            </p>
            <p>
              We also checked that weighting tasks by importance barely changes
              the ranking against treating every task equally. The two agree
              almost perfectly. So the ranking is not an artefact of how we
              weighted things.
            </p>
            <p>
              Our protection figures sit very slightly higher than the published
              ones, because we use a newer O*NET release. We leave that alone
              rather than adjusting it, because we publish{" "}
              <strong className="text-ink">ranks, not raw scores</strong>, and a
              small uniform shift cannot change a rank.
            </p>

            <H2>We show ranks, not raw scores</H2>
            <p>
              A job might read{" "}
              <em>&ldquo;more affected than 89% of jobs&rdquo;</em>. We do it this
              way because the raw numbers bunch up in the middle. Read literally
              they would suggest almost every job is fine, which is not what they
              mean. Ranks survive that problem. Raw numbers do not.
            </p>

            <H2>Openings and competition</H2>
            <p>
              Learnability and substitution describe the work. These two describe
              the market for it.
            </p>
            <H3>Openings</H3>
            <p>
              The number of jobs we expect to come free in a year. Two things
              create them:
            </p>
            <p>
              <strong className="text-ink">Growth.</strong> If an occupation is
              projected to be bigger in 2030 than in 2024, the difference is new
              jobs. We spread it evenly across the years.
              <Sup n={6} />
            </p>
            <p>
              <strong className="text-ink">Retirement.</strong> The larger
              source, and the one people miss. We take the share of the
              occupation currently aged 50 to 64 and spread it over the fifteen
              years until that group reaches 65.
              <Sup n={7} /> A third of nurses are in that band. Those jobs come
              free, and someone has to fill them.
            </p>
            <p>
              This is why an occupation full of older workers is often a good one
              to enter. It is about to hire.
            </p>
            <H3>Competition</H3>
            <p>
              Everyone entering an occupation in a year, divided by its openings.
              Above 1 means more people than jobs.
            </p>
            <p>
              Entrants are that year&rsquo;s undergraduate qualifiers from every
              subject that feeds the occupation,
              <Sup n={8} /> plus that year&rsquo;s apprenticeship starts.
              <Sup n={9} />
            </p>
            <p>
              <strong className="text-ink">
                We count every qualifier, including the ones who never get in.
              </strong>{" "}
              A law graduate who ends up in retail still competed for the legal
              jobs and still lost. Leaving them out would describe the winners and
              call it the market.
            </p>
            <p>
              For a subject, we weight by the size of each occupation it feeds.
              Law feeds four legal occupations. Barristers is the smallest of them
              by a wide margin, so it counts for proportionally less. Weighting
              every occupation equally put Law at 4.9 entrants per opening;
              weighting by openings puts it at 3.3, which is 30,990 law qualifiers
              against 10,450 legal openings a year.
            </p>
            <H3>What we know is rough here</H3>
            <p>
              <strong className="text-ink">
                Below subject level, we are guessing.
              </strong>{" "}
              We know how many law qualifiers there are. We do not know how many
              wanted to be barristers rather than solicitors, because nobody
              publishes that. We split them evenly, which overstates competition
              for small occupations and understates it for large ones. The
              subject-level figure above is sound; treat single small occupations
              with suspicion.
            </p>
            <p>
              <strong className="text-ink">Conversion courses are missing.</strong>{" "}
              We count undergraduate qualifiers only. People who take a
              postgraduate route into a profession, law being the obvious one, are
              not in the numerator at all. Real competition is higher than we show
              wherever that route matters.
            </p>
            <p>
              <strong className="text-ink">One year, held flat.</strong> We use
              the most recent year of entrants for every future year. Cohorts
              move.
            </p>

            <H2>What this cannot tell you</H2>
            <p>
              <strong className="text-ink">Could is not will.</strong> Both
              measures describe what AI is capable of, not what employers will
              actually do. Cost, regulation, trust and plain inertia all sit in
              between.
            </p>
            <p>
              <strong className="text-ink">
                A low score on one axis does not make a job safe on its own.
              </strong>{" "}
              The two measure different things, so read both of them, not just the
              combined risk score.
            </p>
            <p>
              <strong className="text-ink">
                The task ratings were made by an AI model, not by human experts.
              </strong>{" "}
              The learnability scores were produced by Google&rsquo;s Gemini 2.5
              Flash following the authors&rsquo; rubric.
              <Sup n={1} /> They are current, which is why we prefer them to older
              human-rated work, but they have not been independently checked.
            </p>
            <p>
              <strong className="text-ink">The job list is American.</strong>{" "}
              Both measures are built on US job categories.
              <Sup n={3} /> Using them for UK jobs assumes the same job involves
              broadly similar work in both countries. That assumption is in the
              original research too.
              <Sup n={2} /> Where we connect American categories to UK job titles,
              that mapping is our own, machine-built navigation aid. It agrees
              with the recognised UK version about{" "}
              <strong className="text-ink">71%</strong> of the time.
              <Sup n={5} /> We call that agreement, not equivalence, and no score
              is calculated through it.
            </p>
            <p>
              <strong className="text-ink">
                Physical work counts twice, and we left it that way on purpose.
              </strong>{" "}
              Learnability scores physical tasks zero. Substitution reads physical
              conditions as protective. So manual trades look safer on both
              measures partly for one shared reason. We could have adjusted for
              it, but doing so would break the checks above and void the published
              evidence. We would rather tell you it is there.
            </p>
            <p>
              <strong className="text-ink">Nothing here is about a person.</strong>{" "}
              Everything describes occupations. No score on this site can tell you
              what will happen to any individual. Hard work matters, especially in
              high risk occupations.
            </p>

            <H2>Sources</H2>
            <ol className="flex flex-col gap-2 pl-6 text-sm [&>li]:list-decimal">
              <li>
                Tomei, P. M. &amp; Klein Teeselink, B. (2026). <em>What Jobs Can
                AI Learn? Measuring Exposure by Reinforcement Learning.</em> AI
                Objectives Institute; King&rsquo;s College London.
                arXiv:2605.02598.
              </li>
              <li>
                Pizzinelli, C., Panton, A., Tavares, M. M., Cazzaniga, M. &amp;
                Li, L. (2023). <em>Labor Market Exposure to AI: Cross-country
                Differences and Distributional Implications.</em> IMF Working
                Paper WP/23/216.
              </li>
              <li>
                National Center for O*NET Development. <em>O*NET 30.0 Database.</em>{" "}
                Used under Creative Commons Attribution 4.0. O*NET® is a trademark
                of the US Department of Labor, Employment and Training
                Administration.
              </li>
              <li>
                Liu, Y., Wang, H. &amp; Yu, S. (2025). <em>Labor Demand in the Age
                of Generative AI: Early Evidence from the U.S. Job Posting Data.</em>{" "}
                World Bank Policy Research Working Paper 11263.
              </li>
              <li>
                National Foundation for Educational Research,{" "}
                <em>The Skills Imperative 2035.</em> Used as a benchmark to check
                our own US-UK mapping.
              </li>
              <li>
                National Foundation for Educational Research,{" "}
                <em>The Skills Imperative 2035.</em> Employment projections by
                occupation to 2035, used for the growth half of openings.
              </li>
              <li>
                Office for National Statistics, <em>Census 2021.</em> Occupation
                by age, used for the retirement half of openings.
              </li>
              <li>
                Higher Education Statistics Agency,{" "}
                <em>Table 50 (DT051): HE qualifiers by subject of study and level
                of qualification obtained,</em> 2024/25. Undergraduate qualifiers
                only.
              </li>
              <li>
                Department for Education,{" "}
                <em>Apprenticeships and traineeships.</em> Starts by standard,
                2024/25.
              </li>
            </ol>
            <p className="text-sm">
              Covering 894 job categories. Built on O*NET 30.0.
            </p>
          </div>
        </Container>
      </Section>
    </main>
  );
}
