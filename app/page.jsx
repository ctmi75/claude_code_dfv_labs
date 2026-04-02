import Link from 'next/link';
import { advisors } from '../lib/advisors';

// Only show the three real advisor cards (not the virtual deck-review entry)
const realAdvisors = advisors.filter((a) => a.id !== 'deck-review');

export default function TeamPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-dfv/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[800px] mx-auto px-6">
        {/* Header */}
        <header className="pt-12 pb-6 flex items-center justify-between">
          <img src="/logo.png" alt="Dragon Fruit Ventures" className="h-12" />
        </header>

        {/* Hero */}
        <section className="pt-16 pb-14">
          <p className="text-dfv-light font-semibold text-sm tracking-wide uppercase mb-4">
            Advisory Sessions
          </p>
          <h1 className="font-display text-5xl md:text-6xl text-white tracking-tight leading-[1.1] mb-5">
            Get advice from<br />
            <span className="italic text-dfv-light">people who build.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
            Skip the noise. Book a session with an operator who&apos;s been in the trenches.
          </p>
        </section>

        {/* ── Deck Review — featured product ── */}
        <section className="pb-10">
          <Link
            href="/deck-review"
            className="group flex items-center justify-between gap-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 transition-all duration-300 hover:border-dfv/50 hover:bg-zinc-900 hover:shadow-[0_0_40px_rgba(124,58,237,0.08)]"
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-dfv/10 border border-dfv/20 flex items-center justify-center flex-shrink-0">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>

            {/* Copy */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold text-lg leading-tight">
                  Pitch Deck Review
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-dfv/15 border border-dfv/30 text-dfv-light font-semibold">
                  New
                </span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Get sharp, actionable feedback from a DFV partner before you go out to raise.
                Rotating between Christian, Matt &amp; Omar.
              </p>
            </div>

            {/* Price + arrow */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-white font-bold text-2xl">$250</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-dfv-light group-hover:text-white transition-colors"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </section>

        {/* ── 1:1 Sessions ── */}
        <section className="pb-20">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4">
            Or book a 1:1 session
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {realAdvisors.map((advisor) => (
              <Link
                key={advisor.id}
                href={`/${advisor.id}`}
                className="group relative flex flex-col rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 transition-all duration-300 hover:border-dfv/50 hover:bg-zinc-900 hover:shadow-[0_0_40px_rgba(124,58,237,0.08)]"
              >
                {/* Headshot */}
                <div className="w-20 h-20 rounded-2xl mb-5 overflow-hidden ring-2 ring-zinc-800 group-hover:ring-dfv/40 transition-all">
                  <img
                    src={advisor.headshotUrl}
                    alt={advisor.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Name & Role */}
                <h3 className="text-white font-semibold text-lg mb-0.5 tracking-tight">
                  {advisor.name}
                </h3>
                <p className="text-[11px] text-dfv-light font-semibold uppercase tracking-widest mb-3">
                  {advisor.role}
                </p>

                {/* Bio */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-5 line-clamp-3">
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
                <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-dfv-light group-hover:text-white transition-colors">
                  Book session
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
            <span>Pick a session</span>
            <span className="w-4 h-px bg-zinc-700" />
            <span>Pick a time &amp; pay on Calendly</span>
            <span className="w-4 h-px bg-zinc-700" />
            <span>Invite sent</span>
          </div>
        </section>
      </div>
    </main>
  );
}
