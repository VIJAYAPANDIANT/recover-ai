import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading data...',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div
        className={`${sizeClasses[size]} border-slate-700 border-t-teal-400 rounded-full animate-spin`}
      />
      {label && <p className="text-sm font-medium text-slate-400">{label}</p>}
    </div>
  );
};
