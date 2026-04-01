'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { cn, formatCents, formatDateTime } from '@/lib/utils';
import type { Session, SessionStatus } from '@/types';

type TabKey = 'upcoming' | 'past' | 'cancelled';

const TABS: { key: TabKey; label: string; statuses: string }[] = [
  { key: 'upcoming', label: 'Upcoming', statuses: 'pending_payment,payment_confirmed,confirmed' },
  { key: 'past', label: 'Past', statuses: 'completed' },
  { key: 'cancelled', label: 'Cancelled', statuses: 'cancelled,refunded' },
];

const STATUS_BADGE: Record<SessionStatus, { label: string; variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }> = {
  pending_payment: { label: 'Pending Payment', variant: 'yellow' },
  payment_confirmed: { label: 'Payment Confirmed', variant: 'blue' },
  confirmed: { label: 'Confirmed', variant: 'green' },
  completed: { label: 'Completed', variant: 'green' },
  cancelled: { label: 'Cancelled', variant: 'red' },
  refunded: { label: 'Refunded', variant: 'gray' },
};

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Review modal state
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const tab = TABS.find((t) => t.key === activeTab)!;
      const params = new URLSearchParams({ status: tab.statuses, limit: '50', offset: '0' });
      const res = await fetch(`/api/sessions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCancel = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    setCancellingId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewSessionId || reviewRating === 0) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/sessions/${reviewSessionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, note: reviewNote.trim() || null }),
      });
      if (res.ok) {
        setReviewSessionId(null);
        setReviewRating(0);
        setReviewNote('');
        fetchSessions();
      }
    } catch {
      // ignore
    } finally {
      setSubmittingReview(false);
    }
  };

  const getOtherPartyName = (session: Session) => {
    return session.expert_profile?.name || session.client?.name || 'Unknown';
  };

  const getOtherPartyAvatar = (session: Session) => {
    return session.expert_profile?.headshot_url || session.client?.avatar_url || null;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sessions</h1>

      {/* Tab Nav */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Session List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-48 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700">No sessions</h2>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'upcoming'
              ? 'You have no upcoming sessions.'
              : activeTab === 'past'
                ? 'No completed sessions yet.'
                : 'No cancelled sessions.'}
          </p>
          {activeTab === 'upcoming' && (
            <Link
              href="/directory"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Browse Experts
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const statusInfo = STATUS_BADGE[session.status];
            return (
              <div
                key={session.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      src={getOtherPartyAvatar(session)}
                      name={getOtherPartyName(session)}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getOtherPartyName(session)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        {session.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateTime(session.scheduled_at)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {session.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatCents(session.amount_cents)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>

                    {activeTab === 'upcoming' &&
                      session.status !== 'pending_payment' && (
                        <button
                          type="button"
                          onClick={() => handleCancel(session.id)}
                          disabled={cancellingId === session.id}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {cancellingId === session.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}

                    {activeTab === 'past' && (
                      <button
                        type="button"
                        onClick={() => setReviewSessionId(session.id)}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                      >
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Leave a Review
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <StarRating
                rating={reviewRating}
                interactive
                onChange={setReviewRating}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="reviewNote"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Note (optional)
              </label>
              <textarea
                id="reviewNote"
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Share your experience..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReviewSessionId(null);
                  setReviewRating(0);
                  setReviewNote('');
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || submittingReview}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
