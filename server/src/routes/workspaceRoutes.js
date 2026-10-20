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
const {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember
} = require('../controllers/memberController');
const { getDashboardMetrics } = require('../controllers/dashboardController');
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

// Dashboard metrics for workspace
router.route('/:workspaceId/dashboard')
  .get(requireWorkspaceMember(['owner', 'admin', 'member']), getDashboardMetrics);

// Nested project routes under workspace
router.route('/:workspaceId/projects')
  .get(requireWorkspaceMember(['owner', 'admin', 'member']), getProjects)
  .post(requireWorkspaceMember(['owner', 'admin', 'member']), createProject);

// Member management routes under workspace
router.route('/:workspaceId/members')
  .get(requireWorkspaceMember(['owner', 'admin', 'member']), getMembers)
  .post(requireWorkspaceMember(['owner', 'admin']), addMember);

router.route('/:workspaceId/members/:memberId')
  .patch(requireWorkspaceMember(['owner', 'admin']), updateMemberRole)
  .delete(requireWorkspaceMember(['owner', 'admin', 'member']), removeMember);

module.exports = router;
