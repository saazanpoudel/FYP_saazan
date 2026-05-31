const express = require('express');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/notifications
// @desc    Clear all notifications
// @access  Private
router.delete('/', protect, async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });
        res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
