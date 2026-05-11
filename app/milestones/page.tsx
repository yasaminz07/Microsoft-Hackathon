'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import MilestoneCard from '@/components/MilestoneCard';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { Profile, Milestone } from '@/types';
import { getCurrentWeek } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function MilestonesPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/auth'); return; }

      const { data: profileData } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!profileData) { router.replace('/'); return; }
      setProfile(profileData);

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('week_number', { ascending: true });

      setMilestones(milestonesData ?? []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  async function markDone(id: string) {
    const { error } = await supabase.from('milestones').update({ status: 'done' }).eq('id', id);
    if (error) {
      addToast('Failed to update milestone', 'error');
    } else {
      addToast('Milestone marked as done!', 'success');
      setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'done' as const } : m)));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="ml-0 md:ml-56 p-6 pb-24 md:pb-6">
          <div className="h-7 w-36 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-14 bg-white border border-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const currentWeek = getCurrentWeek(profile);
  const doneCount = milestones.filter((m) => m.status === 'done').length;
  const total = milestones.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="ml-0 md:ml-56 p-6 pb-24 md:pb-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900">Milestones</h1>
            <p className="text-xs text-gray-400 mt-0.5">12-week return offer roadmap</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{doneCount} of {total} completed</span>
              <span className="text-xs font-semibold text-gray-900">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {milestones.length === 0 ? (
            <EmptyState
              title="No milestones"
              description="Milestones are created automatically when you set up your internship."
            />
          ) : (
            <div className="space-y-2">
              {milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  isCurrentWeek={milestone.week_number === currentWeek}
                  onMarkDone={markDone}
                />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
