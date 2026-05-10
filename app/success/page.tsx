import { Container } from "@/app/components/Container";
import { Button } from "@/app/components/Button";

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-alt">
      <Container narrow>
        <div className="flex flex-col items-center text-center gap-6 py-20">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
            <CheckIcon className="w-8 h-8 text-brand-700" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink">
            Payment received — thank you!
          </h1>
          <p className="text-lg text-muted max-w-md">
            We&apos;ll be in touch within 24 hours to schedule your first session.
            Check your email for a confirmation.
          </p>
          <Button href="/" size="lg">
            Back to Home
          </Button>
        </div>
      </Container>
    </main>
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
