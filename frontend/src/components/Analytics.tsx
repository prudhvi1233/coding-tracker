import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../api/apiClient';
import { format, subDays, isAfter } from 'date-fns';
import { 
  Activity, 
  Clock, 
  Code2, 
  Calendar as CalendarIcon,
  Flame,
  Trophy,
  Save,
  FolderOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ActivityCalendar } from 'react-activity-calendar';


export default function Analytics() {
  const [timeRange, setTimeRange] = useState(30); // days
  const [overview, setOverview] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, dailyRes, langRes, projRes, sessionRes] = await Promise.all([
        apiClient.get(`/analytics/overview`),
        apiClient.get(`/analytics/daily`),
        apiClient.get(`/analytics/languages`),
        apiClient.get(`/analytics/projects`),
        apiClient.get(`/sessions`)
      ]);
      setOverview(overviewRes.data);
      setDaily(dailyRes.data);
      setLanguages(langRes.data);
      setProjects(projRes.data);
      setSessions(sessionRes.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // Filter daily data by time range
  const filteredDaily = useMemo(() => {
    if (timeRange === 0) return daily; // All time
    const cutoffDate = subDays(new Date(), timeRange);
    return daily.filter(d => isAfter(new Date(d.date), cutoffDate));
  }, [daily, timeRange]);

  // Transform daily data for the heatmap
  const heatmapData = useMemo(() => {
    return daily.map(d => ({
      date: d.date,
      count: d.saveEvents,
      level: Math.min(4, Math.ceil(d.saveEvents / 10)) // Simple scaling
    }));
  }, [daily]);

  if (loading && !overview) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Time Range Filter */}
      <div className="flex justify-end">
        <div className="bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 inline-flex">
          {[7, 30, 90, 0].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${timeRange === days ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {days === 0 ? 'All Time' : `Last ${days} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-indigo-500/10">
          <div className="flex items-center gap-3 mb-2 text-indigo-400">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview?.currentStreak || 0} <span className="text-sm text-slate-500 font-normal">days</span></p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-orange-500/10">
          <div className="flex items-center gap-3 mb-2 text-orange-400">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-medium">Longest Streak</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview?.longestStreak || 0} <span className="text-sm text-slate-500 font-normal">days</span></p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/10">
          <div className="flex items-center gap-3 mb-2 text-emerald-400">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Estimated Time</span>
          </div>
          <p className="text-3xl font-bold text-white">{Math.floor((overview?.totalEstimatedCodingMinutes || 0) / 60)}h {(overview?.totalEstimatedCodingMinutes || 0) % 60}m</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-blue-500/10">
          <div className="flex items-center gap-3 mb-2 text-blue-400">
            <Save className="w-5 h-5" />
            <span className="text-sm font-medium">Total Saves</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview?.totalSaveEvents || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Coding Activity
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredDaily}>
                <XAxis dataKey="date" tickFormatter={(tick) => format(new Date(tick), 'MMM d')} stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Bar dataKey="saveEvents" name="Save Events" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Languages & Projects */}
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              Top Languages
            </h3>
            <div className="space-y-4">
              {languages.slice(0, 4).map(l => (
                <div key={l.language}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{l.language}</span>
                    <span className="text-slate-500">{l.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${l.percentage}%` }}></div>
                  </div>
                </div>
              ))}
              {languages.length === 0 && <p className="text-slate-500 text-sm">No data yet.</p>}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-orange-400" />
              Top Projects
            </h3>
            <div className="space-y-3">
              {projects.slice(0, 4).map(p => (
                <div key={p.projectName} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">{p.projectName}</p>
                    <p className="text-slate-500 text-xs">{p.saveEvents} saves • {p.filesEdited} files</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-sm">{Math.floor(p.estimatedCodingMinutes / 60)}h {p.estimatedCodingMinutes % 60}m</p>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-slate-500 text-sm">No data yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-panel p-6 rounded-2xl overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-400" />
          Activity Calendar
        </h3>
        <div className="min-w-[800px] text-slate-300">
          {heatmapData.length > 0 ? (
            <ActivityCalendar 
              data={heatmapData} 
              theme={{
                light: ['#1e293b', '#4f46e5'],
                dark: ['#1e293b', '#312e81', '#4338ca', '#4f46e5', '#6366f1']
              }}
              colorScheme="dark"
              labels={{
                totalCount: '{{count}} save events in the last year',
              }}
            />
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No activity data available.</p>
          )}
        </div>
      </div>

      {/* Sessions History */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Recent Sessions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.slice(0, 6).map(s => (
            <div key={s._id} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-slate-300 font-medium">{format(new Date(s.startedAt), 'MMM d, yyyy')}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {format(new Date(s.startedAt), 'h:mm a')} - {format(new Date(s.lastActivityAt), 'h:mm a')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-md">
                    {Math.floor(s.estimatedDurationMinutes / 60)}h {s.estimatedDurationMinutes % 60}m
                  </span>
                </div>
              </div>
              
              <div className="text-sm space-y-1">
                <p className="flex justify-between">
                  <span className="text-slate-500">Project</span>
                  <span className="text-slate-300">{s.projectName}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Files Edited</span>
                  <span className="text-slate-300">{s.filesEdited.length} files</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Save Events</span>
                  <span className="text-slate-300">{s.saveEvents} saves</span>
                </p>
                <div className="pt-2 mt-2 border-t border-slate-700/50">
                  <div className="flex flex-wrap gap-1">
                    {s.languages.map((l: string) => (
                      <span key={l} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-slate-500 text-sm col-span-2 text-center py-4">No sessions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
