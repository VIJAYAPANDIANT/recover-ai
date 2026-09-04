import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
}) => {
  return (
    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 my-4">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-900/50 hover:bg-rose-800/60 text-xs font-semibold text-rose-100 border border-rose-700/50 transition cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
