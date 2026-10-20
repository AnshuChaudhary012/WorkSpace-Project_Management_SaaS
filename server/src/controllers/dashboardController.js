const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Membership = require('../models/Membership');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get dashboard metrics and analytics for a workspace
// @route   GET /api/workspaces/:workspaceId/dashboard
// @access  Private (Workspace Member)
const getDashboardMetrics = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const now = new Date();
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (!isDbConnected()) {
      const { devTaskStore } = require('./taskController');
      const { devProjectStore } = require('./projectController');
      const { devMembershipStore } = require('../middleware/rbacMiddleware');

      const tasks = (devTaskStore || []).filter((t) => t.workspace === workspaceId);
      const projects = (devProjectStore || []).filter((p) => p.workspace === workspaceId);
      const members = (devMembershipStore || []).filter((m) => m.workspace === workspaceId);

      const statusCounts = {
        todo: tasks.filter((t) => t.status === 'todo').length,
        in_progress: tasks.filter((t) => t.status === 'in_progress').length,
        in_review: tasks.filter((t) => t.status === 'in_review').length,
        done: tasks.filter((t) => t.status === 'done').length
      };

      const priorityCounts = {
        urgent: tasks.filter((t) => t.priority === 'urgent').length,
        high: tasks.filter((t) => t.priority === 'high').length,
        medium: tasks.filter((t) => t.priority === 'medium').length,
        low: tasks.filter((t) => t.priority === 'low').length
      };

      const overdueTasks = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
      );

      const upcomingTasks = tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) >= now &&
          new Date(t.dueDate) <= sevenDaysFromNow &&
          t.status !== 'done'
      );

      const totalTasks = tasks.length;
      const completedTasks = statusCounts.done;
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return res.status(200).json({
        success: true,
        data: {
          totalTasks,
          completedTasks,
          overallProgress,
          totalProjects: projects.length,
          totalMembers: members.length,
          statusCounts,
          priorityCounts,
          overdueCount: overdueTasks.length,
          overdueTasks,
          upcomingTasks
        }
      });
    }

    const [tasks, totalProjects, totalMembers] = await Promise.all([
      Task.find({ workspace: workspaceId }).populate('project', 'name'),
      Project.countDocuments({ workspace: workspaceId }),
      Membership.countDocuments({ workspace: workspaceId })
    ]);

    const statusCounts = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
    const overdueTasks = [];
    const upcomingTasks = [];

    tasks.forEach((task) => {
      if (statusCounts[task.status] !== undefined) statusCounts[task.status]++;
      if (priorityCounts[task.priority] !== undefined) priorityCounts[task.priority]++;

      if (task.dueDate && task.status !== 'done') {
        const taskDue = new Date(task.dueDate);
        if (taskDue < now) {
          overdueTasks.push(task.toJSON());
        } else if (taskDue <= sevenDaysFromNow) {
          upcomingTasks.push(task.toJSON());
        }
      }
    });

    const totalTasks = tasks.length;
    const completedTasks = statusCounts.done;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        overallProgress,
        totalProjects,
        totalMembers,
        statusCounts,
        priorityCounts,
        overdueCount: overdueTasks.length,
        overdueTasks,
        upcomingTasks
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics
};
