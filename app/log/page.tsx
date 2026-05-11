'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import LogCard from '@/components/LogCard';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { Profile, Log } from '@/types';
import { getCurrentWeek } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ALL_TAGS = [
  'Win', 'Blocker', 'Feedback received', 'People met',
  'Skill used', 'Visibility moment', 'Uncertainty', 'Initiative',
];

export default function LogPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [weekLogs, setWeekLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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

      const week = getCurrentWeek(profileData);
      const { data: logsData } = await supabase
        .from('logs')
        .select('*')
        .eq('profile_id', profileData.id)
        .eq('week_number', week)
        .order('created_at', { ascending: false });

      setWeekLogs(logsData ?? []);
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
    if (!content.trim() || !profile) return;
    setSaving(true);

    const week = getCurrentWeek(profile);
    const { data, error } = await supabase
      .from('logs')
      .insert({ profile_id: profile.id, content: content.trim(), tags: selectedTags, week_number: week })
      .select()
      .single();

    if (error) {
      addToast('Failed to save log', 'error');
    } else {
      addToast('Log saved', 'success');
      setContent('');
      setSelectedTags([]);
      setWeekLogs((prev) => [data, ...prev]);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="ml-0 md:ml-56 p-6 pb-24 md:pb-6">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-52 bg-white border border-gray-200 rounded-lg animate-pulse" />
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const currentWeek = getCurrentWeek(profile);

  const tagCls = (active: boolean) =>
    active
      ? 'px-2 py-0.5 text-xs rounded border bg-blue-50 text-blue-700 border-blue-200 transition-colors'
      : 'px-2 py-0.5 text-xs rounded border bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-300 transition-colors';

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
            <h1 className="text-lg font-semibold text-gray-900">Log today</h1>
            <p className="text-xs text-gray-400 mt-0.5">Week {currentWeek}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
            <form onSubmit={saveLog} className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What happened today? Meetings, tasks, wins, blockers, things you noticed…"
                rows={6}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
              />

              <div>
                <p className="text-xs text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TAGS.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)} className={tagCls(selectedTags.includes(tag))}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !content.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : 'Save log'}
              </button>
            </form>
          </div>

          <h2 className="text-sm font-semibold text-gray-900 mb-3">This week&apos;s logs</h2>
          {weekLogs.length === 0 ? (
            <EmptyState title="Nothing logged yet this week" description="Add your first log above to start tracking your week." />
          ) : (
            <div className="space-y-3">
              {weekLogs.map((log) => <LogCard key={log.id} log={log} />)}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
