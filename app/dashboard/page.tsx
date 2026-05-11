'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import WeekProgress from '@/components/WeekProgress';
import ReturnSignalBadge from '@/components/ReturnSignalBadge';
import LogCard from '@/components/LogCard';
import MilestoneCard from '@/components/MilestoneCard';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { Profile, Log, Digest, Milestone } from '@/types';
import { getCurrentWeek, getTotalWeeks } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const QUICK_TAGS = ['Win', 'Blocker', 'Feedback received', 'People met', 'Skill used', 'Visibility moment', 'Uncertainty'];

export default function DashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [latestDigest, setLatestDigest] = useState<Digest | null>(null);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);

  const [logContent, setLogContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savingLog, setSavingLog] = useState(false);

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

      const [logsResult, digestResult, milestonesResult] = await Promise.all([
        supabase
          .from('logs')
          .select('*')
          .eq('profile_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('digests')
          .select('*')
          .eq('profile_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('milestones')
          .select('*')
          .eq('profile_id', profileData.id)
          .neq('status', 'done')
          .order('week_number', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      setRecentLogs(logsResult.data ?? []);
      setLatestDigest(digestResult.data ?? null);
      setNextMilestone(milestonesResult.data ?? null);
      setLoading(false);
    }
    loadData();
  }, [router]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function saveLog(e: FormEvent) {
    e.preventDefault();
    if (!logContent.trim() || !profile) return;
    setSavingLog(true);

    const week = getCurrentWeek(profile);
    const { data, error } = await supabase
      .from('logs')
      .insert({ profile_id: profile.id, content: logContent.trim(), tags: selectedTags, week_number: week })
      .select()
      .single();

    if (error) {
      addToast('Failed to save log', 'error');
    } else {
      addToast('Log saved', 'success');
      setLogContent('');
      setSelectedTags([]);
      setRecentLogs((prev) => [data, ...prev].slice(0, 3));
    }
    setSavingLog(false);
  }

  async function markMilestoneDone(id: string) {
    const { error } = await supabase.from('milestones').update({ status: 'done' }).eq('id', id);
    if (error) {
      addToast('Failed to update milestone', 'error');
    } else {
      addToast('Milestone marked as done!', 'success');
      setNextMilestone(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="ml-0 md:ml-56 p-6 pb-24 md:pb-6">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-white border border-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const currentWeek = getCurrentWeek(profile);
  const totalWeeks = getTotalWeeks(profile);

  const tagCls = (active: boolean) =>
    active
      ? 'px-2 py-0.5 text-xs rounded border bg-blue-50 text-blue-700 border-blue-200 transition-colors'
      : 'px-2 py-0.5 text-xs rounded border bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-300 transition-colors';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="ml-0 md:ml-56 p-6 pb-24 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Hey, {profile.name} —{' '}
                <span className="text-gray-500 font-normal">Week {currentWeek} of {totalWeeks}</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">{profile.role} at {profile.company}</p>
            </div>
            {latestDigest && (
              <ReturnSignalBadge signal={latestDigest.return_signal} size="lg" />
            )}
          </div>

          {/* Week progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <p className="text-xs text-gray-400 mb-3">Internship progress</p>
            <WeekProgress currentWeek={currentWeek} totalWeeks={totalWeeks} />
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left col */}
            <div className="space-y-4">
              {/* Quick log */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick log</h2>
                <form onSubmit={saveLog} className="space-y-3">
                  <textarea
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    placeholder="What happened today? What did you learn, deliver, or notice?"
                    rows={4}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)} className={tagCls(selectedTags.includes(tag))}>
                        {tag}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={savingLog || !logContent.trim()}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingLog ? 'Saving…' : 'Save log'}
                  </button>
                </form>
              </div>

              {/* Recent activity */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent activity</h2>
                {recentLogs.length === 0 ? (
                  <EmptyState title="No logs yet" description="Start logging your days to build a picture of your internship." />
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log) => <LogCard key={log.id} log={log} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-4">
              {/* Next milestone */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Next milestone</h2>
                {nextMilestone ? (
                  <MilestoneCard
                    milestone={nextMilestone}
                    isCurrentWeek={nextMilestone.week_number === currentWeek}
                    onMarkDone={markMilestoneDone}
                  />
                ) : (
                  <EmptyState title="All milestones complete" description="You've hit every milestone. Excellent work." />
                )}
              </div>

              {/* Digest preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Weekly digest</h2>
                {latestDigest ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <ReturnSignalBadge signal={latestDigest.return_signal} size="sm" />
                      <span className="text-xs text-gray-400">Week {latestDigest.week_number}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{latestDigest.pattern}</p>
                    <a href="/digest" className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium">
                      View full digest →
                    </a>
                  </div>
                ) : (
                  <EmptyState
                    title="No digest yet"
                    description="Generate your first weekly digest to get AI-powered insights."
                    ctaLabel="Generate digest"
                    ctaHref="/digest"
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
