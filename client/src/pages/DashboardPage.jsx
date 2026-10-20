import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Briefcase,
  AlertTriangle,
  Calendar,
  Users,
  Flag,
  Loader2
} from 'lucide-react';
import dashboardService from '../services/dashboardService';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { currentWorkspace, projects, onOpenNewProjectModal } = useOutletContext();

  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      setIsLoading(true);
      const data = await dashboardService.getDashboardMetrics(currentWorkspace.id);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm">Calculating workspace analytics...</p>
      </div>
    );
  }

  const totalTasks = metrics?.totalTasks || 0;
  const completedTasks = metrics?.completedTasks || 0;
  const overallProgress = metrics?.overallProgress || 0;
  const overdueCount = metrics?.overdueCount || 0;
  const statusCounts = metrics?.statusCounts || { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  const overdueTasks = metrics?.overdueTasks || [];
  const upcomingTasks = metrics?.upcomingTasks || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Workspace: {currentWorkspace?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here is your live project progress, overdue alerts, and sprint velocity.
          </p>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Projects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{projects.length}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{totalTasks}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Completed Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{completedTasks}</p>
        </div>

        <div className={`glass-panel p-5 rounded-2xl border shadow-lg ${
          overdueCount > 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Overdue Tasks</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              overdueCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${overdueCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {overdueCount}
          </p>
        </div>
      </div>

      {/* Status Breakdown & Velocity Progress */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Workspace Completion & Status Distribution</span>
          </h2>
          <span className="text-xs font-bold text-indigo-400">{overallProgress}% Done</span>
        </div>

        {/* Global Progress bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">To Do</p>
            <p className="text-base font-bold text-slate-200">{statusCounts.todo}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-center">
            <p className="text-[10px] uppercase font-semibold text-indigo-400 mb-1">In Progress</p>
            <p className="text-base font-bold text-indigo-300">{statusCounts.in_progress}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 text-center">
            <p className="text-[10px] uppercase font-semibold text-amber-400 mb-1">In Review</p>
            <p className="text-base font-bold text-amber-300">{statusCounts.in_review}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-center">
            <p className="text-[10px] uppercase font-semibold text-emerald-400 mb-1">Done</p>
            <p className="text-base font-bold text-emerald-300">{statusCounts.done}</p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Overdue & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks Alert List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Overdue Tasks ({overdueTasks.length})</span>
            </h3>
          </div>

          {overdueTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              All tasks are on track! No overdue deadlines.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {overdueTasks.map((t) => (
                <Link
                  key={t.id}
                  to={`/projects/${t.project?.id || t.project}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                >
                  <span className="text-xs font-medium text-slate-200 truncate">{t.title}</span>
                  <span className="text-[10px] font-mono text-rose-400 flex-shrink-0">
                    Due: {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines (Next 7 days) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming Deadlines (Next 7 Days)</span>
            </h3>
          </div>

          {upcomingTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No tasks due in the next 7 days.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {upcomingTasks.map((t) => (
                <Link
                  key={t.id}
                  to={`/projects/${t.project?.id || t.project}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                >
                  <span className="text-xs font-medium text-slate-200 truncate">{t.title}</span>
                  <span className="text-[10px] font-mono text-amber-400 flex-shrink-0">
                    Due: {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Projects List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white tracking-tight">Active Projects</h2>
          <Link
            to="/projects"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-3">You don't have any projects in this workspace yet.</p>
            <button
              onClick={onOpenNewProjectModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((proj) => (
              <Link
                key={proj.id}
                to={`/projects/${proj.id}`}
                className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xs font-semibold text-white truncate mb-1">{proj.name}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                    {proj.description || 'No description'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>{proj.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${proj.progress || 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
