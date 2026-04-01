import Link from 'next/link';
import { advisors } from '../lib/advisors';

export default function TeamPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-[720px] mx-auto px-6">
        {/* Header */}
        <header className="pt-10 pb-4 flex items-center gap-3">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 2L36.66 11V29L20 38L3.34 29V11L20 2Z"
              fill="#1D9E75"
            />
            <text
              x="20"
              y="24"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="600"
              fontFamily="DM Sans, sans-serif"
            >
              DFV
            </text>
          </svg>
          <div>
            <p className="text-sm font-medium tracking-tight">Dragon Fruit Ventures</p>
            <p className="text-xs text-gray-400">Advisory Sessions</p>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16">
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">
            Book time with our team.
          </h1>
          <p className="text-gray-500 font-light text-lg leading-relaxed max-w-md">
            Pick an advisor, choose a session, and lock in your time.
          </p>
        </section>

        {/* Advisor Cards */}
        <section className="pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {advisors.map((advisor) => (
              <Link
                key={advisor.id}
                href={`/${advisor.id}`}
                className="group border border-gray-200 rounded-2xl p-6 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-dfv"
              >
                {/* Headshot */}
                <div className="w-16 h-16 rounded-full bg-dfv-light mb-4 overflow-hidden">
                  <img
                    src={advisor.headshotUrl}
                    alt={advisor.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name & Role */}
                <h3 className="font-serif text-xl mb-0.5">{advisor.name}</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
                  {advisor.role}
                </p>

                {/* Bio */}
                <p className="text-sm font-light text-gray-500 leading-relaxed mb-4">
                  {advisor.bio}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {advisor.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <p className="text-sm font-medium text-dfv group-hover:text-dfv-dark transition-colors">
                  Book a session &rarr;
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Flow Indicator */}
        <section className="pb-8 text-center">
          <p className="text-xs text-gray-300 tracking-wide">
            Pick advisor &nbsp;&rarr;&nbsp; Select session &nbsp;&rarr;&nbsp; Pay via Stripe &nbsp;&rarr;&nbsp; Book on Calendly
          </p>
        </section>
      </div>
    </main>
  );
}
