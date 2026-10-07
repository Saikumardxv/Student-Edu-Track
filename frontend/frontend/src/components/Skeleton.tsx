import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="glass-panel animate-pulse p-6 rounded-2xl">
    <div className="h-4 w-1/3 rounded bg-slate-800/80 mb-4"></div>
    <div className="h-8 w-2/3 rounded bg-slate-800/80 mb-2"></div>
    <div className="h-3 w-1/2 rounded bg-slate-800/80"></div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="glass-panel animate-pulse rounded-2xl p-6">
    <div className="flex justify-between items-center mb-6">
      <div className="h-8 w-1/4 rounded bg-slate-800/80"></div>
      <div className="h-8 w-1/6 rounded bg-slate-800/80"></div>
    </div>
    <div className="space-y-4">
      <div className="h-8 w-full rounded bg-slate-800/65"></div>
      <div className="h-12 w-full rounded bg-slate-850/60"></div>
      <div className="h-12 w-full rounded bg-slate-850/60"></div>
      <div className="h-12 w-full rounded bg-slate-850/60"></div>
      <div className="h-12 w-full rounded bg-slate-850/60"></div>
    </div>
  </div>
);

export const TimetableSkeleton: React.FC = () => (
  <div className="glass-panel animate-pulse rounded-2xl p-6">
    <div className="h-8 w-1/3 rounded bg-slate-800/80 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-full rounded bg-slate-800/80"></div>
          <div className="h-20 w-full rounded bg-slate-850/60"></div>
          <div className="h-20 w-full rounded bg-slate-850/60"></div>
        </div>
      ))}
    </div>
  </div>
);
