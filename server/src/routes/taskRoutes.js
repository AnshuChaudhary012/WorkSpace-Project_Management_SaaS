const express = require('express');
const router = express.Router();
const {
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const commentRoutes = require('./commentRoutes');
const { authenticate } = require('../middleware/authMiddleware');
const { requireWorkspaceMember } = require('../middleware/rbacMiddleware');

router.use(authenticate);

// Nested comments route
router.use('/:taskId/comments', commentRoutes);

router.route('/:taskId')
  .get(requireWorkspaceMember(['owner', 'admin', 'member']), getTaskById)
  .patch(requireWorkspaceMember(['owner', 'admin', 'member']), updateTask)
  .delete(requireWorkspaceMember(['owner', 'admin', 'member']), deleteTask);

module.exports = router;
