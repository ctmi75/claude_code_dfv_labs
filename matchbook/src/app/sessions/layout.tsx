'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase/client';
import type { UserRole } from '@/types';

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('client');

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('name, avatar_url, role')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserName(data.name ?? user.email ?? '');
        setUserAvatar(data.avatar_url);
        setRole(data.role ?? 'client');
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        role={role as 'client' | 'expert' | 'admin'}
        userName={userName}
        userAvatar={userAvatar}
        onSignOut={handleSignOut}
      />
      {children}
    </div>
  );
}
