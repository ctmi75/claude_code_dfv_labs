'use client';

import { useState } from 'react';
import Link from 'next/link';
import { packages } from '../../lib/packages';
import PackageGrid from '../../components/PackageGrid';
import CheckoutBar from '../../components/CheckoutBar';

export default function AdvisorBooking({ advisor }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="relative min-h-screen pb-28 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-dfv/10 rounded-full blur-[120px] pointer-events-none" />

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

        {/* Hero */}
        <section className="pt-12 pb-14">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-zinc-800">
              <img
                src={advisor.headshotUrl}
                alt={advisor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-dfv-light font-semibold text-sm tracking-wide uppercase mb-1">Session with</p>
              <h1 className="font-display text-4xl md:text-5xl text-white tracking-tight italic">
                {advisor.name}.
              </h1>
            </div>
          </div>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
            Pick a session, pay once, then lock in your time.
          </p>
        </section>

        {/* Packages */}
        <section className="pb-16">
          <PackageGrid
            packages={packages}
            selectedPackage={selectedPackage}
            onSelect={setSelectedPackage}
          />
        </section>

        {/* Flow Indicator */}
        <section className="pb-8 text-center">
          <div className="inline-flex items-center gap-3 text-[11px] text-zinc-600 font-medium uppercase tracking-widest">
            <span>Select session</span>
            <span className="w-4 h-px bg-zinc-700" />
            <span>Pay via Stripe</span>
            <span className="w-4 h-px bg-zinc-700" />
            <span>Book on Calendly</span>
          </div>
        </section>
      </div>

      {/* Checkout Bar */}
      <CheckoutBar
        selectedPackage={selectedPackage}
        onCheckout={handleCheckout}
        loading={loading}
      />
    </main>
  );
}
