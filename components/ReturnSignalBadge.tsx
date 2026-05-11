'use client';

import { ReturnSignal } from '@/types';
import { signalStyle, signalDotColor } from '@/lib/utils';

interface ReturnSignalBadgeProps {
  signal: ReturnSignal;
  size?: 'sm' | 'lg';
}

export default function ReturnSignalBadge({ signal, size = 'sm' }: ReturnSignalBadgeProps) {
  const style = signalStyle(signal);
  const dot = signalDotColor(signal);

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
        {signal}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-semibold ${style}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {signal}
    </div>
  );
}
