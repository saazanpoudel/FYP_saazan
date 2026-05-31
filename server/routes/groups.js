const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const { Chat } = require('../models/Chat');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

const router = express.Router();

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private (Tourist)
router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Group name is required'),
    body('maxMembers').optional().isInt({ min: 2, max: 50 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const { name, description, destination, startDate, endDate, maxMembers, isPublic } = req.body;

      const group = await Group.create({
        name,
        description,
        destination,
        startDate,
        endDate,
        maxMembers: maxMembers || 20,
        isPublic: isPublic !== undefined ? isPublic : true,
        creator: req.user._id,
        members: [
          {
            user: req.user._id,
            role: 'admin',
          },
        ],
      });

      // Create a corresponding chat room for the group
      await Chat.create({
        participants: [req.user._id],
        type: 'group',
        groupId: group._id,
      });

      const populatedGroup = await Group.findById(group._id)
        .populate('creator', 'name email avatar')
        .populate('members.user', 'name email avatar');

      res.status(201).json({
        success: true,
        group: populatedGroup,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/groups
// @desc    Get all public groups or user's groups
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type = 'public' } = req.query;
    let query = {};

    if (type === 'my-groups') {
      query = {
        $or: [
          { creator: req.user._id },
          { 'members.user': req.user._id },
        ],
      };
    } else {
      query = { isPublic: true, status: { $ne: 'completed' } };
    }

    const groups = await Group.find(query)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if user has access
    if (!group.isPublic) {
      const isMember = group.members.some(
        (member) => member.user._id.toString() === req.user._id.toString()
      );
      if (!isMember && group.creator._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if already a member
    const isMember = group.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group',
      });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is full',
      });
    }

    group.members.push({
      user: req.user._id,
      role: 'member',
    });

    await group.save();

    // Update the corresponding chat room's participants
    const chat = await Chat.findOne({ groupId: group._id, type: 'group' });
    if (chat) {
      if (!chat.participants.includes(req.user._id)) {
        chat.participants.push(req.user._id);
        await chat.save();
      }
    } else {
      // Create if it doesn't exist for some reason
      await Chat.create({
        participants: [group.creator, req.user._id],
        type: 'group',
        groupId: group._id,
      });
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`group-${group._id}`).emit('member-joined', {
        user: req.user,
        group: populatedGroup,
      });
    }

    // Notify group creator when someone joins
    if (group.creator.toString() !== req.user._id.toString()) {
      await createNotification(req.app, {
        recipient: group.creator,
        sender: req.user._id,
        type: 'group',
        title: 'New Member Joined Your Group',
        message: `${req.user.name} has joined your group "${group.name}". The group now has ${populatedGroup.members.length} member(s).`,
        extraData: { groupId: group._id }
      });
    }

    res.json({
      success: true,
      group: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if user is the creator
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Creator cannot leave the group. Transfer ownership or delete the group instead.',
      });
    }

    group.members = group.members.filter(
      (member) => member.user.toString() !== req.user._id.toString()
    );

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`group-${group._id}`).emit('member-left', {
        userId: req.user._id,
        group: populatedGroup,
      });
    }

    res.json({
      success: true,
      group: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check permissions: Admin, Creator, or Member with role 'admin'
    const isCreator = group.creator.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === 'admin';
    const isGroupAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isCreator && !isAdminUser && !isGroupAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this group',
      });
    }

    // Delete associated chat
    await Chat.deleteOne({ groupId: group._id, type: 'group' });

    // Delete the group
    await Group.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;

