const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Task = require('../models/Task');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Standalone in-memory comment store for dev fallback
const devCommentStore = [];

// @desc    Get all comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private (Workspace Member)
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!isDbConnected()) {
      const { devUserStore } = require('./authController');
      const comments = devCommentStore.filter((c) => c.task === taskId);
      const populated = comments.map((c) => {
        const author = (devUserStore || []).find((u) => u.id === c.author);
        return {
          ...c,
          author: author ? { id: author.id, name: author.name, email: author.email } : { id: c.author, name: 'User' }
        };
      });

      return res.status(200).json({
        success: true,
        data: populated
      });
    }

    const comments = await Comment.find({ task: taskId })
      .populate('author', 'name email avatarUrl')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: comments.map((c) => c.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new comment on a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private (Workspace Member)
const createComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.'
      });
    }

    if (!isDbConnected()) {
      const { devUserStore } = require('./authController');
      const author = (devUserStore || []).find((u) => u.id === userId);

      const newComment = {
        id: `com_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        task: taskId,
        author: userId,
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      devCommentStore.push(newComment);

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully.',
        data: {
          ...newComment,
          author: author ? { id: author.id, name: author.name, email: author.email } : { id: userId, name: req.user.name }
        }
      });
    }

    const comment = await Comment.create({
      task: taskId,
      author: userId,
      content: content.trim()
    });

    const populated = await Comment.findById(comment._id).populate('author', 'name email avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: populated.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/tasks/:taskId/comments/:commentId
// @access  Private (Author or Workspace Admin/Owner)
const deleteComment = async (req, res, next) => {
  try {
    const { taskId, commentId } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const userRole = req.membership?.role;

    if (!isDbConnected()) {
      const index = devCommentStore.findIndex((c) => c.id === commentId && c.task === taskId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Comment not found.' });
      }

      const comment = devCommentStore[index];
      if (comment.author !== userId && userRole !== 'owner' && userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
      }

      devCommentStore.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Comment deleted.' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.task.toString() !== taskId) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (comment.author.toString() !== userId && userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  createComment,
  deleteComment,
  devCommentStore
};
