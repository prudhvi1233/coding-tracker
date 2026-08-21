import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { safeFormatDate } from '../utils/dateUtils';
import { EmptyState } from './common/EmptyState';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { 
  Sparkles, BrainCircuit, ThumbsUp, ThumbsDown, X, Clock,
  RefreshCw, TrendingUp, Code2, Folder, GitPullRequest, Target, Flame
} from 'lucide-react';

export default function AIInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInsights();
  }, [filter]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [insRes, sumRes] = await Promise.all([
        apiClient.get('/insights', { params: filter !== 'all' ? { category: filter } : {} }),
        apiClient.get('/insights/summary')
      ]);
      setInsights(insRes.data);
      setSummary(sumRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiClient.post(`/insights/refresh`, {});
      await fetchInsights();
    } catch (e) {
      console.error('Rate limited or error', e);
    }
    setRefreshing(false);
  };

  const handleDismiss = async (id: string) => {
    setInsights(prev => prev.filter(i => i._id !== id));
    try {
      await apiClient.post(`/insights/${id}/dismiss`, {});
    } catch (e) {}
  };

  const handleFeedback = async (id: string, fb: 'helpful' | 'not_helpful') => {
    setInsights(prev => prev.map(i => i._id === id ? { ...i, feedback: fb } : i));
    try {
      await apiClient.post(`/insights/${id}/feedback`, { feedback: fb });
    } catch (e) {}
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'productivity': return <TrendingUp className="w-4 h-4 text-indigo-400" />;
      case 'language': return <Code2 className="w-4 h-4 text-sky-400" />;
      case 'project': return <Folder className="w-4 h-4 text-amber-400" />;
      case 'git': return <GitPullRequest className="w-4 h-4 text-emerald-400" />;
      case 'goals': return <Target className="w-4 h-4 text-purple-400" />;
      case 'streak': return <Flame className="w-4 h-4 text-rose-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-300" />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
            AI Developer Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">Automated pattern recognition & coding optimization insights</p>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20 self-start sm:self-auto font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analyzing...' : 'Generate New Insights'}
        </button>
      </div>

      {/* Top Highlight Insight Banner */}
      {!loading && summary?.topInsight && filter === 'all' && (
        <div className="glass-card bg-gradient-to-br from-indigo-500/15 via-slate-900/50 to-purple-500/10 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="w-48 h-48" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> TOP INSIGHT
              </span>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {safeFormatDate(summary.topInsight.generatedAt, 'MMM d, h:mm a')}
              </span>
            </div>
            <h3 className="text-lg font-mono font-bold text-white tracking-tight">{summary.topInsight.title}</h3>
            <p className="text-slate-200 text-sm leading-relaxed max-w-3xl">{summary.topInsight.message}</p>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 font-mono">
        {['all', 'productivity', 'streak', 'language', 'project', 'git', 'goals'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              filter === cat 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs' 
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : insights.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="Insufficient Telemetry for Insights"
          description="Keep coding with the VS Code extension enabled to collect enough data patterns for AI recommendations."
          action={{
            label: 'Trigger Analysis',
            onClick: handleRefresh
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {insights.map(insight => (
            <div key={insight._id} className="glass-card p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between relative group space-y-4">
              <button 
                onClick={() => handleDismiss(insight._id)}
                className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Dismiss Insight"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                    {getCategoryIcon(insight.category)}
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-slate-200">{insight.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{insight.category}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {insight.message}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Confidence:</span>
                  <div className="w-14 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleFeedback(insight._id, 'helpful')}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      insight.feedback === 'helpful' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400'
                    }`}
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleFeedback(insight._id, 'not_helpful')}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      insight.feedback === 'not_helpful' 
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400'
                    }`}
                    title="Not Helpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
