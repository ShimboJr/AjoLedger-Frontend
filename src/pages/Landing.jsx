import { Link } from 'react-router-dom';
import { brand } from '../config/brand.js';

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Create a circle',
    body: 'Set up a savings group with your colleagues, family, or friends. Share an invite link — they join in seconds.',
  },
  {
    step: '2',
    title: 'Contribute each cycle',
    body: 'Every member pays their share when a cycle opens. Paystack handles the collection securely in test mode.',
  },
  {
    step: '3',
    title: 'Build your Trust Profile',
    body: 'Every on-time payment improves your Reliability Score. Share your public profile to prove your saving discipline.',
  },
];

export default function Landing() {
  return (
    <div className="page-container !pb-12 !pt-8 space-y-16">

      {/* ── Hero ── */}
      <section aria-labelledby="hero-heading" className="text-center space-y-5">
        <div className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full border border-primary-200">
          Built for ajo · esusu · susu groups
        </div>

        <h1
          id="hero-heading"
          className="font-display text-4xl font-bold text-slate-900 leading-tight"
        >
          Your savings circle,
          <br />
          <span className="text-primary-700">provably honest.</span>
        </h1>

        <p className="text-slate-600 text-base leading-relaxed max-w-sm mx-auto">
          {brand.name} replaces WhatsApp screenshots and notebooks with a tamper-evident ledger
          every member can verify — and a Reliability Score you can share.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/register" id="hero-cta-register" className="btn-primary">
            Start your circle
          </Link>
          <Link to="/login" id="hero-cta-login" className="btn-ghost">
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Problem callout ── */}
      <section aria-label="The problem" className="card border border-danger-100 bg-danger-50 space-y-3">
        <p className="text-sm font-semibold text-danger-700 uppercase tracking-wide">The problem</p>
        <ul className="space-y-2 text-slate-700 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-danger-200 flex-shrink-0" />
            Records live in notebooks and WhatsApp threads
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-danger-200 flex-shrink-0" />
            No proof when someone defaults — disputes destroy trust
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-danger-200 flex-shrink-0" />
            Faithful savers build zero formal credit history
          </li>
        </ul>
      </section>

      {/* ── How it works ── */}
      <section aria-labelledby="how-heading" className="space-y-5">
        <h2 id="how-heading" className="font-display text-2xl font-bold text-slate-900 text-center">
          How it works
        </h2>
        <ol className="space-y-4">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step} className="card flex gap-4 items-start">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-700 text-white font-display font-bold text-base flex items-center justify-center">
                {item.step}
              </span>
              <div>
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="text-center space-y-4">
        <p className="text-slate-600 text-sm">
          Free during the hackathon. No real money moves.
        </p>
        <Link to="/register" id="bottom-cta-register" className="btn-primary w-full max-w-xs mx-auto block">
          Get started free
        </Link>
      </section>

    </div>
  );
}
