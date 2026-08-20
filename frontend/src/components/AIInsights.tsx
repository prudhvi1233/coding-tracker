import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { safeFormatDate } from '../utils/dateUtils';
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
      await apiClient.post(`/insights/${id}/feedback`, { feedback: fb,  });
    } catch (e) {}
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'productivity': return <TrendingUp className="w-5 h-5 text-indigo-400" />;
      case 'language': return <Code2 className="w-5 h-5 text-blue-400" />;
      case 'project': return <Folder className="w-5 h-5 text-orange-400" />;
      case 'git': return <GitPullRequest className="w-5 h-5 text-emerald-400" />;
      case 'goals': return <Target className="w-5 h-5 text-purple-400" />;
      case 'streak': return <Flame className="w-5 h-5 text-rose-400" />;
      default: return <Sparkles className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950/30 p-6 rounded-2xl border border-indigo-500/20">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="w-7 h-7 text-indigo-400" />
            AI Developer Insights
          </h2>
          <p className="text-slate-400 mt-1">Personalized intelligence based on your coding activity.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analyzing Data...' : 'Refresh Insights'}
        </button>
      </div>

      {/* Top Insight */}
      {!loading && summary?.topInsight && filter === 'all' && (
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                🔥 TOP INSIGHT
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {safeFormatDate(summary.topInsight.generatedAt, 'MMM d, h:mm a')}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{summary.topInsight.title}</h3>
            <p className="text-indigo-100 text-lg leading-relaxed">{summary.topInsight.message}</p>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {['all', 'productivity', 'streak', 'language', 'project', 'git', 'goals'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === cat ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      ) : insights.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-slate-500 border border-slate-700/50 border-dashed text-center">
          <BrainCircuit className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-slate-300 mb-2">No Active Insights</h3>
          <p className="max-w-md">We need a little more activity before identifying reliable patterns. Keep coding and check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {insights.map(insight => (
            <div key={insight._id} className="glass-panel p-5 rounded-2xl flex flex-col relative group">
              <button 
                onClick={() => handleDismiss(insight._id)}
                className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-lg">
                  {getCategoryIcon(insight.category)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{insight.title}</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{insight.category}</p>
                </div>
              </div>
              
              <p className="text-slate-300 text-sm flex-1 leading-relaxed mb-6">
                {insight.message}
              </p>
              
              <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Confidence:</span>
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${insight.confidence}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleFeedback(insight._id, 'helpful')}
                    className={`p-1.5 rounded transition-colors ${insight.feedback === 'helpful' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-800 hover:text-emerald-400'}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleFeedback(insight._id, 'not_helpful')}
                    className={`p-1.5 rounded transition-colors ${insight.feedback === 'not_helpful' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:bg-slate-800 hover:text-rose-400'}`}
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
