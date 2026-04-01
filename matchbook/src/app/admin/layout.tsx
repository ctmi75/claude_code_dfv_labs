'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Experts', href: '/admin/experts', icon: UserCheck },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Sessions', href: '/admin/sessions', icon: Calendar },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/');
          return;
        }

        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!dbUser || dbUser.role !== 'admin') {
          router.push('/');
          return;
        }

        setUser(dbUser as User);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        role="admin"
        userName={user.name}
        userAvatar={user.avatar_url}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            'sticky top-0 flex h-[calc(100vh-64px)] flex-col border-r border-gray-200 bg-white transition-all duration-200',
            collapsed ? 'w-16' : 'w-56'
          )}
        >
          <nav className="flex flex-1 flex-col gap-1 p-2 pt-4">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-700 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center border-t border-gray-200 p-3 text-gray-500 hover:text-gray-700"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
