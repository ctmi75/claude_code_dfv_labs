'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  UserCheck,
  Users,
  Calendar,
  Loader2,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { cn, formatCents, formatDate, formatDateTime } from '@/lib/utils';
import type { Session, ExpertProfile } from '@/types';

interface StatsData {
  total_gmv: number;
  total_fees: number;
  total_payouts: number;
  expert_count: number;
  client_count: number;
  session_count: number;
  recent_sessions: (Session & { expert_profile?: ExpertProfile; client?: { name: string; email: string } })[];
  top_experts: {
    name: string;
    sessions: number;
    revenue: number;
    rating: number | null;
  }[];
}

const statusVariant: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
  completed: 'green',
  confirmed: 'blue',
  payment_confirmed: 'blue',
  pending_payment: 'yellow',
  cancelled: 'red',
  refunded: 'red',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error || 'Failed to load dashboard data'}
      </div>
    );
  }

  const statCards = [
    { label: 'Total GMV', value: formatCents(stats.total_gmv), icon: DollarSign, color: 'text-green-600 bg-green-100' },
    { label: 'Platform Fees', value: formatCents(stats.total_fees), icon: TrendingUp, color: 'text-blue-600 bg-blue-100' },
    { label: 'Net Payouts', value: formatCents(stats.total_payouts), icon: Wallet, color: 'text-purple-600 bg-purple-100' },
    { label: 'Active Experts', value: stats.expert_count.toString(), icon: UserCheck, color: 'text-amber-600 bg-amber-100' },
    { label: 'Active Clients', value: stats.client_count.toString(), icon: Users, color: 'text-indigo-600 bg-indigo-100' },
    { label: 'Total Sessions', value: stats.session_count.toString(), icon: Calendar, color: 'text-pink-600 bg-pink-100' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2', card.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue</h2>
        <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          Revenue Chart — integrate chart library
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Sessions */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Sessions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Client</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Expert</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Date</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Amount</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Status</th>
                  <th className="whitespace-nowrap pb-3 font-medium">Payout</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_sessions.map((session) => (
                  <tr key={session.id} className="border-b border-gray-100">
                    <td className="whitespace-nowrap py-3 pr-4">
                      {session.client?.name || 'Unknown'}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {session.expert_profile?.name || 'Unknown'}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-gray-500">
                      {session.scheduled_at ? formatDate(session.scheduled_at) : '-'}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {formatCents(session.amount_cents)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      <Badge variant={statusVariant[session.status] || 'gray'}>
                        {session.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap py-3">
                      <Badge
                        variant={
                          session.payout_status === 'transferred'
                            ? 'green'
                            : session.payout_status === 'failed'
                            ? 'red'
                            : 'yellow'
                        }
                      >
                        {session.payout_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {stats.recent_sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No sessions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Experts Leaderboard */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top Experts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Name</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Sessions</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Revenue</th>
                  <th className="whitespace-nowrap pb-3 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_experts.map((expert, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="whitespace-nowrap py-3 pr-4 font-medium">
                      {expert.name}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">{expert.sessions}</td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {formatCents(expert.revenue)}
                    </td>
                    <td className="whitespace-nowrap py-3">
                      {expert.rating ? (
                        <StarRating rating={expert.rating} size="sm" />
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
                {stats.top_experts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No experts yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
