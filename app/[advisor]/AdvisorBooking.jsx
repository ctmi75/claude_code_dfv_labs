'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { packages } from '../../lib/packages';
import TimeSlotPicker from '../../components/TimeSlotPicker';

const defaultPackage = packages.find((p) => p.featured) ?? packages[0];

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
  const [selectedPackage, setSelectedPackage] = useState(defaultPackage);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch availability whenever advisor or session type changes
  useEffect(() => {
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);

    fetch(`/api/calendly/availability?advisorId=${advisor.id}&packageSlug=${selectedPackage.id}`)
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All advisors
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 pb-20">

          {/* ── Left: Advisor profile (sticky) ── */}
          <div className="lg:sticky lg:top-8 lg:self-start">
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
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Booking column ── */}
          <div className="flex flex-col gap-4">

            {/* Booking card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              {/* Advisor mini-header */}
              <div className="flex items-center gap-4 p-5 border-b border-zinc-800">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-700 flex-shrink-0">
                  <img
                    src={advisor.headshotUrl}
                    alt={advisor.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-medium">Connect with</p>
                  <h2 className="font-display text-xl text-white leading-tight">{advisor.name}</h2>
                </div>
              </div>

              {/* Session type + time picker */}
              <div className="p-5">
                {/* Session toggles */}
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
                  Session length
                </p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {packages.map((pkg) => (
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
                      <span className="block text-[11px] opacity-60 mt-0.5">{pkg.duration} min</span>
                    </button>
                  ))}
                </div>

                {/* Time slots */}
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
                  Pick a time
                </p>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <svg className="animate-spin h-5 w-5 text-dfv-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
                <span className="text-zinc-600">Confirmed + invite sent</span>
              </div>
            </div>

            {/* Pay-to-confirm panel — appears when a slot is selected */}
            {selectedSlot && (
              <div className="rounded-2xl border border-dfv/30 bg-dfv/5 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold">{selectedPackage.name}</p>
                    <p className="text-zinc-400 text-sm mt-0.5">{formatSlotSummary(selectedSlot)}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">with {advisor.name}</p>
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
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    'Pay to confirm'
                  )}
                </button>

                <p className="text-zinc-600 text-[11px] text-center mt-3">
                  Calendar invite sent to both parties once payment is complete.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
