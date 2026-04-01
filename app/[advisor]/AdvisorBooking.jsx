'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { packages } from '../../lib/packages';
import CalendlyEmbed from '../../components/CalendlyEmbed';

const defaultPackage = packages.find((p) => p.featured) ?? packages[0];

export default function AdvisorBooking({ advisor }) {
  const [selectedPackage, setSelectedPackage] = useState(defaultPackage);
  const [loading, setLoading] = useState(false);
  const selectedPackageRef = useRef(defaultPackage);

  function handlePackageSelect(pkg) {
    setSelectedPackage(pkg);
    selectedPackageRef.current = pkg;
  }

  // Fires when user clicks a time slot on Calendly — BEFORE they fill in
  // their details, so no booking has been created yet. We redirect to Stripe
  // immediately. After payment, the success page completes the Calendly booking.
  async function handleDateTimeSelected() {
    const pkg = selectedPackageRef.current;
    if (!pkg || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageSlug: pkg.id, advisorId: advisor.id }),
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

  const calendlyUrl = advisor?.calendlyUrls?.[selectedPackage.id] || '#';

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

          {/* Left — Advisor profile (sticky on desktop) */}
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

          {/* Right — Booking column */}
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

              {/* Session type selector */}
              <div className="p-5">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
                  Session length
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handlePackageSelect(pkg)}
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

                {/* Price + prompt */}
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-sm">
                    <span className="text-white font-bold text-lg">${selectedPackage.price}</span>
                    {' '}USD
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Select a time to continue →
                  </p>
                </div>
              </div>

              {/* Flow steps */}
              <div className="border-t border-zinc-800 py-3 px-5 flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-widest">
                <span className="text-dfv-light">Pick time</span>
                <span className="w-4 h-px bg-zinc-700" />
                <span className="text-zinc-600">Pay</span>
                <span className="w-4 h-px bg-zinc-700" />
                <span className="text-zinc-600">Confirmed</span>
              </div>
            </div>

            {/* Calendly — loads immediately */}
            {loading ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-10 text-center">
                <svg className="animate-spin h-6 w-6 text-dfv-light mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-zinc-400 text-sm">Taking you to payment…</p>
              </div>
            ) : calendlyUrl !== '#' ? (
              <div className="rounded-2xl overflow-hidden border border-zinc-800">
                <CalendlyEmbed
                  key={selectedPackage.id}
                  url={calendlyUrl}
                  onDateTimeSelected={handleDateTimeSelected}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
                <p className="text-zinc-500 text-sm">Scheduling not yet configured for this session type.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
