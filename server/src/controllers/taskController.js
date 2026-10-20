const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Standalone in-memory task store for dev fallback
const devTaskStore = [];

// @desc    Get all tasks for a project (with filtering & search)
// @route   GET /api/projects/:projectId/tasks
// @access  Private (Workspace Member)
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee, search } = req.query;

    if (!isDbConnected()) {
      let filtered = devTaskStore.filter((t) => t.project === projectId);

      if (status) {
        filtered = filtered.filter((t) => t.status === status);
      }
      if (priority) {
        filtered = filtered.filter((t) => t.priority === priority);
      }
      if (assignee) {
        filtered = filtered.filter((t) => t.assignee === assignee);
      }
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        );
      }

      // Sort by order ascending, then createdAt descending
      filtered.sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(b.createdAt) - new Date(a.createdAt));

      const { devUserStore } = require('./authController');
      const populated = filtered.map((t) => {
        const u = t.assignee ? (devUserStore || []).find((user) => user.id === t.assignee) : null;
        return {
          ...t,
          assignee: u ? { id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl } : null
        };
      });

      return res.status(200).json({
        success: true,
        data: populated
      });
    }

    const filter = { project: projectId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatarUrl')
      .populate('creator', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks.map((t) => t.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task in a project
// @route   POST /api/projects/:projectId/tasks
// @access  Private (Workspace Member)
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, assignee, dueDate, status } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const workspaceId = req.workspaceId;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.'
      });
    }

    if (!isDbConnected()) {
      const existingProjectTasks = devTaskStore.filter((t) => t.project === projectId);
      const newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        project: projectId,
        workspace: workspaceId,
        title: title.trim(),
        description: (description || '').trim(),
        status: status || 'todo',
        priority: priority || 'medium',
        assignee: assignee || null,
        creator: userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        order: existingProjectTasks.length,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      devTaskStore.push(newTask);

      return res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: newTask
      });
    }

    const count = await Task.countDocuments({ project: projectId, status: status || 'todo' });

    const task = await Task.create({
      project: projectId,
      workspace: workspaceId,
      title: title.trim(),
      description: (description || '').trim(),
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || null,
      creator: userId,
      dueDate: dueDate || null,
      order: count
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatarUrl')
      .populate('creator', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: populatedTask.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:taskId
// @access  Private (Workspace Member)
const getTaskById = async (req, res, next) => {
  try {
    const task = req.task; // Attached by rbacMiddleware
    res.status(200).json({
      success: true,
      data: task.toJSON ? task.toJSON() : task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task fields (status, priority, assignee, order, etc.)
// @route   PATCH /api/tasks/:taskId
// @access  Private (Workspace Member)
const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignee, dueDate, order } = req.body;

    if (!isDbConnected()) {
      const index = devTaskStore.findIndex((t) => t.id === taskId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      if (title !== undefined) devTaskStore[index].title = title.trim();
      if (description !== undefined) devTaskStore[index].description = description.trim();
      if (status !== undefined) devTaskStore[index].status = status;
      if (priority !== undefined) devTaskStore[index].priority = priority;
      if (assignee !== undefined) devTaskStore[index].assignee = assignee;
      if (dueDate !== undefined) devTaskStore[index].dueDate = dueDate ? new Date(dueDate) : null;
      if (order !== undefined) devTaskStore[index].order = Number(order);
      devTaskStore[index].updatedAt = new Date();

      return res.status(200).json({
        success: true,
        message: 'Task updated successfully.',
        data: devTaskStore[index]
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (order !== undefined) task.order = Number(order);

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignee', 'name email avatarUrl')
      .populate('creator', 'name email');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: updatedTask.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:taskId
// @access  Private (Workspace Member)
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!isDbConnected()) {
      const index = devTaskStore.findIndex((t) => t.id === taskId);
      if (index !== -1) devTaskStore.splice(index, 1);

      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully.'
      });
    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  devTaskStore
};
