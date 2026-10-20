const express = require('express');
const router = express.Router();
const {
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { getTasks, createTask } = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireWorkspaceMember } = require('../middleware/rbacMiddleware');

router.use(authenticate);

router.route('/:projectId')
  .get(requireWorkspaceMember(['owner', 'admin', 'member']), getProjectById)
  .patch(requireWorkspaceMember(['owner', 'admin', 'member']), updateProject)
  .delete(requireWorkspaceMember(['owner', 'admin', 'member']), deleteProject);

// Nested tasks under project
router.route('/:projectId/tasks')
  .get(requireWorkspaceMember(['owner', 'admin', 'member']), getTasks)
  .post(requireWorkspaceMember(['owner', 'admin', 'member']), createTask);

module.exports = router;
