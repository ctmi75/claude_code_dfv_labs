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
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-[900px]">
        {/* Checkmark */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#E8F5F0] flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Confirmation text */}
        <h1
          className="text-4xl text-center text-gray-900 mb-2"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Payment confirmed.
        </h1>

        <div className="text-center mb-2">
          <span className="text-lg font-medium text-gray-800">{pkg.name}</span>
          {advisor && (
            <>
              <span className="text-gray-400 mx-2">&middot;</span>
              <span className="text-lg text-gray-600">with {advisor.name}</span>
            </>
          )}
          <span className="text-gray-400 mx-2">&middot;</span>
          <span className="text-lg text-gray-600">{pkg.duration} min</span>
          <span className="text-gray-400 mx-2">&middot;</span>
          <span className="text-lg font-semibold text-gray-900">
            ${pkg.price} CAD
          </span>
        </div>

        <p className="text-center text-gray-500 font-light text-lg mb-10">
          Now pick your time.
        </p>

        {/* Calendly embed */}
        <CalendlyEmbed url={calendlyUrl} />

        {/* Fallback */}
        <div className="text-center mt-6">
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[#1D9E75] hover:text-[#0F6E56] font-medium transition-colors"
          >
            Book your time on Calendly &rarr;
          </a>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            &larr; Back to advisors
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-12">
          Questions?{' '}
          <a
            href="mailto:christian@dragonfruitventures.com"
            className="underline hover:text-gray-600"
          >
            christian@dragonfruitventures.com
          </a>
        </p>
      </div>
    </main>
  );
}
