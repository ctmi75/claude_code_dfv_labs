import Link from 'next/link';
import { advisors } from '../lib/advisors';

export default function TeamPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-dfv/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[800px] mx-auto px-6">
        {/* Header */}
        <header className="pt-12 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              width="36"
              height="36"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 2L36.66 11V29L20 38L3.34 29V11L20 2Z"
                fill="#7C3AED"
              />
              <text
                x="20"
                y="24"
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
              >
                DFV
              </text>
            </svg>
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">Dragon Fruit Ventures</p>
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">Advisory</p>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-16 pb-14">
          <p className="text-dfv-light font-semibold text-sm tracking-wide uppercase mb-4">1:1 Sessions</p>
          <h1 className="font-display text-5xl md:text-6xl text-white tracking-tight leading-[1.1] mb-5">
            Get advice from<br />
            <span className="italic text-dfv-light">people who build.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
            Skip the noise. Book a session with an operator who&apos;s been in the trenches.
          </p>
        </section>

        {/* Advisor Cards */}
        <section className="pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {advisors.map((advisor) => (
              <Link
                key={advisor.id}
                href={`/${advisor.id}`}
                className="group relative rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 transition-all duration-300 hover:border-dfv/50 hover:bg-zinc-900 hover:shadow-[0_0_40px_rgba(124,58,237,0.08)]"
              >
                {/* Headshot */}
                <div className="w-20 h-20 rounded-2xl mb-5 overflow-hidden ring-2 ring-zinc-800 group-hover:ring-dfv/40 transition-all">
                  <img
                    src={advisor.headshotUrl}
                    alt={advisor.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name & Role */}
                <h3 className="text-white font-semibold text-lg mb-0.5 tracking-tight">{advisor.name}</h3>
                <p className="text-[11px] text-dfv-light font-semibold uppercase tracking-widest mb-3">
                  {advisor.role}
                </p>

                {/* Bio */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                  {advisor.bio}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {advisor.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-semibold text-dfv-light group-hover:text-white transition-colors">
                  Book session
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Flow Indicator */}
        <section className="pb-12 text-center">
          <div className="inline-flex items-center gap-3 text-[11px] text-zinc-600 font-medium uppercase tracking-widest">
            <span>Pick advisor</span>
            <span className="w-4 h-px bg-zinc-700" />
            <span>Select session</span>
            <span className="w-4 h-px bg-zinc-700" />
            <span>Pay</span>
            <span className="w-4 h-px bg-zinc-700" />
            <span>Book</span>
          </div>
        </section>
      </div>
    </main>
  );
}
