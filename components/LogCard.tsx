'use client';

import { Log } from '@/types';
import { formatDate } from '@/lib/utils';

interface LogCardProps {
  log: Log;
}

export default function LogCard({ log }: LogCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
      <p className="text-xs text-gray-400">{formatDate(log.created_at)}</p>
      <p className="text-sm text-gray-800 line-clamp-3">{log.content}</p>
      {log.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {log.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500 border border-gray-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
