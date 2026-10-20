const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Standalone in-memory project store for dev fallback
const devProjectStore = [];

// @desc    Get all projects in a workspace
// @route   GET /api/workspaces/:workspaceId/projects
// @access  Private (Workspace Member)
const getProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!isDbConnected()) {
      const { devTaskStore } = require('./taskController');
      const projects = devProjectStore.filter((p) => p.workspace === workspaceId);
      const withCounts = projects.map((p) => {
        const tasks = (devTaskStore || []).filter((t) => t.project === p.id);
        const totalTasks = tasks.length;
        const doneTasks = tasks.filter((t) => t.status === 'done').length;
        return {
          ...p,
          taskCount: totalTasks,
          completedTaskCount: doneTasks,
          progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
        };
      });

      return res.status(200).json({
        success: true,
        data: withCounts
      });
    }

    const projects = await Project.find({ workspace: workspaceId }).sort({ createdAt: -1 });

    // Calculate task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const doneTasks = await Task.countDocuments({ project: project._id, status: 'done' });
        const pObj = project.toJSON();
        return {
          ...pObj,
          taskCount: totalTasks,
          completedTaskCount: doneTasks,
          progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
        };
      })
    );

    res.status(200).json({
      success: true,
      data: projectsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new project in a workspace
// @route   POST /api/workspaces/:workspaceId/projects
// @access  Private (Workspace Member)
const createProject = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required and must be at least 2 characters long.'
      });
    }

    if (!isDbConnected()) {
      const newProj = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        workspace: workspaceId,
        name: name.trim(),
        description: (description || '').trim(),
        creator: userId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        taskCount: 0,
        completedTaskCount: 0,
        progress: 0
      };
      devProjectStore.push(newProj);

      return res.status(201).json({
        success: true,
        message: 'Project created successfully.',
        data: newProj
      });
    }

    const project = await Project.create({
      workspace: workspaceId,
      name: name.trim(),
      description: (description || '').trim(),
      creator: userId
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: {
        ...project.toJSON(),
        taskCount: 0,
        completedTaskCount: 0,
        progress: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:projectId
// @access  Private (Workspace Member)
const getProjectById = async (req, res, next) => {
  try {
    const project = req.project; // Attached by rbacMiddleware
    res.status(200).json({
      success: true,
      data: project.toJSON ? project.toJSON() : project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PATCH /api/projects/:projectId
// @access  Private (Workspace Member)
const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    if (!isDbConnected()) {
      const index = devProjectStore.findIndex((p) => p.id === projectId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      if (name) devProjectStore[index].name = name.trim();
      if (description !== undefined) devProjectStore[index].description = description.trim();
      if (status) devProjectStore[index].status = status;
      devProjectStore[index].updatedAt = new Date();

      return res.status(200).json({
        success: true,
        message: 'Project updated successfully.',
        data: devProjectStore[index]
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status) project.status = status;
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: project.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:projectId
// @access  Private (Workspace Member)
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!isDbConnected()) {
      const pIndex = devProjectStore.findIndex((p) => p.id === projectId);
      if (pIndex !== -1) devProjectStore.splice(pIndex, 1);

      const { devTaskStore } = require('./taskController');
      if (devTaskStore) {
        for (let i = devTaskStore.length - 1; i >= 0; i--) {
          if (devTaskStore[i].project === projectId) {
            devTaskStore.splice(i, 1);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Project and all associated tasks deleted successfully.'
      });
    }

    await Project.findByIdAndDelete(projectId);
    await Task.deleteMany({ project: projectId });

    res.status(200).json({
      success: true,
      message: 'Project and all associated tasks deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  devProjectStore
};
