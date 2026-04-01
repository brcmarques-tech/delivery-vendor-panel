import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary-muted)] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[var(--brand-primary)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
