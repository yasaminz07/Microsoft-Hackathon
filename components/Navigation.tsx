'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, Digest } from '@/types';
import { getCurrentWeek, getTotalWeeks } from '@/lib/utils';
import ReturnSignalBadge from './ReturnSignalBadge';

const navLinks = [
  { href: '/dashboard',   label: 'Dashboard' },
  { href: '/log',         label: 'Log Today' },
  { href: '/digest',      label: 'Weekly Digest' },
  { href: '/milestones',  label: 'Milestones' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestDigest, setLatestDigest] = useState<Digest | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!profileData) return;
      setProfile(profileData);

      supabase
        .from('digests')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => { if (data) setLatestDigest(data); });
    }
    init();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  const currentWeek = profile ? getCurrentWeek(profile) : null;
  const totalWeeks  = profile ? getTotalWeeks(profile) : null;

  const NavContent = () => (
    <>
      <div className="flex flex-col gap-0.5 flex-1">
        <div className="mb-5">
          <span className="text-gray-900 font-semibold text-sm">Intern Buddy</span>
          {currentWeek && totalWeeks && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              W{currentWeek}/{totalWeeks}
            </span>
          )}
        </div>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="pt-4 border-t border-gray-200 space-y-3">
        {latestDigest && <ReturnSignalBadge signal={latestDigest.return_signal} size="sm" />}
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors block"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex-col p-4 z-40">
        <NavContent />
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 py-3 text-center text-xs transition-colors ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {link.label === 'Log Today' ? 'Log' : link.label === 'Weekly Digest' ? 'Digest' : link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
