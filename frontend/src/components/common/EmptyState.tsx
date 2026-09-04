import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'There are no records matching your criteria or database is empty.',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
      <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4 ring-8 ring-slate-900/50">
        {icon || <Inbox className="w-7 h-7 text-slate-400" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
