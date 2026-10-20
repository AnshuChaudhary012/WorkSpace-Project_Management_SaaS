import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import WorkspaceModal from './WorkspaceModal';
import ProjectModal from './ProjectModal';
import TaskModal from './TaskModal';
import workspaceService from '../services/workspaceService';
import projectService from '../services/projectService';
import { Loader2, Plus, Briefcase } from 'lucide-react';

export const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isWsModalOpen, setIsWsModalOpen] = useState(false);
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTaskProjectId, setActiveTaskProjectId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch workspaces on load
  const loadWorkspaces = useCallback(async () => {
    try {
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(data);

      if (data.length > 0) {
        // Restore last chosen workspace if present, or pick first
        const savedId = localStorage.getItem('active_workspace_id');
        const match = data.find((w) => w.id === savedId) || data[0];
        setCurrentWorkspace(match);
        localStorage.setItem('active_workspace_id', match.id);
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Load projects whenever currentWorkspace changes
  const loadProjects = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      setProjects([]);
      return;
    }
    try {
      const data = await projectService.getProjects(workspaceId);
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, []);

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadProjects(currentWorkspace.id);
    }
  }, [currentWorkspace, loadProjects]);

  const handleSelectWorkspace = (ws) => {
    setCurrentWorkspace(ws);
    localStorage.setItem('active_workspace_id', ws.id);
    loadProjects(ws.id);
  };

  const handleWorkspaceCreated = (newWs) => {
    setWorkspaces((prev) => [newWs, ...prev]);
    setCurrentWorkspace(newWs);
    localStorage.setItem('active_workspace_id', newWs.id);
    setProjects([]);
  };

  const handleProjectCreated = (newProj) => {
    setProjects((prev) => [newProj, ...prev]);
    navigate(`/projects/${newProj.id}`);
  };

  const handleOpenNewTask = (targetProjectId = null) => {
    const projId = targetProjectId || projects[0]?.id;
    if (projId) {
      setActiveTaskProjectId(projId);
      setIsTaskModalOpen(true);
    } else {
      setIsProjModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm font-medium">Loading your workspace...</p>
      </div>
    );
  }

  // If user has zero workspaces, prompt to create one
  if (!isLoading && workspaces.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-slate-800 shadow-2xl relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Create your first Workspace</h2>
          <p className="text-slate-400 text-xs mb-6">
            Workspaces organize your team, projects, sprints, and tasks in one place.
          </p>
          <button
            onClick={() => setIsWsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </button>
        </div>

        <WorkspaceModal
          isOpen={isWsModalOpen}
          onClose={() => setIsWsModalOpen(false)}
          onCreated={handleWorkspaceCreated}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenNewWorkspaceModal={() => setIsWsModalOpen(true)}
        onOpenNewProjectModal={() => setIsProjModalOpen(true)}
        projects={projects}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Topbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenNewTaskModal={() => handleOpenNewTask()}
          hasProjects={projects.length > 0}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet
            context={{
              currentWorkspace,
              projects,
              refreshProjects: () => loadProjects(currentWorkspace?.id),
              onOpenNewTaskModal: handleOpenNewTask,
              onOpenNewProjectModal: () => setIsProjModalOpen(true)
            }}
          />
        </main>
      </div>

      {/* Modals */}
      <WorkspaceModal
        isOpen={isWsModalOpen}
        onClose={() => setIsWsModalOpen(false)}
        onCreated={handleWorkspaceCreated}
      />

      <ProjectModal
        isOpen={isProjModalOpen}
        workspaceId={currentWorkspace?.id}
        onClose={() => setIsProjModalOpen(false)}
        onCreated={handleProjectCreated}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        projectId={activeTaskProjectId || projects[0]?.id}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={() => {
          if (currentWorkspace?.id) loadProjects(currentWorkspace.id);
        }}
      />
    </div>
  );
};

export default AppLayout;
