'use client';

interface DigestCardProps {
  variant: 'pattern' | 'blind_spot' | 'action';
  label: string;
  content: string;
}

const variantStyles = {
  pattern: {
    dot:   'bg-blue-500',
    label: 'text-blue-600',
    border:'border-t-blue-500',
  },
  blind_spot: {
    dot:   'bg-amber-500',
    label: 'text-amber-600',
    border:'border-t-amber-500',
  },
  action: {
    dot:   'bg-emerald-500',
    label: 'text-emerald-600',
    border:'border-t-emerald-500',
  },
};

export default function DigestCard({ variant, label, content }: DigestCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-2 border-t-2 ${styles.border} shadow-sm`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}>{label}</span>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed">{content}</p>
    </div>
  );
}
