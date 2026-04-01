'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { packages } from '../../lib/packages';
import CalendlyEmbed from '../../components/CalendlyEmbed';

export default function AdvisorBooking({ advisor }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectedPackageRef = useRef(null);

  function handlePackageSelect(pkg) {
    setSelectedPackage(pkg);
    selectedPackageRef.current = pkg;
    setAwaitingPayment(false);
  }

  // Fires when user picks a date/time slot but before they submit their details
  const handleDateTimeSelected = useCallback(() => {
    setAwaitingPayment(true);
  }, []);

  // Fires when user completes the full Calendly booking — auto-redirect to Stripe
  const handleEventScheduled = useCallback(() => {
    const pkg = selectedPackageRef.current;
    if (!pkg) return;
    setLoading(true);

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageSlug: pkg.id, advisorId: advisor.id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Something went wrong. Please try again.');
          setLoading(false);
        }
      })
      .catch(() => {
        alert('Something went wrong. Please try again.');
        setLoading(false);
      });
  }, [advisor.id]);

  // Manual pay button (shown in the "time selected" panel)
  async function handleCheckout() {
    if (!selectedPackage) return;
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageSlug: selectedPackage.id, advisorId: advisor.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const calendlyUrl = selectedPackage
    ? advisor?.calendlyUrls?.[selectedPackage.id] || '#'
    : '#';

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

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 pb-20">

          {/* Left — Advisor profile (sticky) */}
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
            <p className="text-zinc-400 text-base leading-relaxed mb-6">
              {advisor.bio}
            </p>
            <div className="flex flex-wrap gap-2">
              {advisor.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Booking column */}
          <div className="flex flex-col gap-4">
            {/* Booking card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              {/* Card header */}
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

              {/* Session type toggles */}
              <div className="p-5">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
                  How deep do you want to go?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handlePackageSelect(pkg)}
                      className={`py-3 px-2 rounded-xl text-center transition-all duration-200 ${
                        selectedPackage?.id === pkg.id
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

                {!selectedPackage && (
                  <p className="text-zinc-600 text-xs text-center mt-4">
                    Select a session type to see available times
                  </p>
                )}
              </div>

              {/* Flow indicator */}
              <div className="border-t border-zinc-800 py-3 px-5">
                <div className="flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-widest">
                  {[
                    { label: 'Session', step: 1 },
                    { label: 'Time', step: 2 },
                    { label: 'Pay', step: 3 },
                  ].map(({ label, step }, i, arr) => {
                    const active = selectedPackage
                      ? awaitingPayment
                        ? step <= 3
                        : step <= 2
                      : step <= 1;
                    return (
                      <span key={label} className="flex items-center gap-2">
                        <span className={active ? 'text-dfv-light' : 'text-zinc-600'}>{label}</span>
                        {i < arr.length - 1 && (
                          <span className={`w-4 h-px ${active ? 'bg-dfv/40' : 'bg-zinc-700'}`} />
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time selected — pay to confirm panel */}
            {selectedPackage && awaitingPayment && (
              <div className="rounded-2xl border border-dfv/30 bg-dfv/5 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold">{selectedPackage.name}</p>
                    <p className="text-zinc-500 text-sm">{selectedPackage.duration} min &middot; with {advisor.name}</p>
                  </div>
                  <p className="text-2xl font-bold text-white">${selectedPackage.price}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold py-3.5 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Pay to confirm'
                  )}
                </button>
                <p className="text-zinc-600 text-[11px] text-center mt-3">
                  Your spot is reserved once payment is completed.
                </p>
              </div>
            )}

            {/* Calendly embed — shown immediately when session type selected */}
            {selectedPackage && !awaitingPayment && calendlyUrl !== '#' && (
              <div className="rounded-2xl overflow-hidden border border-zinc-800">
                <CalendlyEmbed
                  url={calendlyUrl}
                  onDateTimeSelected={handleDateTimeSelected}
                  onEventScheduled={handleEventScheduled}
                />
              </div>
            )}

            {/* Loading overlay when redirecting after Calendly */}
            {loading && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
                <svg className="animate-spin h-6 w-6 text-dfv-light mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-zinc-400 text-sm">Taking you to payment...</p>
              </div>
            )}

            {selectedPackage && calendlyUrl === '#' && !awaitingPayment && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
                <p className="text-zinc-500 text-sm">
                  Scheduling not yet configured for this session type.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
