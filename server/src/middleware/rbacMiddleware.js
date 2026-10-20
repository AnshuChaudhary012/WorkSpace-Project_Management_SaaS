const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const Project = require('../models/Project');
const Task = require('../models/Task');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Standalone in-memory membership store for development fallback
const devMembershipStore = [];

const requireWorkspaceMember = (allowedRoles = ['owner', 'admin', 'member']) => {
  return async (req, res, next) => {
    try {
      let workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

      // If workspaceId is not in params/body, infer it from projectId or taskId
      if (!workspaceId) {
        if (req.params.projectId) {
          if (isDbConnected()) {
            const project = await Project.findById(req.params.projectId);
            if (!project) {
              return res.status(404).json({ success: false, message: 'Project not found' });
            }
            workspaceId = project.workspace.toString();
            req.project = project;
          } else {
            const { devProjectStore } = require('../controllers/projectController');
            const project = devProjectStore.find((p) => p.id === req.params.projectId);
            if (!project) {
              return res.status(404).json({ success: false, message: 'Project not found' });
            }
            workspaceId = project.workspace;
            req.project = project;
          }
        } else if (req.params.taskId) {
          if (isDbConnected()) {
            const task = await Task.findById(req.params.taskId);
            if (!task) {
              return res.status(404).json({ success: false, message: 'Task not found' });
            }
            workspaceId = task.workspace.toString();
            req.task = task;
          } else {
            const { devTaskStore } = require('../controllers/taskController');
            const task = devTaskStore.find((t) => t.id === req.params.taskId);
            if (!task) {
              return res.status(404).json({ success: false, message: 'Task not found' });
            }
            workspaceId = task.workspace;
            req.task = task;
          }
        }
      }

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workspace context is required for this operation.'
        });
      }

      const userId = req.user._id ? req.user._id.toString() : req.user.id;
      let membership = null;

      if (isDbConnected()) {
        membership = await Membership.findOne({
          workspace: workspaceId,
          user: userId
        });
      } else {
        membership = devMembershipStore.find(
          (m) => m.workspace === workspaceId && m.user === userId
        );
      }

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this workspace.'
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Requires one of: ${allowedRoles.join(', ')}.`
        });
      }

      req.membership = membership;
      req.workspaceId = workspaceId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireWorkspaceMember,
  devMembershipStore
};
