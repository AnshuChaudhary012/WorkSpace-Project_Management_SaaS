import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Flag,
  User,
  MessageSquare,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import taskService from '../services/taskService';
import commentService from '../services/commentService';
import { useAuth } from '../context/AuthContext';

const PRIORITY_BADGES = {
  low: { label: 'Low', class: 'bg-slate-800 text-slate-300' },
  medium: { label: 'Medium', class: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  high: { label: 'High', class: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  urgent: { label: 'Urgent', class: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold' },
};

export const TaskDetailModal = ({ isOpen, onClose, task, members = [], onTaskUpdated }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setAssignee(task.assignee?.id || task.assignee?._id || task.assignee || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      loadComments(task.id);
    }
    setError('');
  }, [task, isOpen]);

  const loadComments = async (taskId) => {
    try {
      const data = await commentService.getComments(taskId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  if (!isOpen || !task) return null;

  const handleSaveTaskDetails = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    try {
      setIsSavingTask(true);
      const updated = await taskService.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee: assignee || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
      });
      onTaskUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to update task.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const created = await commentService.createComment(task.id, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await commentService.deleteComment(task.id, commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      loadComments(task.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                PRIORITY_BADGES[priority]?.class || 'bg-slate-800 text-slate-300'
              }`}
            >
              {PRIORITY_BADGES[priority]?.label || priority}
            </span>
            <span className="text-xs text-slate-400 capitalize">• {status.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveTaskDetails}
              disabled={isSavingTask}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSavingTask && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none pb-1 transition-colors"
              placeholder="Task Title"
            />

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task details, acceptance criteria, notes..."
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Property Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Status</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Flag className="w-3 h-3 text-amber-400" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-violet-400" />
                <span>Assignee</span>
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => {
                  const u = m.user;
                  return (
                    <option key={u?.id || m.id} value={u?.id || m.user}>
                      {u?.name || 'Member'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Comments Thread Section */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Discussion & Activity ({comments.length})
              </h3>
            </div>

            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No comments yet. Start the conversation below.
                </p>
              ) : (
                comments.map((comment) => {
                  const author = comment.author;
                  const isAuthor =
                    author?.id === user?.id || comment.author === user?.id;

                  return (
                    <div
                      key={comment.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {author?.name ? author.name[0].toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-200">
                            {author?.name || 'User'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">
                              {new Date(comment.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isAuthor && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-slate-500 hover:text-rose-400 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
