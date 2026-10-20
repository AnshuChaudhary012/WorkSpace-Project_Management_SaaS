import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, UserPlus, Shield, Trash2, Loader2, AlertCircle } from 'lucide-react';
import memberService from '../services/memberService';
import InviteMemberModal from '../components/InviteMemberModal';
import { useAuth } from '../context/AuthContext';

export const MembersPage = () => {
  const { currentWorkspace } = useOutletContext();
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const loadMembers = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      setIsLoading(true);
      const data = await memberService.getMembers(currentWorkspace.id);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      await memberService.updateMemberRole(currentWorkspace.id, memberId, newRole);
      setFeedbackMessage({ type: 'success', text: 'Member role updated successfully.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to update role.' });
      loadMembers();
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;

    try {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      await memberService.removeMember(currentWorkspace.id, memberId);
      setFeedbackMessage({ type: 'success', text: `${memberName} was removed.` });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to remove member.' });
      loadMembers();
    }
  };

  const isOwnerOrAdmin = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Team Members</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage who has access to <span className="text-slate-200 font-medium">{currentWorkspace?.name}</span> and their permission levels.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedbackMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
            <p className="text-xs">Loading members...</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Joined</th>
                {isOwnerOrAdmin && <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {members.map((m) => {
                const u = m.user;
                const isOwner = m.role === 'owner';
                const isSelf = u?.id === currentUser?.id || u?._id === currentUser?.id;

                return (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {u?.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{u?.name || 'Unnamed User'}</span>
                            {isSelf && (
                              <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">{u?.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isOwnerOrAdmin && !isOwner && !isSelf ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isOwner
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : m.role === 'admin'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isOwner && <Shield className="w-3 h-3" />}
                          <span>{m.role}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 hidden sm:table-cell text-slate-400 text-[11px]">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                    </td>

                    {isOwnerOrAdmin && (
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {!isOwner && !isSelf && (
                          <button
                            onClick={() => handleRemoveMember(m.id, u?.name || 'member')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        workspaceId={currentWorkspace?.id}
        onClose={() => setIsInviteModalOpen(false)}
        onMemberAdded={() => loadMembers()}
      />
    </div>
  );
};

export default MembersPage;
