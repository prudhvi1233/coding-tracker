import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'metrics' | 'chart';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 3,
  className = ''
}) => {
  if (type === 'metrics') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl glass-card border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 rounded skeleton-shimmer" />
              <div className="h-8 w-8 rounded-xl skeleton-shimmer" />
            </div>
            <div className="h-7 w-16 rounded-md skeleton-shimmer" />
            <div className="h-2 w-32 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`glass-card rounded-2xl p-4 space-y-3 border border-slate-800/80 ${className}`}>
        <div className="h-4 w-32 rounded skeleton-shimmer mb-4" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-0">
            <div className="h-4 w-28 rounded skeleton-shimmer" />
            <div className="h-4 w-36 rounded skeleton-shimmer" />
            <div className="h-4 w-20 rounded skeleton-shimmer" />
            <div className="h-4 w-16 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4 ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 w-40 rounded skeleton-shimmer" />
          <div className="h-4 w-24 rounded skeleton-shimmer" />
        </div>
        <div className="h-60 w-full rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(count, 3)} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-2xl glass-card border border-slate-800/80 space-y-4">
          <div className="h-4 w-1/3 rounded skeleton-shimmer" />
          <div className="h-8 w-2/3 rounded-lg skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
};
