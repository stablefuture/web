import { Button } from "@/app/components/Button";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";

export const metadata = {
  title: "Make an introduction | Stable Future",
  description: "Introduce a school or family that may value Stable Future's careers advice.",
  alternates: { canonical: "/talk" },
};

const EMAIL = "ben@stablefuture.uk";

function draftEmail(subject: string, body: string) {
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const schoolEmail = draftEmail(
  "Introduction to a school that may want careers advice",
  `Hi Ben,

I know a school that may value Stable Future's careers advice.

School:
Best contact:
The best way to contact them:
A little context:

Thanks,
[Your name]`,
);

const familyEmail = draftEmail(
  "Introduction to a family who may want careers advice",
  `Hi Ben,

I know a family who may value Stable Future's careers advice.

Their name:
The best way to contact them:
A little context:

Thanks,
[Your name]`,
);

export default function TalkPage() {
  return (
    <main>
      <Section as="section" className="min-h-[70vh]">
        <Container narrow>
          <div className="flex flex-col gap-8 text-center">
            <header className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-accent-strong">
                Make an introduction
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                Know a school or family we could help?
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted">
                Choose who you know. We will open a drafted email for you to check and send.
              </p>
            </header>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button href={schoolEmail} size="lg">
                I know a school
              </Button>
              <Button href={familyEmail} size="lg" variant="secondary">
                I know a family
              </Button>
            </div>

            <p className="text-sm text-muted">
              Nothing is sent until you review the email and press send.
            </p>
          </div>
        </Container>
      </Section>
    </main>
  );
}
