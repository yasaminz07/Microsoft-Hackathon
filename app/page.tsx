'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { RoadmapWeek } from '@/types';

const MILESTONE_SEEDS = [
  { week_number: 1,  title: 'Meet your immediate team',        description: "Introduce yourself to everyone you'll work directly with. Learn their names, roles, and current projects." },
  { week_number: 2,  title: 'Meet someone outside your team',  description: 'Have a coffee or quick call with someone from a different team. Ask what they work on and how it connects to your role.' },
  { week_number: 3,  title: 'Complete your first independent task', description: 'Deliver something without being asked twice. Even something small establishes you as someone who follows through.' },
  { week_number: 4,  title: "Share something you've learned",  description: 'In a meeting or over Slack, share an insight or finding relevant to your team. This builds visibility early.' },
  { week_number: 5,  title: 'Ask for informal feedback',       description: 'Ask your manager: "Is there anything I could be doing differently?" This shows maturity and gives course-correction time.' },
  { week_number: 6,  title: 'Contribute beyond your brief',    description: 'Volunteer for a task, offer an idea in a meeting, or help a colleague. Go slightly beyond what was expected.' },
  { week_number: 7,  title: 'Build a relationship with a senior person', description: 'Have a meaningful conversation with someone at least two levels above you. Ask about their career or the company direction.' },
  { week_number: 8,  title: 'Present your work formally',      description: 'Present a summary, update, or finding to at least one senior stakeholder. Visibility at this stage matters.' },
  { week_number: 9,  title: 'Identify something to improve',   description: 'Find a process or approach that could be better and suggest an improvement. Shows initiative and business awareness.' },
  { week_number: 10, title: 'Signal your interest in returning', description: "Tell your manager you'd love to come back. Don't assume they know — say it explicitly." },
  { week_number: 11, title: 'Document your contributions',     description: "Write a short summary of what you've worked on and delivered. This helps your manager advocate for you." },
  { week_number: 12, title: 'Thank the people who helped you', description: 'Send personal thank you messages to your manager, mentor, and anyone who supported you.' },
];

const DEMO_LOGS = [
  { week_number: 1, content: "First day. Got my laptop set up and had an intro call with the SOC team lead. Lots of acronyms I didn't know — wrote them all down. Sat in on an incident review meeting at 3pm.", tags: ['People met'] },
  { week_number: 1, content: "Spent the morning going through internal Splunk documentation. Used it in CTFs but this is way more complex. Had my first 1:1 with my manager — she seems direct and said her door is always open.", tags: ['Skill used'] },
  { week_number: 2, content: 'Helped triage a low-priority alert. False positive, but walked through the full process. Senior analyst said my reasoning was solid.', tags: ['Win', 'Skill used'] },
  { week_number: 2, content: 'Coffee with someone from IT infrastructure. Really interesting conversation about OT/IT network separation — clearly central here.', tags: ['People met'] },
  { week_number: 3, content: 'Completed first solo task: threat intel summary on a phishing campaign targeting energy sector orgs. Manager shared it with the wider team on Slack.', tags: ['Win', 'Visibility moment'] },
  { week_number: 3, content: 'Slow day. Admin. Still waiting on system access from IT. Slightly frustrated but nothing I can do.', tags: ['Blocker'] },
  { week_number: 4, content: "Joined a cross-team meeting about a new monitoring project. Asked a question about log retention nobody had thought about — project lead noted it.", tags: ['Visibility moment', 'Skill used'] },
  { week_number: 4, content: 'Feeling more comfortable with the daily rhythm. Know most of the team by name. Still feel like I could contribute more technically.', tags: ['Uncertainty'] },
  { week_number: 5, content: "Asked my manager for informal feedback. She said I'm reliable, ask good questions, document well. Suggested I speak up more in meetings.", tags: ['Feedback received'] },
  { week_number: 5, content: 'Worked on a vulnerability report for an internal asset. First time doing this properly. Took longer than expected but output was solid.', tags: ['Skill used'] },
  { week_number: 6, content: "Vulnerability report came back with minor comments. Manager is including it in the monthly security review pack — most visible thing I've produced.", tags: ['Win', 'Visibility moment'] },
  { week_number: 6, content: "Conversation with a principal engineer here 12 years. He said interns who get return offers ask better questions, not just more questions.", tags: ['People met', 'Feedback received'] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/auth'); return; }

      const { data: existing } = await supabase
        .from('profile')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existing) { router.replace('/dashboard'); return; }
      setReady(true);
    }
    init();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/auth'); return; }

      const roadmapRes = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, company, start_date: startDate, end_date: endDate }),
      });
      const roadmapData = await roadmapRes.json();
      if (!roadmapRes.ok) throw new Error(roadmapData.error ?? 'Roadmap generation failed');
      const roadmap: RoadmapWeek[] = roadmapData.roadmap;

      const { data: profile, error: profileError } = await supabase
        .from('profile')
        .insert({ name, company, role, start_date: startDate, end_date: endDate, roadmap, user_id: session.user.id })
        .select()
        .single();
      if (profileError) throw profileError;

      const profileId = profile.id as string;

      await supabase.from('milestones').insert(
        MILESTONE_SEEDS.map((m) => ({ ...m, profile_id: profileId, status: 'pending' }))
      );

      if (name.toLowerCase() === 'demo') {
        await supabase.from('logs').insert(
          DEMO_LOGS.map((l) => ({ ...l, profile_id: profileId }))
        );
      }

      addToast('Welcome to Intern Buddy!', 'success');
      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      const msg =
        err instanceof Error ? err.message :
        (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message) :
        'Something went wrong';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Set up your internship</h1>
          <p className="text-sm text-gray-500 mt-1">We&apos;ll build you a personalised 12-week roadmap.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Your name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Enter "demo" to load sample data'
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Company</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Accenture, KPMG, Goldman Sachs"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Role</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineering Intern"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Start date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">End date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
            >
              {loading ? 'Setting up your internship…' : 'Get started'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
