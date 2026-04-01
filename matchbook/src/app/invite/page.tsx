'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function InvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No invite token provided');
      setLoading(false);
      return;
    }

    async function validateToken() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Invalid invite');
          setLoading(false);
          return;
        }

        setRole(data.role);
        if (data.email) {
          setInviteEmail(data.email);
          setEmail(data.email);
        }
      } catch {
        setError('Failed to validate invite');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invite');
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md text-center">
        {/* Logo / Title */}
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Matchbook</h1>
          <p className="mt-1 text-sm text-gray-500">
            Internal Expert Booking Platform
          </p>
        </div>

        {loading ? (
          <div className="py-8">
            <p className="text-sm text-gray-500">Validating invite...</p>
          </div>
        ) : error && !role ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <Link
              href="/"
              className="inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              &larr; Back to sign in
            </Link>
          </div>
        ) : sent ? (
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Magic link sent! Check your email to complete your registration.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">
                You&apos;ve been invited as{' '}
                <span className="capitalize">{role}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-left">
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input"
                  readOnly={!!inviteEmail}
                />
                {inviteEmail && (
                  <p className="mt-1 text-xs text-gray-500">
                    This invite is tied to this email address
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Processing...' : 'Accept & Create Account'}
              </button>
            </form>

            <div className="border-t border-gray-200 pt-4">
              <Link
                href="/"
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Already have an account? Sign in &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
