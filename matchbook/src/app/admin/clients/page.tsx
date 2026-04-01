'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader2, ExternalLink, ShieldOff } from 'lucide-react';
import { formatCents, formatDate } from '@/lib/utils';

interface ClientRow {
  id: string;
  name: string;
  email: string;
  sessions_count: number;
  total_spent: number;
  created_at: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeAccess(clientId: string) {
    if (!confirm('Are you sure you want to revoke this client\'s access?')) return;
    try {
      setActionLoading(clientId);
      const res = await fetch(`/api/admin/clients`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, action: 'revoke' }),
      });
      if (!res.ok) throw new Error('Failed to revoke access');
      await fetchClients();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = clients.filter((client) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q)
    );
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
      <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>

      {/* Search */}
      <div className="flex items-center justify-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
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
              <th className="whitespace-nowrap px-4 py-3 font-medium">Sessions Booked</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Total Spent</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Joined</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id} className="border-b border-gray-100">
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  {client.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {client.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {client.sessions_count}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatCents(client.total_spent)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {formatDate(client.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/sessions?client_id=${client.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Sessions
                    </Link>
                    <button
                      onClick={() => handleRevokeAccess(client.id)}
                      disabled={actionLoading === client.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <ShieldOff className="h-3 w-3" />
                      {actionLoading === client.id ? 'Revoking...' : 'Revoke Access'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No clients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
