const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getComments,
  createComment,
  deleteComment
} = require('../controllers/commentController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireWorkspaceMember } = require('../middleware/rbacMiddleware');

router.use(authenticate);
router.use(requireWorkspaceMember(['owner', 'admin', 'member']));

router.route('/')
  .get(getComments)
  .post(createComment);

router.route('/:commentId')
  .delete(deleteComment);

module.exports = router;
