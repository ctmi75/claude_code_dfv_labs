'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  Download,
  CheckCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { cn, formatCents, formatDateTime } from '@/lib/utils';
import type { Session, ExpertProfile, User } from '@/types';

type StatusTab = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending_payout';

interface SessionRow extends Session {
  expert_profile?: ExpertProfile;
  client?: User;
}

const statusTabs: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'pending_payout', label: 'Pending Payout' },
];

const statusVariant: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
  completed: 'green',
  confirmed: 'blue',
  payment_confirmed: 'blue',
  pending_payment: 'yellow',
  cancelled: 'red',
  refunded: 'red',
};

const payoutVariant: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  transferred: 'green',
  pending: 'yellow',
  failed: 'red',
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<StatusTab>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [tab, fromDate, toDate]);

  async function fetchSessions() {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (tab === 'upcoming') {
        params.set('status', 'confirmed');
      } else if (tab === 'completed') {
        params.set('status', 'completed');
      } else if (tab === 'cancelled') {
        params.set('status', 'cancelled');
      } else if (tab === 'pending_payout') {
        params.set('payout_status', 'pending');
      }

      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);

      const res = await fetch(`/api/admin/sessions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(sessionId: string, action: string) {
    const confirmMsg =
      action === 'cancel'
        ? 'Are you sure you want to cancel this session?'
        : action === 'issue_refund'
        ? 'Are you sure you want to issue a refund?'
        : 'Approve payout for this session?';

    if (!confirm(confirmMsg)) return;

    try {
      setActionLoading(sessionId);
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }
      await fetchSessions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  function exportCSV() {
    const headers = [
      'Client',
      'Expert',
      'Date/Time',
      'Duration (min)',
      'Amount',
      'Platform Fee',
      'Status',
      'Payout Status',
    ];

    const rows = sessions.map((s) => [
      s.client?.name || 'Unknown',
      s.expert_profile?.name || 'Unknown',
      s.scheduled_at ? formatDateTime(s.scheduled_at) : '-',
      s.duration_minutes.toString(),
      formatCents(s.amount_cents),
      formatCents(s.platform_fee_cents),
      s.status,
      s.payout_status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && sessions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {statusTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-brand-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="From"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="To"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Client</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Expert</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Date/Time</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Duration</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Amount</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Platform Fee</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Payout</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b border-gray-100">
                <td className="whitespace-nowrap px-4 py-3">
                  {session.client?.name || 'Unknown'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {session.expert_profile?.name || 'Unknown'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {session.scheduled_at
                    ? formatDateTime(session.scheduled_at)
                    : '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {session.duration_minutes} min
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatCents(session.amount_cents)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatCents(session.platform_fee_cents)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={statusVariant[session.status] || 'gray'}>
                    {session.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={payoutVariant[session.payout_status] || 'gray'}>
                    {session.payout_status}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-1">
                    {session.payout_status === 'pending' &&
                      session.status === 'completed' && (
                        <button
                          onClick={() =>
                            handleAction(session.id, 'approve_payout')
                          }
                          disabled={actionLoading === session.id}
                          className="rounded p-1.5 text-green-600 hover:bg-green-50"
                          title="Approve Payout"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    {session.status !== 'refunded' &&
                      session.status !== 'cancelled' && (
                        <button
                          onClick={() =>
                            handleAction(session.id, 'issue_refund')
                          }
                          disabled={actionLoading === session.id}
                          className="rounded p-1.5 text-amber-600 hover:bg-amber-50"
                          title="Issue Refund"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    {session.status !== 'cancelled' &&
                      session.status !== 'refunded' &&
                      session.status !== 'completed' && (
                        <button
                          onClick={() => handleAction(session.id, 'cancel')}
                          disabled={actionLoading === session.id}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          title="Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-400">
                  No sessions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
