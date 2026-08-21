import { useState } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Code, 
  BarChart2, 
  GitBranch, 
  Target, 
  Sparkles, 
  User, 
  Menu, 
  X, 
  Terminal
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import CodeHistory from './components/CodeHistory';
import Analytics from './components/Analytics';
import GitInsights from './components/GitInsights';
import Goals from './components/Goals';
import AIInsights from './components/AIInsights';
import Profile from './components/Profile';
import AuthScreens from './components/AuthScreens';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

type TabType = 'dashboard' | 'history' | 'snapshots' | 'analytics' | 'git' | 'goals' | 'insights' | 'profile';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-xl border-2 border-indigo-500/30 animate-ping" />
            <div className="relative w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <span className="text-xs font-mono text-zinc-400 tracking-wider">LOADING CODINGTRACKER...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreens />;
  }

  const navSections = [
    {
      title: 'CORE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'history', label: 'Activity History', icon: History },
        { id: 'snapshots', label: 'Code Snapshots', icon: Code },
      ]
    },
    {
      title: 'INSIGHTS & ANALYTICS',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
        { id: 'git', label: 'Git Insights', icon: GitBranch },
      ]
    },
    {
      title: 'PROGRESS & INTELLIGENCE',
      items: [
        { id: 'goals', label: 'Goals & Awards', icon: Target },
        { id: 'insights', label: 'AI Insights', icon: Sparkles, badge: 'AI' },
      ]
    }
  ];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-200 selection:bg-indigo-500/30 font-sans flex flex-col md:flex-row relative overflow-hidden">
      {/* Subtle Black Ambient Glows */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/3 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-600/3 rounded-full blur-[160px] pointer-events-none" />

      {/* Mobile Top Navigation Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#08080a]/90 backdrop-blur-md border-b border-zinc-800/80 z-40 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-white font-mono">CodingTracker</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Navigation Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#08080a] md:bg-[#070709]/80 backdrop-blur-2xl border-r border-zinc-800/80
        flex flex-col transform transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 shadow-inner">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono">
                CodingTracker
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="System Active" />
              </h1>
              <span className="text-[10px] text-zinc-400 tracking-wider block uppercase">Dev Analytics v2.0</span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <h2 className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                {section.title}
              </h2>
              <div className="space-y-1 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as TabType)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium
                        transition-all duration-150 relative cursor-pointer group
                        ${isActive 
                          ? 'bg-zinc-900 text-white border border-zinc-700/80 font-semibold shadow-xs' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'}
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-300'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Bar */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#050507]">
          <button
            onClick={() => handleTabChange('profile')}
            className={`
              w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer
              ${activeTab === 'profile' 
                ? 'bg-zinc-900 text-white border border-zinc-700' 
                : 'hover:bg-zinc-900/60 text-zinc-300 border border-transparent'}
            `}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 shrink-0 font-bold font-mono text-xs">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left truncate min-w-0">
                <p className="font-semibold text-zinc-200 truncate text-xs">{user.displayName || 'Developer'}</p>
                <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar flex flex-col min-w-0">
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'history' && <CodeHistory />}
          {activeTab === 'snapshots' && <CodeHistory />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'git' && <GitInsights />}
          {activeTab === 'goals' && <Goals />}
          {activeTab === 'insights' && <AIInsights />}
          {activeTab === 'profile' && <Profile />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
