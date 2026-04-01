'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import { formatCents } from '@/lib/utils';
import type { ExpertProfile } from '@/types';

const SESSION_DURATION = 60; // minutes
const PLATFORM_FEE_PERCENT = 15; // fallback; real value comes from API

export default function BookExpertPage() {
  const params = useParams();
  const router = useRouter();
  const expertId = params.expertId as string;

  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clientContext, setClientContext] = useState('');

  useEffect(() => {
    async function loadExpert() {
      try {
        const res = await fetch(`/api/experts/${expertId}`);
        if (!res.ok) throw new Error('Expert not found');
        const data = await res.json();
        setExpert(data.expert);
      } catch {
        setError('Unable to load expert profile.');
      } finally {
        setLoading(false);
      }
    }
    loadExpert();
  }, [expertId]);

  const sessionFee = expert ? expert.rate_per_hour * (SESSION_DURATION / 60) : 0;
  const platformFee = Math.round(sessionFee * (PLATFORM_FEE_PERCENT / 100));
  const totalAmount = sessionFee + platformFee;

  const handleSubmit = async () => {
    if (!expert) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: expert.id,
          clientContext: clientContext.trim(),
          duration: SESSION_DURATION,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Booking failed');
      }

      const { checkoutUrl } = await res.json();
      router.push(checkoutUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="h-64 rounded-xl bg-gray-200" />
            <div className="h-64 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Expert Not Found</h1>
        <p className="mt-2 text-gray-500">
          The expert profile could not be loaded.
        </p>
        <button
          type="button"
          onClick={() => router.push('/directory')}
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Browse Experts
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Book a Session</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Expert Mini Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar src={expert.headshot_url} name={expert.name} size="lg" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {expert.name}
              </h2>
              <div className="flex items-center gap-1 mt-0.5">
                <StarRating rating={expert.rating_avg ?? 0} size="sm" />
                <span className="text-xs text-gray-500">
                  ({expert.review_count})
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Rate</span>
              <span className="font-medium text-gray-900">
                {formatCents(expert.rate_per_hour)}/hr
              </span>
            </div>
            {expert.calendly_event_type_name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Session Type</span>
                <span className="font-medium text-gray-900">
                  {expert.calendly_event_type_name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-gray-900">
                {SESSION_DURATION} min
              </span>
            </div>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Session Details
          </h3>

          <div className="mb-4">
            <label
              htmlFor="context"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              What would you like to discuss?
            </label>
            <textarea
              id="context"
              rows={4}
              maxLength={200}
              value={clientContext}
              onChange={(e) => setClientContext(e.target.value)}
              placeholder="Briefly describe what you'd like to cover..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {clientContext.length}/200
            </p>
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Session fee</span>
              <span className="text-gray-900">{formatCents(sessionFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platform fee</span>
              <span className="text-gray-900">{formatCents(platformFee)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCents(totalAmount)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
