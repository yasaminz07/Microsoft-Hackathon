'use client';

interface WeekProgressProps {
  currentWeek: number;
  totalWeeks: number;
}

export default function WeekProgress({ currentWeek, totalWeeks }: WeekProgressProps) {
  const dots = Math.min(totalWeeks, 12);

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: dots }, (_, i) => {
        const week = i + 1;
        const isPast    = week < currentWeek;
        const isCurrent = week === currentWeek;

        return (
          <div
            key={week}
            title={`Week ${week}`}
            className={`w-3 h-3 rounded-full transition-colors ${
              isCurrent ? 'bg-blue-600' : isPast ? 'bg-blue-200' : 'bg-gray-200'
            }`}
          />
        );
      })}
    </div>
  );
}
