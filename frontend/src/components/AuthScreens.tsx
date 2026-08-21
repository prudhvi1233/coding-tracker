import { useState } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../AuthContext';
import { Terminal, LogIn, UserPlus, ShieldAlert } from 'lucide-react';

export default function AuthScreens() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiClient.post('/auth/login', { email, password });
        login(res.data.token, res.data.user);
      } else {
        const res = await apiClient.post('/auth/register', { email, password, displayName });
        login(res.data.token, res.data.user);
        
        try {
          await apiClient.post('/account/migrate', {}, {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });
        } catch (migErr) {
          console.error('Migration skipped or failed.', migErr);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-slate-800/80 shadow-2xl relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner mb-1">
            <Terminal className="w-6 h-6" />
          </div>
          
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">
            CodingTracker
          </h1>
          <p className="text-xs text-slate-400 max-w-xs font-sans">
            {isLogin ? 'Sign in to access your developer activity telemetry.' : 'Create an account to track your VS Code coding activity.'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-xs font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {!isLogin && (
            <div>
              <label className="block font-medium text-slate-300 mb-1">Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Developer Name"
                className="w-full bg-slate-900/60 border border-slate-700/60 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block font-medium text-slate-300 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="developer@domain.com"
              className="w-full bg-slate-900/60 border border-slate-700/60 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-900/60 border border-slate-700/60 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <><LogIn className="w-4 h-4" /> Sign In</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Create Account</>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/60 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-slate-400 hover:text-indigo-300 text-xs font-mono transition-colors cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
