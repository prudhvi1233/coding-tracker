import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { format } from 'date-fns';
import { 
  Target, Trophy, Flame, Clock, Plus, Lock, CheckCircle2, XCircle
} from 'lucide-react';


export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  
  // Create Goal Form State
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
      // Trigger achievement evaluation silently
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
           // We only care about recently unlocked or just un-notified
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
      await apiClient.post(`/notifications/dismiss`, {  type: toast.type, id: toast.id });
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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 space-y-4">
          {toasts.map(t => (
            <div key={`${t.type}-${t.id}`} className="bg-slate-800 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 p-4 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">{t.message}</span>
              </div>
              <button onClick={() => dismissToast(t)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-indigo-500/10">
          <div className="flex items-center gap-3 mb-2 text-indigo-400">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Active Goals</span>
          </div>
          <p className="text-3xl font-bold text-white">{summary?.active || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/10">
          <div className="flex items-center gap-3 mb-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Completed Goals</span>
          </div>
          <p className="text-3xl font-bold text-white">{summary?.completed || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-orange-500/10">
          <div className="flex items-center gap-3 mb-2 text-orange-400">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Expiring Soon</span>
          </div>
          <p className="text-3xl font-bold text-white">{summary?.expiringSoon || 0}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-purple-500/10">
          <div className="flex items-center gap-3 mb-2 text-purple-400">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-medium">Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-white">{Math.round(summary?.completionRate || 0)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Goals List (Left & Center) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Your Goals
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Goal
            </button>
          </div>

          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-slate-500 border border-slate-700/50 border-dashed">
                <Target className="w-12 h-12 mb-4 opacity-50" />
                <p>You haven't created any goals yet.</p>
                <p className="text-sm mt-1">Set a target and track your progress!</p>
              </div>
            ) : (
              goals.map(goal => {
                const pct = getProgressPercentage(goal.currentValue, goal.targetValue);
                const isCompleted = goal.status === 'completed';
                const isExpired = goal.status === 'expired';
                
                return (
                  <div key={goal._id} className={`glass-panel p-5 rounded-2xl border-l-4 ${isCompleted ? 'border-l-emerald-500' : isExpired ? 'border-l-rose-500 opacity-70' : 'border-l-indigo-500'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                        {goal.language && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded mt-1 inline-block">
                            {goal.language}
                          </span>
                        )}
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" /> 
                          {isCompleted ? `Completed ${format(new Date(goal.completedAt), 'MMM d, yyyy')}` : 
                           isExpired ? 'Expired' : 
                           `Ends ${format(new Date(goal.endDate), 'MMM d')}`}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isExpired ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {isCompleted ? 'COMPLETED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-slate-300 mb-2">
                      <span>{goal.currentValue.toFixed(1)} / {goal.targetValue}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : isExpired ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Challenges Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Challenges
          </h2>
          
          <div className="space-y-4">
            {/* Active Challenges */}
            {challenges.filter(c => c.status === 'active').map(chal => {
              const pct = getProgressPercentage(chal.currentValue, chal.targetValue);
              return (
                <div key={chal._id} className="glass-panel p-4 rounded-xl border border-orange-500/20 bg-gradient-to-br from-slate-800/80 to-orange-900/10">
                  <h4 className="font-bold text-white text-sm mb-1">{chal.title}</h4>
                  <p className="text-xs text-slate-400 mb-3">{chal.currentValue} / {chal.targetValue} completed</p>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}

            {/* Available Challenges (Templates) */}
            {challenges.filter(c => c.status === 'active').length === 0 && (
              <div className="glass-panel p-5 rounded-xl border border-slate-700/50">
                <h4 className="font-bold text-slate-200 mb-2">7-Day Coding Challenge</h4>
                <p className="text-xs text-slate-400 mb-4">Code on 7 consecutive days to build a solid habit.</p>
                <button 
                  onClick={() => startChallenge('coding_challenge_7', '7-Day Coding Challenge', 7, 7)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 text-sm font-medium rounded-lg transition-colors border border-slate-600"
                >
                  Start Challenge
                </button>
              </div>
            )}
            
            <div className="glass-panel p-5 rounded-xl border border-slate-700/50">
              <h4 className="font-bold text-slate-200 mb-2">Weekend Coder</h4>
              <p className="text-xs text-slate-400 mb-4">Code on both Saturday and Sunday this week.</p>
              <button 
                onClick={() => startChallenge('weekend_coder', 'Weekend Coder', 2, 7)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 text-sm font-medium rounded-lg transition-colors border border-slate-600"
              >
                Start Challenge
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="pt-8 border-t border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Achievements
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach, i) => (
            <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${ach.unlocked ? 'bg-slate-800/80 border-yellow-500/30' : 'bg-slate-900/50 border-slate-800 opacity-60 grayscale'}`}>
              <div className={`p-3 rounded-xl ${ach.unlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-600'}`}>
                {ach.unlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <h4 className={`font-bold text-sm ${ach.unlocked ? 'text-white' : 'text-slate-400'}`}>{ach.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{ach.description}</p>
                {ach.unlocked && (
                  <p className="text-[10px] text-yellow-500/70 mt-2 font-mono">
                    Unlocked {format(new Date(ach.unlockedAt), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create New Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Goal Title</label>
                <input 
                  type="text" 
                  required
                  value={newGoal.title}
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Code 10 hours this week"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Goal Type</label>
                  <select 
                    value={newGoal.goalType}
                    onChange={e => setNewGoal({...newGoal, goalType: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="coding_time">Coding Time (Hours)</option>
                    <option value="file_saves">File Saves</option>
                    <option value="git_commits">Git Commits</option>
                    <option value="snapshots">Snapshots</option>
                    <option value="language_days">Language Days</option>
                    <option value="coding_days">Coding Days</option>
                    <option value="projects">Project Count</option>
                    <option value="streak">Streak Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Value</label>
                  <input 
                    type="number" 
                    required min="1"
                    value={newGoal.targetValue}
                    onChange={e => setNewGoal({...newGoal, targetValue: parseInt(e.target.value)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {newGoal.goalType === 'language_days' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Language</label>
                  <input 
                    type="text" 
                    required
                    value={newGoal.language || ''}
                    onChange={e => setNewGoal({...newGoal, language: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., TypeScript"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Duration (Days)</label>
                <input 
                  type="number" 
                  required min="1" max="365"
                  value={newGoal.durationDays}
                  onChange={e => setNewGoal({...newGoal, durationDays: parseInt(e.target.value)})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
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
