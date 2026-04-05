const express = require('express');
const { body, validationResult } = require('express-validator');
const { Chat, Message } = require('../models/Chat');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat
// @desc    Get user's chats
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email avatar role')
      .populate('lastMessage')
      .populate('groupId', 'name')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      count: chats.length,
      chats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/chat
// @desc    Create or get chat
// @access  Private
router.post(
  '/',
  protect,
  [body('participant').notEmpty().withMessage('Participant ID is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const { participant, groupId, bookingId } = req.body;

      if (bookingId) {
        // Chat specifically for a booking
        let chat = await Chat.findOne({ bookingId })
          .populate('participants', 'name email avatar role')
          .populate('bookingId', 'startDate endDate status package')
          .populate({
            path: 'bookingId',
            populate: { path: 'package', select: 'title duration' }
          });

        if (!chat) {
          const participants = [req.user._id, participant].sort();
          chat = await Chat.create({
            participants,
            bookingId,
            type: 'private'
          });
          
          chat = await Chat.findById(chat._id)
            .populate('participants', 'name email avatar role')
            .populate('bookingId', 'startDate endDate status package')
            .populate({
              path: 'bookingId',
              populate: { path: 'package', select: 'title duration' }
            });
        }

        return res.json({
          success: true,
          chat
        });
      }

      if (groupId) {
        // Group chat
        let chat = await Chat.findOne({ groupId, type: 'group' });

        if (!chat) {
          chat = await Chat.create({
            participants: [req.user._id],
            type: 'group',
            groupId,
          });
        }

        const populatedChat = await Chat.findById(chat._id)
          .populate('participants', 'name email avatar')
          .populate('groupId', 'name');

        return res.json({
          success: true,
          chat: populatedChat,
        });
      } else {
        // Private chat
        const participants = [req.user._id, participant].sort();
        let chat = await Chat.findOne({
          participants: { $all: participants },
          type: 'private',
        });

        if (!chat) {
          chat = await Chat.create({
            participants,
            type: 'private',
          });
        }

        const populatedChat = await Chat.findById(chat._id)
          .populate('participants', 'name email avatar role');

        res.json({
          success: true,
          chat: populatedChat,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/chat/:id/messages
// @desc    Get chat messages
// @access  Private
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ chat: chat._id })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        chat: chat._id,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date(),
          },
        },
        $set: { isRead: true },
      }
    );

    res.json({
      success: true,
      count: messages.length,
      messages: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/chat/:id/messages
// @desc    Send a message
// @access  Private
router.post(
  '/:id/messages',
  protect,
  [body('content').notEmpty().withMessage('Message content is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const chat = await Chat.findById(req.params.id);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found',
        });
      }

      // Check if user is a participant
      const isParticipant = chat.participants.some(
        (p) => p.toString() === req.user._id.toString()
      );

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const { content, type = 'text', mediaUrl = '' } = req.body;

      const message = await Message.create({
        chat: chat._id,
        sender: req.user._id,
        content,
        type,
        mediaUrl,
      });

      // Update chat's last message
      chat.lastMessage = message._id;
      chat.lastMessageAt = new Date();
      await chat.save();

      const populatedMessage = await Message.findById(message._id).populate(
        'sender',
        'name email avatar'
      );

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        if (chat.type === 'group' && chat.groupId) {
          io.to(`group-${chat.groupId}`).emit('receive-message', {
            message: populatedMessage,
            chatId: chat._id,
          });
        } else {
          // Direct or Booking chat
          io.to(`chat-${chat._id}`).emit('receive-message', {
            message: populatedMessage,
            chatId: chat._id,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: populatedMessage,
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

module.exports = router;

