import { packages } from '../../lib/packages';
import { getAdvisor } from '../../lib/advisors';
import Link from 'next/link';

export default function SuccessPage({ searchParams }) {
  const slug = searchParams?.package || 'working';
  const advisorId = searchParams?.advisor || 'christian';

  const pkg = packages.find((p) => p.id === slug) || packages[1];
  const advisor = getAdvisor(advisorId);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-dfv/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[560px] mx-auto px-6 py-20">
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

        {/* Heading */}
        <h1 className="font-display text-4xl md:text-5xl text-center text-white mb-3 italic tracking-tight">
          Booking confirmed.
        </h1>
        <p className="text-center text-zinc-500 text-base mb-10">
          Check your email for the calendar invite and session details.
        </p>

        {/* Summary card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden mb-6">
          {/* Advisor row */}
          {advisor && (
            <div className="flex items-center gap-4 p-5 border-b border-zinc-800">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-700 flex-shrink-0">
                <img
                  src={advisor.headshotUrl}
                  alt={advisor.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Session with</p>
                <p className="text-white font-semibold">{advisor.name}</p>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="divide-y divide-zinc-800">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-zinc-500 text-sm">Session</span>
              <span className="text-white text-sm font-medium">{pkg.name}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-zinc-500 text-sm">Duration</span>
              <span className="text-white text-sm font-medium">{pkg.duration} min</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-zinc-500 text-sm">Total paid</span>
              <span className="text-white font-bold text-lg">${pkg.price} USD</span>
            </div>
          </div>
        </div>

        {/* Cancellation policy */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 mb-10">
          <p className="text-white font-semibold text-sm mb-3">Cancellation policy</p>
          <ul className="text-zinc-500 text-sm space-y-1.5 list-disc list-inside">
            <li>Calls can be rescheduled up to 2 hours before the session.</li>
            <li>Cancellations must be submitted at least 24 hours in advance.</li>
          </ul>
        </div>

        {/* Back link */}
        <div className="text-center">
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
