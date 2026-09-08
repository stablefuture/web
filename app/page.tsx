import styles from "./landing.module.css";
import { FounderBio } from "./components/FounderBio";

export const metadata = {
  title: "Stable Future | Your future is still yours",
  description: "Career advice for students of all ages. Explore your options, understand how AI could change your chosen career, and plan your next step.",
  alternates: { canonical: "/" },
  openGraph: { title: "Your future is still yours. | Stable Future", description: "Career advice for students of all ages, in a world changed by AI." },
  twitter: { title: "Your future is still yours. | Stable Future", description: "Career advice for students of all ages, in a world changed by AI." },
};

function Landscape() {
  return <svg className={styles.landscape} viewBox="0 0 800 650" fill="none" aria-hidden="true">
    <circle cx="526" cy="188" r="78" fill="#c76c43" className={styles.sun} />
    <g stroke="currentColor" strokeWidth="0.8" opacity="0.6">
      {Array.from({length: 46}, (_, i) => <path key={i} d={`M ${-130+i*14} 680 C ${20+i*10} ${270+i*4}, ${270+i*7} ${640-i*6}, ${360+i*12} ${310-i*1.7} S ${660+i*8} ${350+i*6}, 940 ${165+i*9}`} />)}
    </g>
    <path d="M260 670 C 258 533, 477 484, 463 391 C450 319, 411 326, 437 270" stroke="#f2f0e5" strokeWidth="21" />
    <path d="M260 670 C 258 533, 477 484, 463 391 C450 319, 411 326, 437 270" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" />
  </svg>;
}

export default function Home() {
  return <main className={styles.landing} data-landing>
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span /> Careers advice for a changing world</p>
        <h1 id="hero-title">Your future<br />is still <em>yours.</em></h1>
        <p className={styles.intro}>AI is changing work.<br />You still get to choose what comes next.</p>
        <p className={styles.description}>We help students of all ages find their direction, understand their options, and take the next step with confidence.</p>
        <div className={styles.actions}>
          <a className={styles.button} href="/checker">Explore your career options <span aria-hidden="true">↗</span></a>
          <a className={styles.textLink} href="/call">Talk to Ben <span aria-hidden="true">↗</span></a>
        </div>
        <p className={styles.small}>Start with our free career checker. No sign-up needed.</p>
      </div>
      <Landscape />
      <div className={styles.heroBottom}><span>Jobs · Degrees · Apprenticeships</span><a href="#your-next-step">A little more direction <span aria-hidden="true">↓</span></a></div>
    </section>

    <section className={styles.statement} id="your-next-step">
      <p className={styles.eyebrow}>01 / A good place to start</p>
      <div><h2>“What should I do<br />with my future?”</h2><p>It was a big question before AI. Now there’s even more to weigh up. What suits you? Is university worth it? What will the work actually look like?</p><p>You don’t need to decide your whole life today. Let’s make your next choice a more informed one.</p></div>
    </section>

    <section className={styles.options} aria-label="How we help">
      <a href="/checker" className={styles.option}><span className={styles.number}>01</span><div><h3>See how AI could<br />change your career.</h3><p>Explore jobs, degrees, and apprenticeships. Compare pay and our estimates of how AI could affect the work.</p><span className={styles.optionLink}>Try the free career checker <span aria-hidden="true">↗</span></span></div></a>
      <a href="/destinations" className={styles.option}><span className={styles.number}>02</span><div><h3>Know where a<br />degree can take you.</h3><p>Look beyond the course title. See what graduates go on to do, using UK graduate outcomes data.</p><span className={styles.optionLink}>Explore graduate destinations <span aria-hidden="true">↗</span></span></div></a>
      <a href="/call" className={styles.option}><span className={styles.number}>03</span><div><h3>Talk it through.<br />Find your next step.</h3><p>Get personal careers advice that considers your interests, your stage of study, and the world you’re entering. Parents welcome too.</p><span className={styles.optionLink}>Book a conversation <span aria-hidden="true">↗</span></span></div></a>
    </section>

    <section className={styles.approach}>
      <div><p className={styles.eyebrow}>02 / Our approach</p><h2>Serious about the research.<br /><em>Personal about the advice.</em></h2></div>
      <div className={styles.approachCopy}><p>No one can promise an AI-proof career. We help you understand the evidence, weigh up the uncertainty, and make choices that fit you.</p><p>Our free tools bring UK labour market data into your career decisions. Personal advice helps you work out what that evidence means for you.</p><a className={styles.textLink} href="/about">Read the thinking behind our advice <span aria-hidden="true">↗</span></a></div>
    </section>

    <section className={styles.founder}><FounderBio /></section>

    <section className={styles.closing}><p className={styles.eyebrow}>Your next step starts with a choice</p><h2>Make it an<br /><em>informed one.</em></h2><a className={styles.button} href="/checker">Explore your career options <span aria-hidden="true">↗</span></a><p className={styles.small}>Free to explore. Built to help you move forwards.</p></section>
  </main>;
}
