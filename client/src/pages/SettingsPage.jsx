import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Settings, Trash2, AlertTriangle, Check, Loader2 } from 'lucide-react';
import workspaceService from '../services/workspaceService';

export const SettingsPage = () => {
  const { currentWorkspace } = useOutletContext();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name || '');
      setDescription(currentWorkspace.description || '');
    }
  }, [currentWorkspace]);

  const isOwner = currentWorkspace?.role === 'owner';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      await workspaceService.updateWorkspace(currentWorkspace.id, {
        name: name.trim(),
        description: description.trim()
      });
      setStatusMessage({ type: 'success', text: 'Workspace settings saved successfully.' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update workspace.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmation = window.prompt(
      `To confirm deletion, type "${currentWorkspace.name}" below:`
    );

    if (confirmation !== currentWorkspace.name) {
      alert('Workspace name did not match. Deletion cancelled.');
      return;
    }

    try {
      setIsDeleting(true);
      await workspaceService.deleteWorkspace(currentWorkspace.id);
      localStorage.removeItem('active_workspace_id');
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.message || 'Failed to delete workspace.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Workspace Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage general settings and preferences for{' '}
          <span className="text-slate-200 font-medium">{currentWorkspace?.name}</span>.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* General Settings Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-200">General Information</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              required
              disabled={!isOwner}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              disabled={!isOwner}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-none"
            />
          </div>

          {isOwner && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Danger Zone (Owner Only) */}
      {isOwner && (
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-300">Danger Zone</h3>
              <p className="text-xs text-slate-400 mt-1">
                Permanently delete this workspace and all associated projects, tasks, and comments. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
