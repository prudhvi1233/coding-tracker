import { useState } from 'react';
import { Activity, Clock, FileCode2, LineChart, Code2, GitMerge, Target, Lightbulb, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CodeHistory from './components/CodeHistory';
import Analytics from './components/Analytics';
import GitInsights from './components/GitInsights';
import Goals from './components/Goals';
import AIInsights from './components/AIInsights';
import Profile from './components/Profile';
import AuthScreens from './components/AuthScreens';
import { AuthProvider, useAuth } from './AuthContext';
import './index.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'snapshots' | 'analytics' | 'git' | 'goals' | 'insights' | 'profile'>('dashboard');
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!user) {
    return <AuthScreens />;
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 selection:bg-indigo-500/30">
      <div className="flex h-screen overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col z-10 shadow-2xl">
          <div className="p-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2 tracking-tight">
              <Code2 className="text-indigo-400" />
              CodingTracker
            </h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity size={20} className={activeTab === 'dashboard' ? 'animate-pulse' : ''} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'history' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Clock size={20} />
              Activity History
            </button>
            <button
              onClick={() => setActiveTab('snapshots')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'snapshots' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode2 size={20} />
              Code Snapshots
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'analytics' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LineChart size={20} />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('git')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'git' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GitMerge size={20} />
              Git Insights
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'goals' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Target size={20} />
              Goals & Awards
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium relative group ${
                activeTab === 'insights' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Lightbulb size={20} className={activeTab === 'insights' ? 'text-amber-300' : 'text-purple-400 group-hover:text-amber-300 transition-colors'} />
              AI Insights
            </button>
          </div>

          <div className="p-4 border-t border-slate-800/50">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeTab === 'profile' 
                  ? 'bg-slate-800 text-white border border-slate-700' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <User size={20} />
              {user.displayName}
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto p-8">
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
    </div>
  );
}

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
