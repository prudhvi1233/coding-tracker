import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../api/apiClient';
import { subDays, isAfter } from 'date-fns';
import { safeFormatDate } from '../utils/dateUtils';
import { Badge } from './common/Badge';
import { EmptyState } from './common/EmptyState';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { 
  Activity, 
  Clock, 
  Code2, 
  Flame,
  Trophy,
  Save,
  FolderOpen,
  BarChart3,
  CalendarDays,
  Timer
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

  const filteredDaily = useMemo(() => {
    if (timeRange === 0) return daily;
    const cutoffDate = subDays(new Date(), timeRange);
    return daily.filter(d => isAfter(new Date(d.date), cutoffDate));
  }, [daily, timeRange]);

  const heatmapData = useMemo(() => {
    return daily.map(d => ({
      date: d.date,
      count: d.saveEvents,
      level: Math.min(4, Math.ceil(d.saveEvents / 10))
    }));
  }, [daily]);

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <LoadingSkeleton type="metrics" />
        <LoadingSkeleton type="chart" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Deep insights into coding habits, language distribution, and project velocity</p>
        </div>

        <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 inline-flex self-start sm:self-auto font-mono">
          {[7, 30, 90, 0].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeRange === days 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {days === 0 ? 'All Time' : `${days}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Coding Time</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">
            {Math.floor((overview?.totalEstimatedCodingMinutes || 0) / 60)}h {(overview?.totalEstimatedCodingMinutes || 0) % 60}m
          </span>
          <p className="text-xs text-slate-400 mt-1">Estimated active coding</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Save Telemetry</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Save className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{overview?.totalSaveEvents || 0}</span>
          <p className="text-xs text-slate-400 mt-1">Captured file saves</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Streak</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{overview?.currentStreak || 0}</span>
          <p className="text-xs text-amber-400 font-mono mt-1">Active consecutive days</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Peak Streak</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{overview?.longestStreak || 0}</span>
          <p className="text-xs text-purple-400 font-mono mt-1">All-time record</p>
        </div>
      </div>

      {/* Main Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coding Activity Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">Coding Activity Stream</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Saves per Day</span>
          </div>

          <div className="h-64 w-full">
            {filteredDaily.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredDaily}>
                  <XAxis dataKey="date" tickFormatter={(tick) => safeFormatDate(tick, 'MMM d')} stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Bar dataKey="saveEvents" name="Save Events" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={Activity}
                title="No Chart Telemetry"
                description="No daily activity data available for the selected timeframe."
              />
            )}
          </div>
        </div>

        {/* Top Languages & Top Projects Breakdown */}
        <div className="space-y-6">
          {/* Languages */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
              <Code2 className="w-4 h-4 text-emerald-400" />
              Top Languages
            </h3>
            <div className="space-y-3">
              {languages.slice(0, 4).map(l => (
                <div key={l.language}>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-200 font-semibold">{l.language}</span>
                    <span className="text-slate-400">{l.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${l.percentage}%` }} />
                  </div>
                </div>
              ))}
              {languages.length === 0 && <p className="text-xs text-slate-400 italic">No language statistics available.</p>}
            </div>
          </div>

          {/* Projects */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              Top Projects
            </h3>
            <div className="space-y-3">
              {projects.slice(0, 4).map(p => (
                <div key={p.projectName} className="flex justify-between items-center border-b border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-mono font-bold text-slate-200">{p.projectName}</p>
                    <p className="text-[11px] text-slate-400">{p.saveEvents} saves • {p.filesEdited} files</p>
                  </div>
                  <Badge variant="indigo">
                    {Math.floor(p.estimatedCodingMinutes / 60)}h {p.estimatedCodingMinutes % 60}m
                  </Badge>
                </div>
              ))}
              {projects.length === 0 && <p className="text-xs text-slate-400 italic">No project statistics available.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap Calendar */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800/80 overflow-x-auto">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
          <CalendarDays className="w-4 h-4 text-orange-400" />
          Annual Contribution Heatmap
        </h3>
        <div className="min-w-[750px] text-slate-300">
          {heatmapData.length > 0 ? (
            <ActivityCalendar 
              data={heatmapData} 
              theme={{
                light: ['#1e293b', '#4f46e5'],
                dark: ['#131b2e', '#232d4b', '#3730a3', '#4f46e5', '#6366f1']
              }}
              colorScheme="dark"
              labels={{
                totalCount: '{{count}} save events in the last year',
              }}
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No Heatmap Data"
              description="Contribution calendar will populate as you code."
            />
          )}
        </div>
      </div>

      {/* Recent Coding Sessions Timeline */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-indigo-400" />
          Recent Developer Sessions
        </h3>
        
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.slice(0, 6).map(s => (
              <div key={s._id} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700/80 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-mono font-bold text-slate-200">{safeFormatDate(s.startedAt, 'MMM d, yyyy')}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {safeFormatDate(s.startedAt, 'h:mm a')} - {safeFormatDate(s.lastActivityAt, 'h:mm a')}
                    </p>
                  </div>
                  <Badge variant="emerald">
                    {Math.floor(s.estimatedDurationMinutes / 60)}h {s.estimatedDurationMinutes % 60}m
                  </Badge>
                </div>
                
                <div className="text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Project:</span>
                    <span className="text-slate-200 font-semibold">{s.projectName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Files Touched:</span>
                    <span className="text-slate-200">{s.filesEdited.length} files</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Saves Captured:</span>
                    <span className="text-slate-200">{s.saveEvents} saves</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1">
                    {s.languages.map((l: string) => (
                      <Badge key={l} variant="language" language={l}>
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="No Session Telemetry"
            description="Active coding sessions will appear here automatically."
          />
        )}
      </div>
    </div>
  );
}
