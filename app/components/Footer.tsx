import { Container } from "@/app/components/Container";

// Primary sources behind the checker. These are the same bodies credited on
// /methodology — kept here so every page carries outbound citations.
const SOURCES = [
  ["Office for National Statistics", "https://www.ons.gov.uk/employmentandlabourmarket"],
  ["HESA Graduate Outcomes", "https://www.hesa.ac.uk/data-and-analysis/graduates"],
  ["DfE apprenticeship statistics", "https://explore-education-statistics.service.gov.uk/find-statistics/apprenticeships"],
];

const PAGES = [
  ["Career checker", "/checker"],
  ["Graduate destinations", "/destinations"],
  ["Methodology", "/methodology"],
  ["About", "/about"],
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border-soft py-10">
      <Container wide>
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <nav className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-strong">
              Stable Future
            </h2>
            {PAGES.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                {label}
              </a>
            ))}
          </nav>

          <nav className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-strong">
              Data sources
            </h2>
            {SOURCES.map(([label, href]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener"
                className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted">
          © {new Date().getFullYear()} Stable Future. Figures are estimates built
          from public UK data and are not individual careers advice.
        </p>
      </Container>
    </footer>
  );
}
