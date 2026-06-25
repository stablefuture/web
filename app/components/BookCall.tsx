import { Button } from "@/app/components/Button";
import { BOOKING_URL } from "@/app/config";

// Single source of truth for the primary CTA. When BOOKING_URL is set it's a
// live "Book a call" link; until then it renders a disabled placeholder so the
// page can ship before the booking link exists.
export function BookCall({
  size = "md",
  className = "",
}: {
  size?: "md" | "lg";
  className?: string;
}) {
  const cls = ["uppercase tracking-wide", className].filter(Boolean).join(" ");

  if (!BOOKING_URL) {
    return (
      <Button size={size} disabled className={cls}>
        Booking opens shortly
      </Button>
    );
  }

  return (
    <Button href={BOOKING_URL} size={size} className={cls}>
      Book a call →
    </Button>
  );
}
