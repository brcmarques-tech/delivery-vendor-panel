'use client';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant: Variant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
  error: 'bg-[var(--status-error-bg)] text-[var(--status-error-text)]',
  info: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
  neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]',
};

export default function StatusBadge({ variant, children, dot, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${variantStyles[variant]} ${className}`}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}
