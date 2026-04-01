'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { Copy, Plus, Loader2, Check, ExternalLink } from 'lucide-react';

interface Settings {
  platform_fee_percent: number;
  refund_window_hours: number;
  invite_expiry_hours: number;
}

interface Invite {
  id: string;
  token: string;
  role: string;
  email: string | null;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    platform_fee_percent: 15,
    refund_window_hours: 24,
    invite_expiry_hours: 72,
  });
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteRole, setInviteRole] = useState<'expert' | 'client'>('expert');
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [settingsRes, invitesRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/invites'),
      ]);
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setSettings(s);
      }
      if (invitesRes.ok) {
        const i = await invitesRes.json();
        setInvites(i);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateInvite(e: React.FormEvent) {
    e.preventDefault();
    setGeneratingInvite(true);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: inviteRole,
          email: inviteEmail || undefined,
        }),
      });
      if (res.ok) {
        setInviteEmail('');
        fetchData();
      }
    } finally {
      setGeneratingInvite(false);
    }
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function getInviteStatus(invite: Invite) {
    if (invite.used) return { label: 'Used', class: 'badge-gray' };
    if (new Date(invite.expires_at) < new Date())
      return { label: 'Expired', class: 'badge-red' };
    return { label: 'Active', class: 'badge-green' };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="card max-w-xl space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>

        <div>
          <label className="label">Platform Fee (%)</label>
          <input
            type="number"
            className="input"
            value={settings.platform_fee_percent}
            onChange={(e) =>
              setSettings({
                ...settings,
                platform_fee_percent: parseFloat(e.target.value),
              })
            }
            min="0"
            max="100"
            step="0.5"
          />
          <p className="text-xs text-gray-500 mt-1">
            Percentage taken from each session payment
          </p>
        </div>

        <div>
          <label className="label">Refund Window (hours)</label>
          <input
            type="number"
            className="input"
            value={settings.refund_window_hours}
            onChange={(e) =>
              setSettings({
                ...settings,
                refund_window_hours: parseInt(e.target.value),
              })
            }
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Full refund if cancelled this many hours before the session
          </p>
        </div>

        <div>
          <label className="label">Invite Expiry (hours)</label>
          <input
            type="number"
            className="input"
            value={settings.invite_expiry_hours}
            onChange={(e) =>
              setSettings({
                ...settings,
                invite_expiry_hours: parseInt(e.target.value),
              })
            }
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Invite links expire after this many hours
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Invite Management */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Invite Management
        </h2>

        <form
          onSubmit={handleGenerateInvite}
          className="flex flex-wrap gap-3 items-end mb-6 pb-6 border-b border-gray-200"
        >
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as 'expert' | 'client')
              }
            >
              <option value="expert">Expert</option>
              <option value="client">Client</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="label">Email (optional)</label>
            <input
              type="email"
              className="input"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={generatingInvite}
            className="btn-primary flex items-center gap-2"
          >
            {generatingInvite ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Generate Invite
          </button>
        </form>

        {/* Invites Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-500">
                  Token
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">
                  Role
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">
                  Email
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">
                  Created
                </th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const status = getInviteStatus(invite);
                return (
                  <tr
                    key={invite.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2 font-mono text-xs text-gray-600">
                      {invite.token.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={
                          invite.role === 'expert'
                            ? 'badge-blue'
                            : 'badge-gray'
                        }
                      >
                        {invite.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {invite.email || '—'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={status.class}>{status.label}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      {formatDate(invite.created_at)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {!invite.used &&
                        new Date(invite.expires_at) > new Date() && (
                          <button
                            onClick={() => copyInviteLink(invite.token)}
                            className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 text-xs font-medium"
                          >
                            {copiedToken === invite.token ? (
                              <>
                                <Check className="w-3 h-3" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy Link
                              </>
                            )}
                          </button>
                        )}
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-gray-400"
                  >
                    No invites yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
