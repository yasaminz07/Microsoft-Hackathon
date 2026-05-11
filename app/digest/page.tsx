'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import DigestCard from '@/components/DigestCard';
import ReturnSignalBadge from '@/components/ReturnSignalBadge';
import { useToast } from '@/components/Toast';
import { Profile, Digest, Log } from '@/types';
import { getCurrentWeek, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function DigestPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentDigest, setCurrentDigest] = useState<Digest | null>(null);
  const [pastDigests, setPastDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [expandedDigestId, setExpandedDigestId] = useState<string | null>(null);

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

      const { data: digestsData } = await supabase
        .from('digests')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('week_number', { ascending: false });

      const digests = digestsData ?? [];
      if (digests.length > 0) {
        setCurrentDigest(digests[0]);
        setPastDigests(digests.slice(1));
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  async function generateDigest() {
    if (!profile) return;
    setGenerating(true);
    setGenerateError(null);

    const profileId = profile.id;
    const currentWeek = getCurrentWeek(profile);

    try {
      const { data: logsData } = await supabase
        .from('logs')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });

      const logs: Log[] = logsData ?? [];

      if (logs.length === 0) {
        setGenerateError('You need at least one log entry before generating a digest.');
        setGenerating(false);
        return;
      }

      const res = await fetch('/api/generate-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_number: currentWeek, logs, role: profile.role, company: profile.company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Digest generation failed');

      const { digest } = data;

      const { data: savedDigest, error } = await supabase
        .from('digests')
        .insert({
          profile_id: profileId,
          week_number: currentWeek,
          pattern: digest.pattern,
          blind_spot: digest.blind_spot,
          action: digest.action,
          return_signal: digest.return_signal,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentDigest(savedDigest);
      addToast('Digest generated!', 'success');

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('profile_id', profileId);

      if (milestonesData && milestonesData.length > 0) {
        fetch('/api/update-milestones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs, milestones: milestonesData, current_week: currentWeek }),
        })
          .then((r) => r.json())
          .then(async ({ updates }) => {
            if (!Array.isArray(updates)) return;
            for (const update of updates) {
              await supabase
                .from('milestones')
                .update({ status: update.status })
                .eq('id', update.id)
                .eq('profile_id', profileId);
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error('Digest generation error:', err);
      const msg =
        err instanceof Error ? err.message :
        (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message) :
        'Something went wrong';
      setGenerateError(msg);
      addToast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="ml-0 md:ml-56 p-6 pb-24 md:pb-6">
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const currentWeek = getCurrentWeek(profile);

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
            <h1 className="text-lg font-semibold text-gray-900">Weekly Digest</h1>
            <p className="text-xs text-gray-400 mt-0.5">Week {currentWeek} AI analysis</p>
          </div>

          {!currentDigest && !generating && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 flex flex-col items-center text-center gap-4">
              <p className="text-sm font-medium text-gray-700">No digest for this week</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Generate your AI digest to get a pattern analysis, blind spot, and action for the week.
              </p>
              {generateError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 w-full text-left">{generateError}</p>
              )}
              <button
                onClick={generateDigest}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Generate this week&apos;s digest
              </button>
            </div>
          )}

          {generating && (
            <div className="space-y-3">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white border border-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {currentDigest && !generating && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ReturnSignalBadge signal={currentDigest.return_signal} size="lg" />
                <span className="text-xs text-gray-400">Week {currentDigest.week_number}</span>
              </div>

              <DigestCard variant="pattern"    label="Pattern"           content={currentDigest.pattern} />
              <DigestCard variant="blind_spot" label="Blind Spot"        content={currentDigest.blind_spot} />
              <DigestCard variant="action"     label="Action This Week"  content={currentDigest.action} />

              <button
                onClick={generateDigest}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Regenerate digest
              </button>
            </div>
          )}

          {pastDigests.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Past digests</h2>
              <div className="space-y-2">
                {pastDigests.map((digest) => (
                  <div key={digest.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setExpandedDigestId(expandedDigestId === digest.id ? null : digest.id)}
                      className="w-full text-left p-4 flex items-center gap-3"
                    >
                      <span className="text-xs text-gray-400">Week {digest.week_number}</span>
                      <ReturnSignalBadge signal={digest.return_signal} size="sm" />
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(digest.created_at)}</span>
                      <span className="text-gray-400 text-xs">{expandedDigestId === digest.id ? '▲' : '▼'}</span>
                    </button>
                    {expandedDigestId === digest.id && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                        <DigestCard variant="pattern"    label="Pattern"    content={digest.pattern} />
                        <DigestCard variant="blind_spot" label="Blind Spot" content={digest.blind_spot} />
                        <DigestCard variant="action"     label="Action"     content={digest.action} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
