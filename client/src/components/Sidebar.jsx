import React, { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  FolderKanban,
  Plus,
  ChevronDown,
  Check,
  Briefcase,
  Hash,
  ShieldAlert,
  X
} from 'lucide-react';

export const Sidebar = ({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onOpenNewWorkspaceModal,
  onOpenNewProjectModal,
  projects = [],
  isMobileOpen,
  setIsMobileOpen
}) => {
  const navigate = useNavigate();
  const { projectId: activeProjectId } = useParams();
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);

  const handleSelectWs = (ws) => {
    onSelectWorkspace(ws);
    setIsWsDropdownOpen(false);
    navigate('/dashboard');
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Workspace Switcher */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold tracking-tight text-white text-base">WorkSpace</span>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Switcher Selector */}
          <div className="relative">
            <button
              onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {currentWorkspace?.name ? currentWorkspace.name[0].toUpperCase() : 'W'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </p>
                  <span className="inline-block uppercase tracking-wider text-[10px] font-medium text-indigo-400">
                    {currentWorkspace?.role || 'Member'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>

            {isWsDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Your Workspaces
                </p>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => handleSelectWs(ws)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                        currentWorkspace?.id === ws.id
                          ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {currentWorkspace?.id === ws.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 mt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsWsDropdownOpen(false);
                      onOpenNewWorkspaceModal();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            <NavLink to="/dashboard" className={navClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/projects" className={navClass}>
              <FolderKanban className="w-4 h-4" />
              <span>All Projects</span>
            </NavLink>
          </div>

          {/* Quick Projects List */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Projects ({projects.length})
              </span>
              <button
                onClick={onOpenNewProjectModal}
                className="p-1 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-slate-900 transition-colors"
                title="Create Project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.length === 0 ? (
                <div className="px-2 py-3 rounded-lg border border-dashed border-slate-800 text-center">
                  <p className="text-xs text-slate-500 mb-1.5">No projects yet</p>
                  <button
                    onClick={onOpenNewProjectModal}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    + Create one
                  </button>
                </div>
              ) : (
                projects.map((proj) => {
                  const isActive = activeProjectId === proj.id;
                  return (
                    <NavLink
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Hash className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      {proj.taskCount !== undefined && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {proj.taskCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Workspace Footer Info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{currentWorkspace?.name || 'No Workspace'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
