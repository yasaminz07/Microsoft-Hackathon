'use client';

import { useState } from 'react';
import { Milestone } from '@/types';

interface MilestoneCardProps {
  milestone: Milestone;
  isCurrentWeek: boolean;
  onMarkDone: (id: string) => Promise<void>;
}

const statusBadge: Record<string, string> = {
  done:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  'at-risk':'bg-amber-50 text-amber-700 border-amber-200',
  pending:  'bg-gray-100 text-gray-500 border-gray-200',
};

const statusLabel: Record<string, string> = {
  done:     'Done',
  'at-risk':'At Risk',
  pending:  'Pending',
};

export default function MilestoneCard({ milestone, isCurrentWeek, onMarkDone }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDone() {
    setLoading(true);
    await onMarkDone(milestone.id);
    setLoading(false);
  }

  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden ${
        isCurrentWeek ? 'border-l-4 border-l-blue-600 border-gray-200' : 'border-gray-200'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-center gap-3"
      >
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
          W{milestone.week_number}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-900">{milestone.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded border ${statusBadge[milestone.status]}`}>
          {statusLabel[milestone.status]}
        </span>
        <span className="text-gray-400 text-xs ml-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <p className="text-sm text-gray-500">{milestone.description}</p>
          {milestone.status !== 'done' && (
            <button
              onClick={handleDone}
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving…' : 'Mark as Done'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
