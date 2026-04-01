import { HelpCircle } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  onTourStart?: () => void;
  tourNotSeen?: boolean;
}

export default function PageHeader({ title, description, actions, badge, onTourStart, tourNotSeen }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {badge}
          {onTourStart && (
            <button
              onClick={onTourStart}
              title="Ver tutorial"
              className="relative flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--brand-primary-muted)] hover:text-[var(--brand-primary)] transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              {tourNotSeen && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
              )}
            </button>
          )}
        </div>
        {description && (
          <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
