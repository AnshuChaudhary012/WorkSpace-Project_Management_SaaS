import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { FolderKanban, Plus, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export const ProjectsPage = () => {
  const { currentWorkspace, projects, onOpenNewProjectModal } = useOutletContext();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Projects</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage engineering initiatives and sprints in{' '}
            <span className="text-slate-200 font-medium">{currentWorkspace?.name}</span>.
          </p>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1.5">No projects yet</h3>
          <p className="text-xs text-slate-400 mb-6">
            Create your first project to start organizing tasks, setting deadlines, and tracking progress.
          </p>
          <button
            onClick={onOpenNewProjectModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="glass-panel group p-5 rounded-2xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <div className="p-1 rounded-lg text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[2rem]">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div>
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-semibold text-slate-200">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Footer stats */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{project.completedTaskCount || 0} / {project.taskCount || 0} tasks done</span>
                  </span>
                  <span className="capitalize px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                    {project.status || 'active'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
