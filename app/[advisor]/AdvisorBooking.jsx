'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { packages } from '../../lib/packages';
import TimeSlotPicker from '../../components/TimeSlotPicker';

// Packages shown on regular advisor pages (all except deck-review)
const advisorPackages = packages.filter((p) => p.advisorOnly);

// Default to the featured package
const defaultAdvisorPackage = advisorPackages.find((p) => p.featured) ?? advisorPackages[0];

// Deck review is always the sole package on the deck-review page
const deckReviewPackage = packages.find((p) => p.id === 'deck-review');

function formatSlotSummary(slot) {
  return new Date(slot.start_time).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdvisorBooking({ advisor }) {
  const isDeckReview = advisor.id === 'deck-review';

  const [selectedPackage, setSelectedPackage] = useState(
    isDeckReview ? deckReviewPackage : defaultAdvisorPackage,
  );
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch availability via Google Calendar API
  useEffect(() => {
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);

    fetch(`/api/availability?advisorId=${advisor.id}&packageSlug=${selectedPackage.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSlots(data.slots ?? []);
      })
      .catch((err) => setSlotsError(err.message))
      .finally(() => setSlotsLoading(false));
  }, [advisor.id, selectedPackage.id]);

  async function handleCheckout() {
    if (!selectedSlot || checkoutLoading) return;
    setCheckoutLoading(true);

    const endTime = new Date(
      new Date(selectedSlot.start_time).getTime() + selectedPackage.duration * 60 * 1000,
    ).toISOString();

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageSlug: selectedPackage.id,
          advisorId: advisor.id,
          slotStartTime: selectedSlot.start_time,
          slotEndTime: endTime,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again.');
        setCheckoutLoading(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-dfv/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6">
        {/* Header */}
        <header className="pt-12 pb-8 flex items-center justify-between">
          <img src="/logo.png" alt="Dragon Fruit Ventures" className="h-12" />
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-white transition-colors font-medium flex items-center gap-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All sessions
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 pb-20">

          {/* ── Left: Profile / product info (sticky) ── */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            {isDeckReview ? (
              /* Deck Review left panel */
              <DeckReviewInfo />
            ) : (
              /* Regular advisor left panel */
              <>
                <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-800 mb-7">
                  <img
                    src={advisor.headshotUrl}
                    alt={advisor.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h1 className="font-display text-4xl md:text-5xl text-white tracking-tight mb-2">
                  {advisor.name}
                </h1>
                <p className="text-dfv-light font-semibold text-xs uppercase tracking-widest mb-5">
                  {advisor.role}
                </p>
                <hr className="border-zinc-800 mb-5" />
                <p className="text-zinc-400 text-base leading-relaxed mb-6">{advisor.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {advisor.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Right: Booking column ── */}
          <div className="flex flex-col gap-4">

            {/* Booking card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              {/* Mini-header */}
              <div className="flex items-center gap-4 p-5 border-b border-zinc-800">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-700 flex-shrink-0">
                  <img
                    src={advisor.headshotUrl}
                    alt={isDeckReview ? 'DFV' : advisor.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-medium">
                    {isDeckReview ? 'Deck review with' : 'Connect with'}
                  </p>
                  <h2 className="font-display text-xl text-white leading-tight">
                    {isDeckReview ? 'a DFV Partner' : advisor.name}
                  </h2>
                </div>
              </div>

              <div className="p-5">
                {/* Session type selector — only for regular advisors */}
                {!isDeckReview && (
                  <>
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
                      Session length
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {advisorPackages.map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackage(pkg)}
                          className={`py-3 px-2 rounded-xl text-center transition-all duration-200 ${
                            selectedPackage.id === pkg.id
                              ? 'bg-dfv/15 border-2 border-dfv text-white shadow-[0_0_20px_rgba(124,58,237,0.1)]'
                              : 'bg-zinc-800/60 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <span className="block text-sm font-semibold leading-tight">
                            {pkg.id === 'quick' ? 'Quick' : pkg.id === 'working' ? 'Full' : 'Deep Dive'}
                          </span>
                          <span className="block text-[11px] opacity-60 mt-0.5">
                            {pkg.duration} min
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Deck Review package badge */}
                {isDeckReview && (
                  <div className="mb-6 flex items-center gap-3 rounded-xl bg-dfv/10 border border-dfv/20 px-4 py-3">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <div>
                      <p className="text-white text-sm font-semibold">Pitch Deck Review</p>
                      <p className="text-zinc-400 text-xs">30 min · Rotating DFV partner</p>
                    </div>
                    <span className="ml-auto text-white font-bold">$250</span>
                  </div>
                )}

                {/* Time slots */}
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
                  Pick a time
                </p>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <svg
                      className="animate-spin h-5 w-5 text-dfv-light"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-zinc-500 text-sm">Loading availability…</span>
                  </div>
                ) : slotsError ? (
                  <p className="text-red-400 text-sm py-4">{slotsError}</p>
                ) : (
                  <TimeSlotPicker
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelect={setSelectedSlot}
                  />
                )}
              </div>

              {/* Flow indicator */}
              <div className="border-t border-zinc-800 py-3 px-5 flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-widest">
                <span className="text-dfv-light">Pick time</span>
                <span className="w-4 h-px bg-zinc-700" />
                <span className={selectedSlot ? 'text-dfv-light' : 'text-zinc-600'}>Pay</span>
                <span className="w-4 h-px bg-zinc-700" />
                <span className="text-zinc-600">Invite sent</span>
              </div>
            </div>

            {/* Pay-to-confirm panel — appears when a slot is selected */}
            {selectedSlot && (
              <div className="rounded-2xl border border-dfv/30 bg-dfv/5 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold">{selectedPackage.name}</p>
                    <p className="text-zinc-400 text-sm mt-0.5">{formatSlotSummary(selectedSlot)}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      with {isDeckReview ? 'a DFV Partner' : advisor.name}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-white">${selectedPackage.price}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold py-3.5 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    'Pay to confirm'
                  )}
                </button>

                <p className="text-zinc-600 text-[11px] text-center mt-3">
                  Google Calendar invite sent to both parties once payment is complete.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function DeckReviewInfo() {
  return (
    <div>
      <div className="w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 mb-7 p-8 flex flex-col items-center justify-center text-center min-h-[240px]">
        <div className="w-16 h-16 rounded-2xl bg-dfv/10 border border-dfv/20 flex items-center justify-center mb-5">
          <svg
            width="28"
            height="28"
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
          </svg>
        </div>
        <h1 className="font-display text-3xl text-white tracking-tight mb-2">
          Pitch Deck Review
        </h1>
        <p className="text-dfv-light font-semibold text-xs uppercase tracking-widest">
          DFV Partners
        </p>
      </div>

      <p className="text-zinc-400 text-base leading-relaxed mb-6">
        Get sharp, actionable feedback on your pitch deck from a Dragon Fruit Ventures partner
        before you go out to raise.
      </p>

      <div className="space-y-4 mb-6">
        {[
          { label: 'What you get', detail: '30-minute live review + written notes on your deck' },
          { label: 'Who reviews', detail: 'Rotates between Christian, Matt, and Omar' },
          { label: 'Turnaround', detail: 'Session scheduled within your chosen time slot' },
        ].map(({ label, detail }) => (
          <div key={label} className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-dfv-light mt-2 flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-semibold">{label}</p>
              <p className="text-zinc-500 text-sm">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {['deck', 'pitch', 'feedback', 'fundraising'].map((tag) => (
          <span
            key={tag}
            className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
