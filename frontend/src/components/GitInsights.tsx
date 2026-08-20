import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../api/apiClient';
import { format } from 'date-fns';
import { 
  GitBranch, GitCommit, FileCode, Clock, BookOpen, AlertCircle, Folder
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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!loading && repositories.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500">
        <GitBranch className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg text-slate-400">No Git repositories detected.</p>
        <p className="text-sm mt-2">Open a Git project in VS Code and refresh Git data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-indigo-500/10">
          <div className="flex items-center gap-3 mb-2 text-indigo-400">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-medium">Repositories</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview?.totalRepositories || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-orange-500/10">
          <div className="flex items-center gap-3 mb-2 text-orange-400">
            <GitCommit className="w-5 h-5" />
            <span className="text-sm font-medium">Total Commits</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview?.totalCommits || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/10">
          <div className="flex items-center gap-3 mb-2 text-emerald-400">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Commits this Week</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview?.commitsThisWeek || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-blue-500/10">
          <div className="flex items-center gap-3 mb-2 text-blue-400">
            <FileCode className="w-5 h-5" />
            <span className="text-sm font-medium">Lines Added</span>
          </div>
          <p className="text-3xl font-bold text-white">+{overview?.totalInsertions || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Repository List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-400" />
            Repositories
          </h3>
          <div className="space-y-3">
            {repositories.map(repo => (
              <button 
                key={repo._id} 
                onClick={() => selectRepository(repo)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedRepo?._id === repo._id ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-200">{repo.repositoryName}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${repo.isDirty ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {repo.isDirty ? 'Dirty' : 'Clean'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <GitBranch className="w-3 h-3" /> {repo.currentBranch}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <GitCommit className="w-3 h-3" /> {repo.totalCommits} commits
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Repository Details & Commits */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedRepo ? (
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-slate-500 h-full">
              <GitBranch className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a repository to view its commits.</p>
            </div>
          ) : (
            <>
              {/* Repo Details Header */}
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedRepo.repositoryName}</h2>
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <GitBranch className="w-4 h-4" /> {selectedRepo.currentBranch}
                    </p>
                  </div>
                  {selectedRepo.isDirty && (
                    <div className="flex items-center gap-1.5 text-orange-400 text-sm bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                      <AlertCircle className="w-4 h-4" />
                      Working tree modified ({selectedRepo.changedFiles} files)
                    </div>
                  )}
                </div>
                
                {selectedRepo.remoteUrlSanitized && (
                  <p className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded truncate mb-4">
                    Remote: {selectedRepo.remoteUrlSanitized}
                  </p>
                )}
              </div>

              {/* Commits Timeline */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-indigo-400" />
                  Recent Commits
                </h3>
                
                <div className="space-y-4">
                  {commits.map((commit) => (
                    <div key={commit._id} className="relative pl-6 pb-4 border-l border-slate-700 last:border-0 last:pb-0">
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-4 ring-[#0f172a]"></div>
                      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-slate-200 font-medium text-sm">{commit.message}</h4>
                          <span className="text-xs font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded">{commit.shortHash}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {format(new Date(commit.timestamp), 'MMM d, h:mm a')}
                          </span>
                          <span className="text-slate-500">{commit.authorName}</span>
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-slate-500">{commit.filesChanged} files</span>
                            <span className="text-emerald-400">+{commit.insertions}</span>
                            <span className="text-rose-400">-{commit.deletions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {commits.length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-4">No commits found for this repository.</p>
                  )}
                  
                  {commits.length > 0 && (
                    <button 
                      onClick={loadMoreCommits}
                      className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-lg text-sm transition-colors border border-slate-700/50 mt-4"
                    >
                      Load More
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Activity Heatmap & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl overflow-x-auto">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            Git Commit Activity
          </h3>
          <div className="min-w-[700px] text-slate-300">
            {heatmapData.length > 0 ? (
              <ActivityCalendar 
                data={heatmapData} 
                theme={{
                  light: ['#1e293b', '#22c55e'],
                  dark: ['#1e293b', '#064e3b', '#047857', '#10b981', '#34d399']
                }}
                colorScheme="dark"
                labels={{
                  totalCount: '{{count}} commits in the last year',
                }}
              />
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">No commit data available.</p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-emerald-400" />
            Commits Over Time (Last 30 Days)
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity.slice(-30)}>
                <XAxis dataKey="date" tickFormatter={(tick) => format(new Date(tick), 'MMM d')} stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="commits" name="Commits" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
