import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../api/apiClient';
import { safeFormatDate } from '../utils/dateUtils';
import { Badge } from './common/Badge';
import { EmptyState } from './common/EmptyState';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { 
  GitBranch, GitCommit, FileCode, Clock, BookOpen, AlertCircle, Folder, Plus, Minus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ActivityCalendar } from 'react-activity-calendar';

export default function GitInsights() {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchOverview();
    fetchRepositories();
  }, []);

  const fetchOverview = async () => {
    try {
      const [overRes, actRes] = await Promise.all([
        apiClient.get(`/git/analytics/overview`),
        apiClient.get(`/git/analytics/activity`)
      ]);
      setOverview(overRes.data);
      setActivity(actRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/git/repositories`);
      setRepositories(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const selectRepository = async (repo: any) => {
    setSelectedRepo(repo);
    setPage(1);
    fetchCommits(repo._id, 1);
  };

  const fetchCommits = async (repoId: string, pageNum: number) => {
    try {
      const res = await apiClient.get(`/git/repositories/${repoId}/commits?page=${pageNum}&limit=20`);
      if (pageNum === 1) {
        setCommits(res.data);
      } else {
        setCommits(prev => [...prev, ...res.data]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadMoreCommits = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    if (selectedRepo) fetchCommits(selectedRepo._id, nextPage);
  };

  const heatmapData = useMemo(() => {
    return activity.map(a => ({
      date: a.date,
      count: a.commits,
      level: Math.min(4, Math.ceil(a.commits / 3)) 
    }));
  }, [activity]);

  if (loading && repositories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <LoadingSkeleton type="metrics" />
        <LoadingSkeleton type="table" count={4} />
      </div>
    );
  }

  if (!loading && repositories.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="border-b border-slate-800/80 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Git Insights</h1>
          <p className="text-xs text-slate-400 mt-1">Repository metrics, commit history telemetry, and branch status</p>
        </div>
        <EmptyState
          icon={GitBranch}
          title="No Git Repositories Tracked"
          description="Open a Git-enabled repository folder in VS Code to capture Git telemetry and commit history."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Git Insights</h1>
        <p className="text-xs text-slate-400 mt-1">Repository metrics, commit history telemetry, and branch status</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Repositories</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{overview?.totalRepositories || 0}</span>
          <p className="text-xs text-slate-400 mt-1">Active workspaces</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Commits</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <GitCommit className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{overview?.totalCommits || 0}</span>
          <p className="text-xs text-slate-400 mt-1">Version control commits</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Commits This Week</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{overview?.commitsThisWeek || 0}</span>
          <p className="text-xs text-slate-400 mt-1">Last 7 days</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Insertions</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-emerald-400 font-mono">+{overview?.totalInsertions || 0}</span>
          <p className="text-xs text-slate-400 mt-1">Lines added</p>
        </div>
      </div>

      {/* Main Grid: Repos Sidebar & Commits View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repository List */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-400" />
            Tracked Repositories
          </h3>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {repositories.map(repo => {
              const isSelected = selectedRepo?._id === repo._id;
              return (
                <button 
                  key={repo._id} 
                  onClick={() => selectRepository(repo)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-xs' 
                      : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-mono text-xs font-bold text-slate-200 truncate">{repo.repositoryName}</h4>
                    <Badge variant={repo.isDirty ? 'amber' : 'emerald'}>
                      {repo.isDirty ? 'Dirty' : 'Clean'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <GitBranch className="w-3 h-3 text-indigo-400" />
                      {repo.currentBranch}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <GitCommit className="w-3 h-3" />
                      {repo.totalCommits}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Commits Timeline Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedRepo ? (
            <div className="glass-card p-8 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center min-h-[400px]">
              <EmptyState
                icon={GitBranch}
                title="Select a Repository"
                description="Click a repository from the left panel to inspect commit history timeline and changed files."
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Repo Header */}
              <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-xl font-mono font-bold text-white flex items-center gap-2">
                      {selectedRepo.repositoryName}
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-1 font-mono">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                      Branch: <span className="text-slate-200 font-semibold">{selectedRepo.currentBranch}</span>
                    </p>
                  </div>

                  {selectedRepo.isDirty && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {selectedRepo.changedFiles} Uncommitted files
                    </div>
                  )}
                </div>

                {selectedRepo.remoteUrlSanitized && (
                  <p className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800 truncate">
                    Remote: {selectedRepo.remoteUrlSanitized}
                  </p>
                )}
              </div>

              {/* Commits Timeline */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Commit Telemetry</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{commits.length} Commits Loaded</span>
                </div>

                {commits.length > 0 ? (
                  <div className="space-y-4">
                    {commits.map((commit) => (
                      <div key={commit._id} className="relative pl-6 pb-4 border-l border-slate-800/80 last:border-0 last:pb-0">
                        <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-4 ring-[#0d1322]" />
                        <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/60 hover:border-slate-700/80 transition-all font-mono">
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <h4 className="text-slate-200 font-semibold text-xs leading-relaxed">{commit.message}</h4>
                            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                              {commit.shortHash}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-y-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/50">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {safeFormatDate(commit.timestamp, 'MMM d, h:mm a')}
                            </span>

                            <div className="flex items-center gap-3">
                              <span className="text-slate-300">{commit.authorName}</span>
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <Plus className="w-3 h-3" />{commit.insertions}
                              </span>
                              <span className="text-rose-400 flex items-center gap-0.5">
                                <Minus className="w-3 h-3" />{commit.deletions}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button 
                      onClick={loadMoreCommits}
                      className="w-full py-2.5 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 rounded-xl text-xs font-mono font-semibold transition-all border border-slate-800 cursor-pointer mt-4"
                    >
                      Load Older Commits
                    </button>
                  </div>
                ) : (
                  <EmptyState
                    icon={GitCommit}
                    title="No Commits Found"
                    description="No commit history available for this repository."
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap & Timeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 overflow-x-auto">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            Git Commit Heatmap
          </h3>
          <div className="min-w-[650px] text-slate-300">
            {heatmapData.length > 0 ? (
              <ActivityCalendar 
                data={heatmapData} 
                theme={{
                  light: ['#1e293b', '#22c55e'],
                  dark: ['#131b2e', '#143823', '#065f46', '#10b981', '#34d399']
                }}
                colorScheme="dark"
                labels={{
                  totalCount: '{{count}} commits in the last year',
                }}
              />
            ) : (
              <EmptyState
                icon={GitBranch}
                title="No Heatmap Data"
                description="Commit calendar will populate as commits are created."
              />
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2 font-mono">
            <GitCommit className="w-4 h-4 text-indigo-400" />
            Commits Velocity (Last 30 Days)
          </h3>
          <div className="h-52 w-full">
            {activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity.slice(-30)}>
                  <XAxis dataKey="date" tickFormatter={(tick) => safeFormatDate(tick, 'MMM d')} stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#34d399' }}
                  />
                  <Bar dataKey="commits" name="Commits" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={GitCommit}
                title="No Commit Velocity"
                description="No daily commit activity recorded."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
