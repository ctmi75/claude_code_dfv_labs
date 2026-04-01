'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Loader2,
  MoreVertical,
  CheckCircle,
  Ban,
  Pencil,
  X,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { cn, formatCents } from '@/lib/utils';
import type { ExpertProfile } from '@/types';

type Tab = 'all' | 'pending' | 'approved' | 'suspended';

interface ExpertRow extends ExpertProfile {
  sessions_count: number;
  total_revenue: number;
}

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'suspended', label: 'Suspended' },
];

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ id: string; rate: number } | null>(null);
  const [editRate, setEditRate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExperts();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchExperts() {
    try {
      setLoading(true);
      const res = await fetch('/api/experts?admin=true');
      if (!res.ok) throw new Error('Failed to fetch experts');
      const data = await res.json();
      setExperts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load experts');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: string, rate_per_hour?: number) {
    try {
      setActionLoading(true);
      const body: Record<string, unknown> = { action };
      if (rate_per_hour !== undefined) body.rate_per_hour = rate_per_hour;

      const res = await fetch(`/api/admin/experts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Action failed');
      await fetchExperts();
      setActionMenuId(null);
      setEditModal(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  function getStatus(expert: ExpertRow): 'pending' | 'approved' | 'suspended' {
    if (!expert.approved && expert.stripe_onboarding_complete) return 'suspended';
    if (!expert.approved) return 'pending';
    return 'approved';
  }

  const filtered = experts.filter((expert) => {
    const status = getStatus(expert);
    if (tab !== 'all' && status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        expert.name.toLowerCase().includes(q) ||
        (expert.bio && expert.bio.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Expert Management</h1>

      {/* Search + Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search experts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Name</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Email</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Rate</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Sessions</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Revenue</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Rating</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((expert) => {
              const status = getStatus(expert);
              return (
                <tr key={expert.id} className="border-b border-gray-100">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {expert.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {expert.user_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCents(expert.rate_per_hour)}/hr
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {expert.sessions_count || 0}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCents(expert.total_revenue || 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {expert.rating_avg ? (
                      <StarRating rating={expert.rating_avg} size="sm" />
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge
                      variant={
                        status === 'approved'
                          ? 'green'
                          : status === 'pending'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {status}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="relative" ref={actionMenuId === expert.id ? menuRef : undefined}>
                      <button
                        onClick={() =>
                          setActionMenuId(actionMenuId === expert.id ? null : expert.id)
                        }
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                      {actionMenuId === expert.id && (
                        <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200">
                          {status === 'pending' && (
                            <button
                              onClick={() => handleAction(expert.id, 'approve')}
                              disabled={actionLoading}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Approve
                            </button>
                          )}
                          {status === 'approved' && (
                            <button
                              onClick={() => handleAction(expert.id, 'suspend')}
                              disabled={actionLoading}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                              Suspend
                            </button>
                          )}
                          {status === 'suspended' && (
                            <button
                              onClick={() => handleAction(expert.id, 'unsuspend')}
                              disabled={actionLoading}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Unsuspend
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditModal({
                                id: expert.id,
                                rate: expert.rate_per_hour,
                              });
                              setEditRate((expert.rate_per_hour / 100).toString());
                              setActionMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                            Edit Rate
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  No experts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Rate Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Rate</h3>
              <button
                onClick={() => setEditModal(null)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Rate per hour ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editRate}
              onChange={(e) => setEditRate(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditModal(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(
                    editModal.id,
                    'update_rate',
                    Math.round(parseFloat(editRate) * 100)
                  )
                }
                disabled={actionLoading}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
