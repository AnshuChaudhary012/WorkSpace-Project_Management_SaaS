import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, LogOut, CheckCircle2, Shield, User, Sparkles } from 'lucide-react';

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">WorkSpace</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-semibold">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-200">{user?.name}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stage 3 Foundation Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Your full-stack authentication, session restoration, and foundation API are operational.
          </p>
        </div>

        {/* Verification Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">Authentication</h3>
            </div>
            <p className="text-xs text-slate-400">
              Authenticated securely as <span className="text-slate-200 font-mono">{user?.email}</span> via JWT token.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">Role & Security</h3>
            </div>
            <p className="text-xs text-slate-400">
              Bcrypt salted hashing, sanitized validation, and centralized error handling active.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">Session Restored</h3>
            </div>
            <p className="text-xs text-slate-400">
              Protected routing verified. Reloading page automatically verifies session via <span className="text-slate-200 font-mono">/api/auth/me</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
