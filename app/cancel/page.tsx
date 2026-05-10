import { Container } from "@/app/components/Container";
import { Button } from "@/app/components/Button";

export default function CancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-alt">
      <Container narrow>
        <div className="flex flex-col items-center text-center gap-6 py-20">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
            <XIcon className="w-8 h-8 text-brand-700" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink">
            Payment cancelled
          </h1>
          <p className="text-lg text-muted max-w-md">
            No charge was made. You can go back and try again, or book a free
            call if you&apos;d like to talk it through first.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button href="/pricing" size="lg">
              Back to Pricing
            </Button>
            <Button href="/#book" variant="secondary" size="lg">
              Book a Free Call
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
