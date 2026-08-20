import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { safeFormatDate } from '../utils/dateUtils';
import { 
  Activity, 
  Flame, 
  Trophy, 
  Clock, 
  FileCode2, 
  Terminal,
  RefreshCw
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
}

function Dashboard() {
  const [today, setToday] = useState<TodayActivity | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
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
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700 transition-all active:scale-95 text-sm font-medium text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Activity Card */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
          
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-indigo-400" />
            Today's Activity
          </h2>
          
          <div className="grid grid-cols-3 gap-4 relative z-10">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Files Edited</p>
              <p className="text-4xl font-bold text-white">{today?.filesEdited || 0}</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Save Events</p>
              <p className="text-4xl font-bold text-white">{today?.totalSaveEvents || 0}</p>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 flex flex-col justify-center items-center">
              <div className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${today?.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                <div className={`w-2 h-2 rounded-full ${today?.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                {today?.active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700/50 relative z-10">
            <p className="text-slate-400 text-sm mb-3">Languages Used</p>
            <div className="flex flex-wrap gap-2">
              {today?.languages && today.languages.length > 0 ? (
                today.languages.map((lang) => (
                  <span key={lang} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 text-sm rounded-md border border-indigo-500/20">
                    {lang}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm italic">No coding activity today</span>
              )}
            </div>
          </div>
        </div>

        {/* Streaks Card */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute bottom-0 right-0 p-24 bg-orange-500/5 rounded-full blur-3xl translate-y-1/3 translate-x-1/3 group-hover:bg-orange-500/10 transition-colors duration-700"></div>
           
           <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
            <Flame className="w-5 h-5 text-orange-400" />
            Streaks
          </h2>

          <div className="space-y-4 relative z-10">
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50 flex items-center justify-between group-hover:border-orange-500/30 transition-colors">
              <div>
                <p className="text-slate-400 text-sm mb-1">Current</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{streak?.currentStreak || 0}</span>
                  <span className="text-slate-500">days</span>
                </div>
              </div>
              <Flame className={`w-10 h-10 ${streak?.currentStreak && streak.currentStreak > 0 ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-slate-600'}`} />
            </div>

            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Longest</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{streak?.longestStreak || 0}</span>
                  <span className="text-slate-500">days</span>
                </div>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
          <Terminal className="w-5 h-5 text-slate-400" />
          Recent Activity
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-sm">
                <th className="py-3 px-4 font-medium">Time</th>
                <th className="py-3 px-4 font-medium">File</th>
                <th className="py-3 px-4 font-medium">Language</th>
                <th className="py-3 px-4 font-medium">Project</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {recent.length > 0 ? (
                recent.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {safeFormatDate(item.timestamp || (item as any).createdAt, 'h:mm a')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm text-indigo-300">
                      <div className="flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-slate-500" />
                        {item.fileName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                        {item.language}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {item.projectName}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No recent activity found. Start coding!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
