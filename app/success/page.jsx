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
        {/* Success icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-dfv/10 border border-dfv/20 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Confirmation text */}
        <h1 className="font-display text-4xl md:text-5xl text-center text-white mb-4 italic tracking-tight">
          Payment confirmed.
        </h1>

        <div className="text-center mb-2">
          <span className="text-lg font-semibold text-white">{pkg.name}</span>
          {advisor && (
            <>
              <span className="text-zinc-600 mx-3">/</span>
              <span className="text-lg text-zinc-400">with {advisor.name}</span>
            </>
          )}
          <span className="text-zinc-600 mx-3">/</span>
          <span className="text-lg text-zinc-400">{pkg.duration} min</span>
          <span className="text-zinc-600 mx-3">/</span>
          <span className="text-lg font-bold text-white">
            ${pkg.price} CAD
          </span>
        </div>

        <p className="text-center text-zinc-500 text-lg mb-12">
          Now pick your time.
        </p>

        {/* Calendly embed */}
        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-white">
          <CalendlyEmbed url={calendlyUrl} />
        </div>

        {/* Fallback */}
        <div className="text-center mt-8">
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-dfv-light hover:text-white font-semibold text-sm transition-colors"
          >
            Open Calendly directly
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
          >
            Back to advisors
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-16">
          Questions?{' '}
          <a
            href="mailto:christian@dragonfruitventures.com"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            christian@dragonfruitventures.com
          </a>
        </p>
      </div>
    </main>
  );
}
