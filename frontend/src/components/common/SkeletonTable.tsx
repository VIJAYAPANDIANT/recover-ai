import React from 'react';

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 animate-pulse">
      {/* Table Header skeleton */}
      <div className="flex space-x-4 border-b border-slate-800 pb-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-slate-800 rounded flex-1"
          />
        ))}
      </div>

      {/* Table Rows skeleton */}
      <div className="space-y-4 pt-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex space-x-4 items-center">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 bg-slate-800/60 rounded flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
