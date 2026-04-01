'use client';

import { useState } from 'react';
import { packages } from '../lib/packages';
import PackageGrid from '../components/PackageGrid';
import CheckoutBar from '../components/CheckoutBar';

export default function Home() {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!selectedPackage) return;
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageSlug: selectedPackage.id }),
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
    <main className="min-h-screen pb-28">
      <div className="max-w-[720px] mx-auto px-6">
        {/* Header */}
        <header className="pt-10 pb-4 flex items-center gap-3">
          {/* DFV Hexagon Logo */}
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
            Book time with Christian.
          </h1>
          <p className="text-gray-500 font-light text-lg leading-relaxed max-w-md">
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
          <p className="text-xs text-gray-300 tracking-wide">
            Select session &nbsp;&rarr;&nbsp; Pay via Stripe &nbsp;&rarr;&nbsp; Book on Calendly
          </p>
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
