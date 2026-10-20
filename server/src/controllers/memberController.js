const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const User = require('../models/User');
const { devMembershipStore } = require('../middleware/rbacMiddleware');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all members of a workspace
// @route   GET /api/workspaces/:workspaceId/members
// @access  Private (Workspace Member)
const getMembers = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!isDbConnected()) {
      const { devUserStore } = require('./authController');
      const wsMembers = devMembershipStore.filter((m) => m.workspace === workspaceId);
      const populated = wsMembers.map((m) => {
        const u = (devUserStore || []).find((user) => user.id === m.user);
        return {
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt,
          user: u ? { id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl } : { id: m.user, name: 'User' }
        };
      });

      return res.status(200).json({
        success: true,
        data: populated
      });
    }

    const memberships = await Membership.find({ workspace: workspaceId })
      .populate('user', 'name email avatarUrl')
      .sort({ joinedAt: 1 });

    const formatted = memberships.map((m) => {
      const mObj = m.toJSON();
      return {
        id: mObj.id,
        role: mObj.role,
        joinedAt: mObj.joinedAt,
        user: m.user
      };
    });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add / invite member to workspace
// @route   POST /api/workspaces/:workspaceId/members
// @access  Private (Owner / Admin)
const addMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid user email is required.'
      });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'member';

    if (!isDbConnected()) {
      const { devUserStore } = require('./authController');
      const targetUser = devUserStore.find((u) => u.email === email.trim().toLowerCase());

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: `No user found with email ${email}. They must create an account first.`
        });
      }

      const existingMember = devMembershipStore.find(
        (m) => m.workspace === workspaceId && m.user === targetUser.id
      );

      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: 'User is already a member of this workspace.'
        });
      }

      const newMembership = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        workspace: workspaceId,
        user: targetUser.id,
        role: assignedRole,
        joinedAt: new Date()
      };
      devMembershipStore.push(newMembership);

      return res.status(201).json({
        success: true,
        message: 'Member added to workspace successfully.',
        data: {
          id: newMembership.id,
          role: newMembership.role,
          joinedAt: newMembership.joinedAt,
          user: { id: targetUser.id, name: targetUser.name, email: targetUser.email }
        }
      });
    }

    const targetUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: `No user found with email ${email}. They must create an account first.`
      });
    }

    const existingMember = await Membership.findOne({
      workspace: workspaceId,
      user: targetUser._id
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this workspace.'
      });
    }

    const membership = await Membership.create({
      workspace: workspaceId,
      user: targetUser._id,
      role: assignedRole
    });

    res.status(201).json({
      success: true,
      message: 'Member added to workspace successfully.',
      data: {
        id: membership._id.toString(),
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: { id: targetUser._id.toString(), name: targetUser.name, email: targetUser.email }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member role
// @route   PATCH /api/workspaces/:workspaceId/members/:memberId
// @access  Private (Owner / Admin)
const updateMemberRole = async (req, res, next) => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "admin" or "member".'
      });
    }

    if (!isDbConnected()) {
      const member = devMembershipStore.find(
        (m) => (m.id === memberId || m.user === memberId) && m.workspace === workspaceId
      );
      if (!member) {
        return res.status(404).json({ success: false, message: 'Membership not found.' });
      }

      if (member.role === 'owner') {
        return res.status(400).json({ success: false, message: 'Cannot modify the workspace owner role.' });
      }

      member.role = role;
      return res.status(200).json({
        success: true,
        message: 'Member role updated successfully.',
        data: member
      });
    }

    const member = await Membership.findById(memberId);
    if (!member || member.workspace.toString() !== workspaceId) {
      return res.status(404).json({ success: false, message: 'Membership not found.' });
    }

    if (member.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Cannot modify the workspace owner role.' });
    }

    member.role = role;
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully.',
      data: member.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from workspace
// @route   DELETE /api/workspaces/:workspaceId/members/:memberId
// @access  Private (Owner / Admin or Self-leave)
const removeMember = async (req, res, next) => {
  try {
    const { workspaceId, memberId } = req.params;
    const currentUserId = req.user._id ? req.user._id.toString() : req.user.id;
    const currentUserRole = req.membership.role;

    if (!isDbConnected()) {
      const index = devMembershipStore.findIndex(
        (m) => (m.id === memberId || m.user === memberId) && m.workspace === workspaceId
      );
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Membership not found.' });
      }

      const member = devMembershipStore[index];
      if (member.role === 'owner') {
        return res.status(400).json({ success: false, message: 'Workspace owner cannot be removed.' });
      }

      // Check permission: Owner, Admin (cannot remove other admins), or Self
      const isSelf = member.user === currentUserId;
      if (!isSelf && currentUserRole !== 'owner' && currentUserRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
      }

      devMembershipStore.splice(index, 1);
      return res.status(200).json({
        success: true,
        message: 'Member removed from workspace successfully.'
      });
    }

    const member = await Membership.findById(memberId);
    if (!member || member.workspace.toString() !== workspaceId) {
      return res.status(404).json({ success: false, message: 'Membership not found.' });
    }

    if (member.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Workspace owner cannot be removed.' });
    }

    const isSelf = member.user.toString() === currentUserId;
    if (!isSelf && currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }

    await Membership.findByIdAndDelete(memberId);

    res.status(200).json({
      success: true,
      message: 'Member removed from workspace successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember
};
