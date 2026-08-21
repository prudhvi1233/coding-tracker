import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: {
    value: string | number;
    isPositive?: boolean;
  };
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'purple';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  accentColor = 'indigo',
  className = ''
}) => {
  const accentMap = {
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      icon: 'text-indigo-400',
      glow: 'group-hover:border-indigo-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      glow: 'group-hover:border-emerald-500/40',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      glow: 'group-hover:border-amber-500/40',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      icon: 'text-cyan-400',
      glow: 'group-hover:border-cyan-500/40',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      icon: 'text-purple-400',
      glow: 'group-hover:border-purple-500/40',
    },
  };

  const currentAccent = accentMap[accentColor];

  return (
    <div className={`group glass-card p-5 rounded-2xl border border-slate-800/80 transition-all duration-200 ${currentAccent.glow} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl border ${currentAccent.bg} ${currentAccent.border} ${currentAccent.icon} transition-transform duration-300 group-hover:scale-105`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">{value}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${trend.isPositive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtext && (
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
          {subtext}
        </p>
      )}
    </div>
  );
};
