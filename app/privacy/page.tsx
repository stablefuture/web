import type { Metadata } from 'next';
import { SHARE_IMAGE } from '../config';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy notice | Stable Future', description: 'How Stable Future uses your personal data.', alternates: { canonical: '/privacy' }, openGraph: { title: 'Privacy notice | Stable Future', description: 'How Stable Future uses your personal data.', url: '/privacy', images: [SHARE_IMAGE] } };

const S = { h2: { margin: '36px 0 10px', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 26, letterSpacing: '-.01em' }, p: { margin: '0 0 12px', fontSize: 16, lineHeight: 1.7, color: '#3c4a3f' }, li: { margin: '0 0 8px', fontSize: 16, lineHeight: 1.6, color: '#3c4a3f' } } as const;

export default function Privacy() {
  return <main data-landing style={{ minHeight: '100vh', background: '#f6f3e7', color: '#1d3026', padding: '28px 20px 80px', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link href="/" style={{ fontSize: 20, fontWeight: 650, letterSpacing: '-1px' }}>stable future ↗</Link>
      <h1 style={{ margin: '48px 0 8px', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 'clamp(36px, 6vw, 52px)', letterSpacing: '-.03em' }}>Privacy notice</h1>
      <p style={{ ...S.p, color: '#566151' }}>Last updated 6 October 2026.</p>

      <h2 style={S.h2}>Who we are</h2>
      <p style={S.p}>Stable Future is run by Ben Grime in the UK. Ben decides how your data is used, and you can reach him at <a href="mailto:ben@stablefuture.uk" style={{ textDecoration: 'underline' }}>ben@stablefuture.uk</a> about anything in this notice.</p>

      <h2 style={S.h2}>What we collect, and why</h2>
      <ul style={{ paddingLeft: 22 }}>
        <li style={S.li}><strong>The free AI career check.</strong> Your email address and the paths you choose, so we can send the report you asked for. Our email provider holds a copy of the sent email for a limited time. If you allow follow-up emails, Ben also receives your email and chosen paths in a Telegram alert.</li>
        <li style={S.li}><strong>Follow-up emails.</strong> When you ask for a career check report, we also send a few short emails about planning your child’s career and our advice, unless you tick the box to opt out. We keep your email address on our mailing list until you unsubscribe, which you can do from any email. Our legal basis is the “soft opt-in” in the Privacy and Electronic Communications Regulations and our legitimate interest in telling you about our own career advice.</li>
        <li style={S.li}><strong>The “Get advice” form.</strong> Your name, email, and what you tell us about your child’s situation, so Ben can prepare for your call. We email these details to Ben when you continue to choose a time, even if you do not finish booking. Our legal basis is taking steps you asked for before we work together. Please share only what helps us advise you.</li>
        <li style={S.li}><strong>Bookings.</strong> We pass your name, email, and situation to Cal.com to prefill your booking. If you book a call, we add your name and email to our contact list (Kit) so we can follow up about your call.</li>
        <li style={S.li}><strong>Website analytics.</strong> Which pages are visited and what is clicked, so we can improve the site. This runs without storing cookies on your device, and form fields are masked. Our legal basis is our legitimate interest in running a useful website.</li>
      </ul>

      <h2 style={S.h2}>Children</h2>
      <p style={S.p}>The career check and our advice are for parents and carers, and for students aged 16 or over. If you are under 16, please ask a parent or carer to use them with you. If we learn we hold data from a child under 13 without a parent’s involvement, we delete it.</p>

      <h2 style={S.h2}>Who handles your data for us</h2>
      <p style={S.p}>We use a small number of trusted services, which only use your data to provide their service to us: Vercel (website hosting), Resend (sending emails), Kit (our mailing list and contacts), Cal.com (booking calls), and PostHog (analytics, hosted in the EU). Some of these are based in the United States. Where data leaves the UK, it is protected by the UK–US Data Bridge or standard contractual clauses.</p>
      <p style={S.p}>We send Ben a private Telegram alert when you book a strategy call or request a career check. Booking alerts contain your name, email, call time, meeting link, and any notes you provide. Career-check alerts contain your email and chosen paths unless you opted out of follow-ups; in that case the alert contains no contact details. Telegram stores these alerts in its cloud chat service. Please do not include sensitive information about your child in the advice form.</p>
      <p style={S.p}>We never sell your data or share it for advertising.</p>

      <h2 style={S.h2}>How long we keep it</h2>
      <p style={S.p}>Mailing list: until you unsubscribe. Advice enquiries, related emails, and Telegram alerts: up to two years after we were last in touch, unless we start working together. Our email provider keeps delivery records for a limited time.</p>

      <h2 style={S.h2}>Your rights</h2>
      <p style={S.p}>You can ask for a copy of your data, ask us to correct or delete it, object to how we use it, or withdraw consent at any time. Email <a href="mailto:ben@stablefuture.uk" style={{ textDecoration: 'underline' }}>ben@stablefuture.uk</a> and we’ll reply within one month. If you’re unhappy with how we’ve handled your data, you can complain to the Information Commissioner’s Office at <a href="https://ico.org.uk/make-a-complaint/" style={{ textDecoration: 'underline' }}>ico.org.uk</a>.</p>
    </div>
  </main>;
}
