'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { formatCents, formatDateTime } from '@/lib/utils';
import type { Session } from '@/types';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function loadSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Session Booked!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your session has been confirmed. You will receive a scheduling link
          shortly.
        </p>

        {loading ? (
          <div className="mt-6 animate-pulse space-y-2">
            <div className="h-4 w-40 mx-auto rounded bg-gray-200" />
            <div className="h-4 w-32 mx-auto rounded bg-gray-200" />
          </div>
        ) : session ? (
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-gray-900">
                {session.duration_minutes} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium text-gray-900">
                {formatCents(session.amount_cents)}
              </span>
            </div>
            {session.scheduled_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(session.scheduled_at)}
                </span>
              </div>
            )}
            {session.calendly_scheduling_link && (
              <div className="pt-2 border-t border-gray-200">
                <a
                  href={session.calendly_scheduling_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  Schedule on Calendly
                </a>
              </div>
            )}
            {!session.calendly_scheduling_link && (
              <p className="pt-2 border-t border-gray-200 text-xs text-gray-400">
                A scheduling link will be sent to your email.
              </p>
            )}
          </div>
        ) : null}

        <Link
          href="/sessions"
          className="mt-8 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          View My Sessions
        </Link>
      </div>
    </div>
  );
}
