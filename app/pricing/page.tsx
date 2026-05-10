import { redirect } from "next/navigation";
import { Button } from "@/app/components/Button";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { createCheckoutSession } from "@/app/actions/stripe";

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Get your bearings",
    price: 1, // £0.01 smoke test
    displayPrice: "£TBC",
    features: [
      "AI-readiness assessment",
      "30-min strategy call",
      "Personalised action plan",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    id: "advisory",
    name: "Advisory",
    tagline: "The full picture",
    price: 2, // £0.02 smoke test
    displayPrice: "£TBC",
    features: [
      "Everything in Starter",
      "3 follow-up sessions (term-based)",
      "Subject & course review",
      "Ongoing email support",
    ],
    cta: "Book Advisory",
    highlighted: true,
  },
  {
    id: "intensive",
    name: "Intensive",
    tagline: "Full transformation",
    price: 3, // £0.03 smoke test
    displayPrice: "£TBC",
    features: [
      "Everything in Advisory",
      "Monthly 1-1 sessions",
      "CV & portfolio review",
      "University / apprenticeship guidance",
    ],
    cta: "Apply Now",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main>
      <header className="border-b border-brand-100 bg-white">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="text-lg font-extrabold tracking-tight text-brand-950">
              Stable Future
            </a>
            <Button href="/#book" size="md">
              Book a Free Call
            </Button>
          </div>
        </Container>
      </header>

      <Section className="bg-white">
        <Container>
          <div className="flex flex-col items-center text-center gap-4 mb-14">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-ink">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted max-w-xl">
              Choose the level of support that fits your family. All plans start
              with a free strategy call.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {TIERS.map((tier) => (
              <TierCard key={tier.id} tier={tier} />
            ))}
          </div>

          <p className="text-center text-sm text-muted mt-10">
            Prices shown are placeholders — real pricing to be confirmed. Smoke-test amounts (£0.01–£0.03) used in checkout for testing.
          </p>
        </Container>
      </Section>

      <footer className="bg-ink text-white/60 py-8">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <span className="font-bold text-white">Stable Future</span>
            <span>© {new Date().getFullYear()} Stable Future. All rights reserved.</span>
          </div>
        </Container>
      </footer>
    </main>
  );
}

function TierCard({ tier }: { tier: (typeof TIERS)[number] }) {
  async function handleCheckout() {
    "use server";
    const { url } = await createCheckoutSession(tier.price, tier.name);
    if (url) redirect(url);
  }

  return (
    <div
      className={[
        "flex flex-col rounded-2xl p-8 gap-6 border",
        tier.highlighted
          ? "bg-brand-950 text-white border-brand-950 shadow-2xl scale-[1.03]"
          : "bg-white text-ink border-brand-100 shadow-sm",
      ].join(" ")}
    >
      <div className="flex flex-col gap-1">
        <span
          className={[
            "text-xs font-bold uppercase tracking-widest",
            tier.highlighted ? "text-brand-300" : "text-brand-700",
          ].join(" ")}
        >
          {tier.tagline}
        </span>
        <h2 className="text-2xl font-extrabold">{tier.name}</h2>
        <p className={["text-3xl font-extrabold mt-2", tier.highlighted ? "text-white" : "text-ink"].join(" ")}>
          {tier.displayPrice}
        </p>
      </div>

      <ul className="flex flex-col gap-3 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckIcon
              className={[
                "mt-0.5 w-4 h-4 shrink-0",
                tier.highlighted ? "text-brand-300" : "text-brand-700",
              ].join(" ")}
            />
            <span className={tier.highlighted ? "text-brand-100" : "text-ink"}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <form action={handleCheckout}>
        <button
          type="submit"
          className={[
            "w-full h-12 rounded-md font-bold text-base transition-all",
            tier.highlighted
              ? "bg-white text-brand-950 hover:bg-brand-100"
              : "bg-brand-950 text-white hover:bg-brand-900",
          ].join(" ")}
        >
          {tier.cta}
        </button>
      </form>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
