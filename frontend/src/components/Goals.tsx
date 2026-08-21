import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { safeFormatDate } from '../utils/dateUtils';
import { Badge } from './common/Badge';
import { EmptyState } from './common/EmptyState';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { 
  Target, Trophy, Flame, Clock, Plus, Lock, CheckCircle2, Award, X
} from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    goalType: 'file_saves',
    targetValue: 10,
    periodType: 'weekly',
    durationDays: 7,
    language: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/achievements/evaluate`, {});
      
      const [goalsRes, sumRes, chalRes, achRes] = await Promise.all([
        apiClient.get(`/goals`),
        apiClient.get(`/goals/summary`),
        apiClient.get(`/challenges`),
        apiClient.get(`/achievements`)
      ]);
      setGoals(goalsRes.data);
      setSummary(sumRes.data);
      setChallenges(chalRes.data);
      setAchievements(achRes.data);

      const newToasts: any[] = [];
      goalsRes.data.forEach((g: any) => {
        if (g.status === 'completed' && !g.notified) newToasts.push({ id: g._id, type: 'goal', message: `Goal Completed: ${g.title}` });
      });
      chalRes.data.forEach((c: any) => {
        if (c.status === 'completed' && !c.notified) newToasts.push({ id: c._id, type: 'challenge', message: `Challenge Completed: ${c.title}` });
      });
      achRes.data.forEach((a: any) => {
        if (a.unlocked && !a.notified && a.unlockedAt) {
           newToasts.push({ id: a._id, type: 'achievement', message: `Achievement Unlocked: ${a.title}` });
        }
      });
      setToasts(newToasts);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const dismissToast = async (toast: any) => {
    setToasts(prev => prev.filter(t => t.id !== toast.id));
    try {
      await apiClient.post(`/notifications/dismiss`, { type: toast.type, id: toast.id });
    } catch (e) {}
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + newGoal.durationDays * 24 * 60 * 60 * 1000);
    
    try {
      await apiClient.post(`/goals`, {
        title: newGoal.title,
        goalType: newGoal.goalType,
        targetValue: newGoal.targetValue,
        periodType: newGoal.periodType,
        language: newGoal.language,
        startDate,
        endDate
      });
      setShowCreateModal(false);
      fetchData();
    } catch (e) {
      console.error('Failed to create goal', e);
    }
  };

  const startChallenge = async (challengeType: string, title: string, targetValue: number, durationDays: number) => {
    try {
      await apiClient.post(`/challenges`, {
        challengeType,
        title,
        targetValue,
        durationDays
      });
      fetchData();
    } catch (e) {
      console.error('Failed to start challenge', e);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <LoadingSkeleton type="metrics" />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 space-y-3 max-w-sm">
          {toasts.map(t => (
            <div key={`${t.type}-${t.id}`} className="bg-slate-900 border border-emerald-500/40 shadow-2xl p-4 rounded-xl flex items-center justify-between gap-4 font-mono">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white text-xs leading-relaxed">{t.message}</span>
              </div>
              <button onClick={() => dismissToast(t)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Goals & Awards</h1>
          <p className="text-xs text-slate-400 mt-1">Productivity milestones, developer streak challenges, and achievements</p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Custom Goal
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Goals</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{summary?.active || 0}</span>
          <p className="text-xs text-slate-400 mt-1">In progress targets</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Goals</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{summary?.completed || 0}</span>
          <p className="text-xs text-emerald-400 font-mono mt-1">Achieved targets</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expiring Soon</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{summary?.expiringSoon || 0}</span>
          <p className="text-xs text-amber-400 font-mono mt-1">Ending within 48h</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completion Rate</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-white font-mono">{Math.round(summary?.completionRate || 0)}%</span>
          <p className="text-xs text-purple-400 font-mono mt-1">Goal velocity ratio</p>
        </div>
      </div>

      {/* Main Content: Goals & Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            Active & Past Goals
          </h2>

          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No Custom Goals"
              description="Create a personal coding goal to track your developer targets and build habits."
              action={{
                label: 'Create First Goal',
                onClick: () => setShowCreateModal(true)
              }}
            />
          ) : (
            <div className="space-y-4">
              {goals.map(goal => {
                const pct = getProgressPercentage(goal.currentValue, goal.targetValue);
                const isCompleted = goal.status === 'completed';
                const isExpired = goal.status === 'expired';
                
                return (
                  <div key={goal._id} className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-bold text-white text-sm">{goal.title}</h3>
                          {goal.language && (
                            <Badge variant="language" language={goal.language}>
                              {goal.language}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {isCompleted ? `Completed ${safeFormatDate(goal.completedAt, 'MMM d, yyyy')}` : 
                           isExpired ? 'Expired' : 
                           `Ends ${safeFormatDate(goal.endDate, 'MMM d')}`}
                        </p>
                      </div>

                      <Badge variant={isCompleted ? 'emerald' : isExpired ? 'rose' : 'indigo'}>
                        {isCompleted ? 'COMPLETED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 font-mono">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Progress ({goal.currentValue.toFixed(0)} / {goal.targetValue})</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            isCompleted ? 'bg-emerald-500' : isExpired ? 'bg-rose-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Developer Challenges Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Developer Challenges
          </h2>

          <div className="space-y-3">
            {challenges.filter(c => c.status === 'active').map(chal => {
              const pct = getProgressPercentage(chal.currentValue, chal.targetValue);
              return (
                <div key={chal._id} className="glass-card p-4 rounded-xl border border-amber-500/30 space-y-3">
                  <h4 className="font-mono text-xs font-bold text-white">{chal.title}</h4>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>{chal.currentValue} / {chal.targetValue} days</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            {challenges.filter(c => c.status === 'active').length === 0 && (
              <div className="glass-card p-4 rounded-xl border border-slate-800/80 space-y-3">
                <h4 className="font-mono text-xs font-bold text-slate-200">7-Day Consistency Challenge</h4>
                <p className="text-xs text-slate-400">Code on 7 consecutive days to lock in a habit.</p>
                <button 
                  onClick={() => startChallenge('coding_challenge_7', '7-Day Consistency Challenge', 7, 7)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-semibold rounded-xl transition-all border border-slate-700 cursor-pointer"
                >
                  Start Challenge
                </button>
              </div>
            )}

            <div className="glass-card p-4 rounded-xl border border-slate-800/80 space-y-3">
              <h4 className="font-mono text-xs font-bold text-slate-200">Weekend Sprint</h4>
              <p className="text-xs text-slate-400">Log coding activity on Saturday & Sunday this week.</p>
              <button 
                onClick={() => startChallenge('weekend_coder', 'Weekend Sprint', 2, 7)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-semibold rounded-xl transition-all border border-slate-700 cursor-pointer"
              >
                Start Challenge
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="pt-6 border-t border-slate-800/80 space-y-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-400" />
          Achievements & Badges
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach, i) => (
            <div 
              key={i} 
              className={`glass-card p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                ach.unlocked 
                  ? 'border-purple-500/30 bg-purple-500/5' 
                  : 'border-slate-800/80 opacity-60'
              }`}
            >
              <div className={`p-3 rounded-xl border ${
                ach.unlocked 
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}>
                {ach.unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className={`font-mono text-xs font-bold ${ach.unlocked ? 'text-white' : 'text-slate-400'}`}>
                  {ach.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">{ach.description}</p>
                {ach.unlocked && (
                  <p className="text-[10px] text-purple-300/80 font-mono pt-1">
                    Unlocked {safeFormatDate(ach.unlockedAt, 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="glass-card bg-[#0d1322] border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-sm font-mono font-bold text-white">Create Developer Goal</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Goal Title</label>
                <input 
                  type="text" 
                  required
                  value={newGoal.title}
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Code 10 hours this week"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Goal Type</label>
                  <select 
                    value={newGoal.goalType}
                    onChange={e => setNewGoal({...newGoal, goalType: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="coding_time">Coding Time (Hours)</option>
                    <option value="file_saves">File Saves</option>
                    <option value="git_commits">Git Commits</option>
                    <option value="snapshots">Snapshots</option>
                    <option value="language_days">Language Days</option>
                    <option value="coding_days">Coding Days</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Target Value</label>
                  <input 
                    type="number" 
                    required min="1"
                    value={newGoal.targetValue}
                    onChange={e => setNewGoal({...newGoal, targetValue: parseInt(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Duration (Days)</label>
                <input 
                  type="number" 
                  required min="1" max="365"
                  value={newGoal.durationDays}
                  onChange={e => setNewGoal({...newGoal, durationDays: parseInt(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-slate-300 hover:bg-slate-800/60 rounded-xl transition-all border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
