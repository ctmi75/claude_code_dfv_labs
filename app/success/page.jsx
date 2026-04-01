import { packages } from '../../lib/packages';
import { getAdvisor } from '../../lib/advisors';
import CalendlyEmbed from '../../components/CalendlyEmbed';
import Link from 'next/link';

export default function SuccessPage({ searchParams }) {
  const slug = searchParams?.package || 'working';
  const advisorId = searchParams?.advisor || 'christian';

  const pkg = packages.find((p) => p.id === slug) || packages[1];
  const advisor = getAdvisor(advisorId);
  const calendlyUrl = advisor?.calendlyUrls?.[slug] || '#';

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-dfv/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[900px] mx-auto px-6 py-16">

        {/* Payment confirmed banner */}
        <div className="flex items-center gap-3 mb-10 p-4 rounded-2xl bg-dfv/10 border border-dfv/20">
          <div className="w-8 h-8 rounded-full bg-dfv/20 border border-dfv/30 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Payment confirmed</p>
            <p className="text-zinc-400 text-xs">
              {pkg.name} &middot; {pkg.duration} min &middot; ${pkg.price} USD
              {advisor && <> &middot; with {advisor.name}</>}
            </p>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-display text-4xl md:text-5xl text-white mb-3 italic tracking-tight">
          Now lock in your time.
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-xl">
          Select the same time slot you chose — this confirms your booking and sends the calendar invite.
        </p>

        {/* Calendly embed */}
        {calendlyUrl !== '#' ? (
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-white mb-8">
            <CalendlyEmbed url={calendlyUrl} />
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center mb-8">
            <p className="text-zinc-500 text-sm">
              Scheduling link not configured.{' '}
              <a href="mailto:christian@dragonfruitventures.com" className="text-dfv-light hover:text-white transition-colors">
                Contact us
              </a>{' '}
              to book your time.
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors font-medium">
            Back to advisors
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-12">
          Questions?{' '}
          <a href="mailto:christian@dragonfruitventures.com" className="text-zinc-500 hover:text-white transition-colors">
            christian@dragonfruitventures.com
          </a>
        </p>
      </div>
    </main>
  );
}
