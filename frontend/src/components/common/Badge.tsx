import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan' | 'purple' | 'language';
  language?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const getLanguageColor = (lang?: string) => {
  if (!lang) return 'bg-zinc-900/90 text-zinc-300 border-zinc-700/80';
  const lower = lang.toLowerCase();
  if (lower.includes('cpp') || lower.includes('c++') || lower.includes('c')) return 'bg-blue-950/80 text-blue-400 border-blue-800/60';
  if (lower.includes('typescript') || lower.includes('ts')) return 'bg-sky-950/80 text-sky-400 border-sky-800/60';
  if (lower.includes('javascript') || lower.includes('js')) return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
  if (lower.includes('python') || lower.includes('py')) return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
  if (lower.includes('html') || lower.includes('css')) return 'bg-orange-950/80 text-orange-400 border-orange-800/60';
  if (lower.includes('rust')) return 'bg-red-950/80 text-red-400 border-red-800/60';
  if (lower.includes('go') || lower.includes('golang')) return 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60';
  if (lower.includes('json') || lower.includes('yaml') || lower.includes('md')) return 'bg-purple-950/80 text-purple-400 border-purple-800/60';
  return 'bg-zinc-900/90 text-zinc-300 border-zinc-700/80';
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  language,
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';
  
  if (variant === 'language' || language) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md font-mono border ${sizeClasses} ${getLanguageColor(language || String(children))} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
        {children}
      </span>
    );
  }

  const variantMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    slate: 'bg-zinc-900/90 text-zinc-300 border-zinc-700/60',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-medium border ${sizeClasses} ${variantMap[variant]} ${className}`}>
      {children}
    </span>
  );
};
