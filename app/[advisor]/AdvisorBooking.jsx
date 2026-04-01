'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { packages } from '../../lib/packages';
import CalendlyEmbed from '../../components/CalendlyEmbed';

export default function AdvisorBooking({ advisor }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [timeSelected, setTimeSelected] = useState(false);
  const [loading, setLoading] = useState(false);

  function handlePackageSelect(pkg) {
    setSelectedPackage(pkg);
    setTimeSelected(false);
  }

  const handleTimeSelected = useCallback(() => {
    setTimeSelected(true);
  }, []);

  async function handleCheckout() {
    if (!selectedPackage) return;
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageSlug: selectedPackage.id,
          advisorId: advisor.id,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const calendlyUrl = selectedPackage
    ? advisor?.calendlyUrls?.[selectedPackage.id] || '#'
    : '#';

  const step = timeSelected ? 3 : selectedPackage ? 2 : 1;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-dfv/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6">
        {/* Header */}
        <header className="pt-12 pb-6 flex items-center justify-between">
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 pt-6 pb-10">
          {/* Left — Advisor profile */}
          <div className="lg:col-span-3">
            {/* Large headshot */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-8 bg-zinc-800">
              <img
                src={advisor.headshotUrl}
                alt={advisor.name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Name & role */}
            <h1 className="font-display text-4xl md:text-5xl text-white tracking-tight mb-2">
              {advisor.name}
            </h1>
            <p className="text-dfv-light font-semibold text-sm uppercase tracking-widest mb-5">
              {advisor.role}
            </p>

            <hr className="border-zinc-800 mb-6" />

            {/* Bio */}
            <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-xl">
              {advisor.bio}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {advisor.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Booking card */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              {/* Card header */}
              <div className="flex flex-col items-center pt-8 pb-6 px-6">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-zinc-700 mb-4">
                  <img
                    src={advisor.headshotUrl}
                    alt={advisor.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h2 className="font-display text-2xl text-white text-center leading-tight">
                  Connect with<br />{advisor.name}
                </h2>
                <p className="text-zinc-500 text-sm text-center mt-1">{advisor.role}</p>
              </div>

              <div className="px-6 pb-6">
                {/* Session type toggle */}
                <p className="text-white font-semibold text-sm mb-3">
                  How deep do you want to go?
                </p>
                <div className="grid grid-cols-3 gap-2 mb-6">
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
                      <span className="block text-[11px] opacity-70 mt-0.5">
                        ({pkg.duration} min)
                      </span>
                    </button>
                  ))}
                </div>

                {/* Status / CTA area */}
                {!selectedPackage && (
                  <p className="text-zinc-600 text-sm text-center py-3">
                    Select a session type to see availability
                  </p>
                )}

                {selectedPackage && !timeSelected && (
                  <div className="text-center py-3">
                    <p className="text-zinc-400 text-sm mb-1">
                      Pick your time below
                    </p>
                    <svg className="mx-auto text-dfv-light animate-bounce mt-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </div>
                )}

                {selectedPackage && timeSelected && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-semibold text-sm">{selectedPackage.name}</p>
                        <p className="text-zinc-500 text-xs">{selectedPackage.duration} min session</p>
                      </div>
                      <p className="text-2xl font-bold text-white tracking-tight">
                        ${selectedPackage.price}
                      </p>
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
                    <p className="text-zinc-600 text-[11px] text-center mt-3 leading-relaxed">
                      Your spot is reserved once payment is completed.
                    </p>
                  </div>
                )}
              </div>

              {/* Flow indicator */}
              <div className="border-t border-zinc-800 py-4 px-6">
                <div className="flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-widest">
                  <span className={step >= 1 ? 'text-dfv-light' : 'text-zinc-600'}>
                    Session
                  </span>
                  <span className={`w-4 h-px ${step >= 2 ? 'bg-dfv/50' : 'bg-zinc-700'}`} />
                  <span className={step >= 2 ? 'text-dfv-light' : 'text-zinc-600'}>
                    Time
                  </span>
                  <span className={`w-4 h-px ${step >= 3 ? 'bg-dfv/50' : 'bg-zinc-700'}`} />
                  <span className={step >= 3 ? 'text-dfv-light' : 'text-zinc-600'}>
                    Pay
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendly section — shown after session type selected */}
        {selectedPackage && calendlyUrl !== '#' && (
          <section className="pb-16" id="pick-time">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-dfv/10 border border-dfv/20 flex items-center justify-center">
                <span className="text-dfv-light font-bold text-sm">2</span>
              </div>
              <h2 className="text-white font-semibold text-xl tracking-tight">
                Pick your time
              </h2>
            </div>
            <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-white">
              <CalendlyEmbed url={calendlyUrl} onEventScheduled={handleTimeSelected} />
            </div>
          </section>
        )}

        {selectedPackage && (calendlyUrl === '#' || !calendlyUrl) && (
          <section className="pb-16 text-center">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12">
              <p className="text-zinc-500 text-sm">
                Scheduling is not yet configured for this session type.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky bottom bar — shown when time is selected */}
      {selectedPackage && timeSelected && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 py-4 z-50 lg:hidden">
          <div className="max-w-[800px] mx-auto px-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-white">{selectedPackage.name}</p>
              <p className="text-zinc-500 text-xs">{selectedPackage.duration} min &middot; ${selectedPackage.price} USD</p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-200 disabled:opacity-40"
            >
              {loading ? 'Processing...' : 'Pay to confirm'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
