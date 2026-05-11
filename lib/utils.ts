import { Profile, ReturnSignal } from '@/types';

export function getCurrentWeek(profile: Profile): number {
  const start = new Date(profile.start_date);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.max(1, Math.min(weeks, getTotalWeeks(profile)));
}

export function getTotalWeeks(profile: Profile): number {
  const start = new Date(profile.start_date);
  const end = new Date(profile.end_date);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24 * 7)));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function signalStyle(signal: ReturnSignal): string {
  switch (signal) {
    case 'Strong':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'On Track':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Needs Attention':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'At Risk':
      return 'bg-red-50 text-red-700 border-red-200';
  }
}

export function signalDotColor(signal: ReturnSignal): string {
  switch (signal) {
    case 'Strong':
      return 'bg-emerald-500';
    case 'On Track':
      return 'bg-blue-500';
    case 'Needs Attention':
      return 'bg-amber-500';
    case 'At Risk':
      return 'bg-red-500';
  }
}

export function parseAIJson<T>(raw: string): T {
  // Strip markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
