const express = require('express');
const router = express.Router();
const {
  getWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace
} = require('../controllers/workspaceController');
const { getProjects, createProject } = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireWorkspaceMember } = require('../middleware/rbacMiddleware');

// Base workspace routes
router.use(authenticate);

router.route('/')
  .get(getWorkspaces)
  .post(createWorkspace);

router.route('/:workspaceId')
  .get(requireWorkspaceMember(['owner', 'admin', 'member']), getWorkspaceById)
  .patch(requireWorkspaceMember(['owner']), updateWorkspace)
  .delete(requireWorkspaceMember(['owner']), deleteWorkspace);

// Nested project routes under workspace
router.route('/:workspaceId/projects')
  .get(requireWorkspaceMember(['owner', 'admin', 'member']), getProjects)
  .post(requireWorkspaceMember(['owner', 'admin', 'member']), createProject);

module.exports = router;
