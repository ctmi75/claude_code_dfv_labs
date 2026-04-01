'use client';

import { useState, useEffect } from 'react';
import { formatCents, formatDate, formatDateTime } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import {
  Calendar,
  DollarSign,
  Star,
  MessageSquare,
  Loader2,
  ArrowRight,
  Settings,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface ExpertProfile {
  name: string;
  rating_avg: number;
  review_count: number;
  approved: boolean;
  stripe_onboarding_complete: boolean;
  calendly_event_type_name: string | null;
}

interface Session {
  id: string;
  client: { name: string; email: string } | null;
  scheduled_at: string;
  duration_minutes: number;
  amount_cents: number;
  status: string;
  client_context: string | null;
}

interface Review {
  rating: number;
  note: string | null;
  created_at: string;
  client: { name: string } | null;
}

export default function ExpertDashboard() {
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming: 0,
    totalEarned: 0,
    totalSessions: 0,
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const [profileRes, sessionsRes] = await Promise.all([
        fetch('/api/experts/profile/me'),
        fetch('/api/sessions?role=expert&limit=10'),
      ]);

      if (profileRes.ok) {
        setProfile(await profileRes.json());
      }
      if (sessionsRes.ok) {
        const s = await sessionsRes.json();
        setSessions(Array.isArray(s) ? s : s.sessions || []);

        const upcoming = s.filter?.(
          (sess: Session) =>
            sess.status === 'confirmed' &&
            new Date(sess.scheduled_at) > new Date()
        );
        const completed = s.filter?.(
          (sess: Session) => sess.status === 'completed'
        );
        const totalEarned = completed?.reduce(
          (sum: number, sess: Session) => sum + sess.amount_cents,
          0
        );

        setStats({
          upcoming: upcoming?.length || 0,
          totalEarned: totalEarned || 0,
          totalSessions: completed?.length || 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const upcomingSessions = sessions.filter(
    (s) =>
      s.status === 'confirmed' && new Date(s.scheduled_at) > new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.name || 'Expert'}
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s your dashboard overview
          </p>
        </div>

        {/* Approval banner */}
        {profile && !profile.approved && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            Your profile is pending approval. You&apos;ll be notified once
            an admin reviews it.
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.upcoming}
              </p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
          <div className="card flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCents(stats.totalEarned)}
              </p>
              <p className="text-xs text-gray-500">Total Earned</p>
            </div>
          </div>
          <div className="card flex items-start gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {profile?.rating_avg?.toFixed(1) || '—'}
              </p>
              <p className="text-xs text-gray-500">Avg Rating</p>
            </div>
          </div>
          <div className="card flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {profile?.review_count || 0}
              </p>
              <p className="text-xs text-gray-500">Reviews</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/onboarding"
            className="card flex items-center justify-between hover:ring-2 hover:ring-brand-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-700">Edit Profile</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/sessions"
            className="card flex items-center justify-between hover:ring-2 hover:ring-brand-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-700">All Sessions</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/sessions"
            className="card flex items-center justify-between hover:ring-2 hover:ring-brand-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-700">
                Payout History
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        {/* Upcoming sessions */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Sessions
          </h2>
          {upcomingSessions.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">
              No upcoming sessions
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.client?.name || 'Client'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(session.scheduled_at)} ·{' '}
                      {session.duration_minutes} min
                    </p>
                    {session.client_context && (
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-md">
                        {session.client_context}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCents(session.amount_cents)}
                    </p>
                    <Badge variant="green">Confirmed</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
