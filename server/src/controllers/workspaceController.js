const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { devMembershipStore } = require('../middleware/rbacMiddleware');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Standalone in-memory workspace store for dev fallback
const devWorkspaceStore = [];

// @desc    Get all workspaces for the current user
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!isDbConnected()) {
      const userMemberships = devMembershipStore.filter((m) => m.user === userId);
      const workspacesWithRole = userMemberships.map((m) => {
        const ws = devWorkspaceStore.find((w) => w.id === m.workspace);
        if (!ws) return null;
        return {
          ...ws,
          role: m.role,
          joinedAt: m.joinedAt
        };
      }).filter(Boolean);

      return res.status(200).json({
        success: true,
        data: workspacesWithRole
      });
    }

    const memberships = await Membership.find({ user: userId }).populate('workspace');
    const workspaces = memberships
      .filter((m) => m.workspace)
      .map((m) => {
        const wsObj = m.workspace.toJSON();
        return {
          ...wsObj,
          role: m.role,
          joinedAt: m.joinedAt
        };
      });

    res.status(200).json({
      success: true,
      data: workspaces
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required and must be at least 2 characters long.'
      });
    }

    if (!isDbConnected()) {
      const newWs = {
        id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        description: (description || '').trim(),
        owner: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      devWorkspaceStore.push(newWs);

      const membership = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        workspace: newWs.id,
        user: userId,
        role: 'owner',
        joinedAt: new Date()
      };
      devMembershipStore.push(membership);

      return res.status(201).json({
        success: true,
        message: 'Workspace created successfully.',
        data: {
          ...newWs,
          role: 'owner'
        }
      });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: (description || '').trim(),
      owner: userId
    });

    const membership = await Membership.create({
      workspace: workspace._id,
      user: userId,
      role: 'owner'
    });

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      data: {
        ...workspace.toJSON(),
        role: membership.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single workspace by ID
// @route   GET /api/workspaces/:workspaceId
// @access  Private (Workspace Member)
const getWorkspaceById = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!isDbConnected()) {
      const ws = devWorkspaceStore.find((w) => w.id === workspaceId);
      if (!ws) {
        return res.status(404).json({ success: false, message: 'Workspace not found.' });
      }
      return res.status(200).json({
        success: true,
        data: {
          ...ws,
          role: req.membership.role
        }
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        ...workspace.toJSON(),
        role: req.membership.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workspace settings
// @route   PATCH /api/workspaces/:workspaceId
// @access  Private (Owner only)
const updateWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    if (!isDbConnected()) {
      const index = devWorkspaceStore.findIndex((w) => w.id === workspaceId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Workspace not found.' });
      }
      if (name) devWorkspaceStore[index].name = name.trim();
      if (description !== undefined) devWorkspaceStore[index].description = description.trim();
      devWorkspaceStore[index].updatedAt = new Date();

      return res.status(200).json({
        success: true,
        message: 'Workspace updated successfully.',
        data: devWorkspaceStore[index]
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    if (name) workspace.name = name.trim();
    if (description !== undefined) workspace.description = description.trim();
    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully.',
      data: workspace.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:workspaceId
// @access  Private (Owner only)
const deleteWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!isDbConnected()) {
      const wsIndex = devWorkspaceStore.findIndex((w) => w.id === workspaceId);
      if (wsIndex !== -1) devWorkspaceStore.splice(wsIndex, 1);

      // Cascade remove memberships
      for (let i = devMembershipStore.length - 1; i >= 0; i--) {
        if (devMembershipStore[i].workspace === workspaceId) {
          devMembershipStore.splice(i, 1);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Workspace and all associated resources deleted successfully.'
      });
    }

    await Workspace.findByIdAndDelete(workspaceId);
    await Membership.deleteMany({ workspace: workspaceId });
    await Project.deleteMany({ workspace: workspaceId });
    await Task.deleteMany({ workspace: workspaceId });

    res.status(200).json({
      success: true,
      message: 'Workspace and all associated resources deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  devWorkspaceStore
};
