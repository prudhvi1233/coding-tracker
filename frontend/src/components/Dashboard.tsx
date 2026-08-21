import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { safeFormatDate } from '../utils/dateUtils';
import { Badge } from './common/Badge';
import { EmptyState } from './common/EmptyState';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { FileActionModal } from './common/FileActionModal';
import { 
  Activity, 
  Flame, 
  Trophy, 
  Clock, 
  FileCode, 
  RefreshCw,
  FolderGit2,
  Zap,
  Sparkles,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';

interface TodayActivity {
  filesEdited: number;
  languages: string[];
  totalSaveEvents: number;
  active: boolean;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

interface RecentActivity {
  _id: string;
  fileName: string;
  language: string;
  projectName: string;
  timestamp: string;
  relativeFilePath?: string;
}

function Dashboard() {
  const [today, setToday] = useState<TodayActivity | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'delete' | 'rename' | null;
    item: RecentActivity | null;
  }>({
    isOpen: false,
    type: null,
    item: null
  });

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [todayRes, streakRes, recentRes] = await Promise.all([
        apiClient.get('/activity/today'),
        apiClient.get('/activity/streak'),
        apiClient.get('/activity/recent')
      ]);

      setToday(todayRes.data);
      setStreak(streakRes.data);
      setRecent(recentRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (type: 'delete' | 'rename', item: RecentActivity) => {
    setActiveMenuId(null);
    setModalState({
      isOpen: true,
      type,
      item
    });
  };

  const handleConfirmDelete = async () => {
    if (!modalState.item) return;
    const item = modalState.item;
    await apiClient.post('/activity/delete-file', {
      projectName: item.projectName,
      fileName: item.fileName,
      relativeFilePath: item.relativeFilePath || item.fileName
    });
    fetchData(true);
  };

  const handleConfirmRename = async (newName: string) => {
    if (!modalState.item) return;
    const item = modalState.item;
    await apiClient.post('/activity/rename', {
      projectName: item.projectName,
      oldFileName: item.fileName,
      oldRelativeFilePath: item.relativeFilePath || item.fileName,
      newFileName: newName,
      newRelativeFilePath: newName
    });
    fetchData(true);
  };

  if (loading && !today) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <LoadingSkeleton type="metrics" />
        <LoadingSkeleton type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* File Action Modal Container */}
      <FileActionModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        fileName={modalState.item?.fileName || ''}
        projectName={modalState.item?.projectName || ''}
        onClose={() => setModalState({ isOpen: false, type: null, item: null })}
        onConfirmDelete={handleConfirmDelete}
        onConfirmRename={handleConfirmRename}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Overview</h1>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border flex items-center gap-1 ${
              today?.active 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${today?.active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              {today?.active ? 'Live Session' : 'Idle'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Real-time developer activity metrics & session telemetry</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-300 hover:text-white rounded-xl border border-zinc-800/80 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            {refreshing ? 'Syncing...' : 'Sync Telemetry'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Files Edited */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/80 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Files Modified</span>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-indigo-400">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white font-mono">{today?.filesEdited || 0}</span>
            <span className="text-[11px] text-zinc-400 font-mono">Today</span>
          </div>
        </div>

        {/* Save Events */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/80 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Save Events</span>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white font-mono">{today?.totalSaveEvents || 0}</span>
            <span className="text-[11px] text-zinc-400 font-mono">Captured</span>
          </div>
        </div>

        {/* Current Streak */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/80 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Current Streak</span>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white font-mono">{streak?.currentStreak || 0}</span>
            <span className="text-[11px] font-medium text-amber-400 font-mono">Days</span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/80 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">All-Time Best</span>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white font-mono">{streak?.longestStreak || 0}</span>
            <span className="text-[11px] font-medium text-purple-400 font-mono">Days Peak</span>
          </div>
        </div>
      </div>

      {/* Languages Used Banner */}
      <div className="glass-card p-5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Today's Active Languages
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {today?.languages ? `${today.languages.length} Language${today.languages.length === 1 ? '' : 's'}` : '0 Languages'}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {today?.languages && today.languages.length > 0 ? (
            today.languages.map((lang) => (
              <Badge key={lang} variant="language" language={lang}>
                {lang}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-zinc-400 italic py-1">No language activity recorded today yet.</p>
          )}
        </div>
      </div>

      {/* Recent Activity Table Section */}
      <div className="glass-card rounded-2xl border border-zinc-800/80 overflow-hidden">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">Recent Activity Stream</h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Last 10 Events</span>
        </div>

        {recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-black/40 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-xs">
                {recent.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-900/40 transition-colors group">
                    <td className="py-3 px-4 text-zinc-400 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                        {safeFormatDate(item.timestamp || (item as any).createdAt, 'h:mm:ss a')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-zinc-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-xs">{item.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="language" language={item.language}>
                        {item.language}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="font-mono text-zinc-300">{item.projectName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all cursor-pointer"
                        title="File actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* 3-Dots Context Menu Dropdown */}
                      {activeMenuId === item._id && (
                        <div className="absolute right-4 top-10 z-40 w-44 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1 font-mono text-xs text-left animate-fadeIn">
                          <button
                            onClick={() => openModal('rename', item)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Rename File
                          </button>
                          <button
                            onClick={() => openModal('delete', item)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete History
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Activity}
              title="No Recent Activity"
              description="Save a file in VS Code with the CodingTracker extension enabled to stream activity telemetry here."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
