const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const SOS = require('../models/SOS');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { createNotification } = require('../utils/notify');

const router = express.Router();

// @route   POST /api/emergency/sos
// @desc    Broadcast and Save emergency SOS alert
// @access  Private
router.post('/sos', protect, async (req, res) => {
    try {
        const { location, message, emergencyType, bookingId, packageId } = req.body;

        // Check if user already has an active SOS
        const activeSOS = await SOS.findOne({ user: req.user._id, status: 'active' });
        if (activeSOS) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active SOS broadcast. Please resolve the current one before sending a new alert.'
            });
        }

        // Save to Database
        const sos = await SOS.create({
            user: req.user._id,
            booking: bookingId,
            package: packageId,
            location,
            emergencyType,
            message
        });

        // Broadcast via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('emergency-alert', {
                sosId: sos._id,
                userId: req.user._id,
                userName: req.user.name,
                location,
                emergencyType,
                message: message || 'EMERGENCY: Assistance needed immediately!',
                timestamp: new Date()
            });
        }

        // Notify All Admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await createNotification(req.app, {
                recipient: admin._id,
                sender: req.user._id,
                type: 'emergency',
                title: '🚨 HIGH ALERT: EMERGENCY SOS',
                message: `${req.user.name} has triggered an SOS for ${emergencyType || 'an emergency'}. Assistance required immediately!`,
                extraData: { sosId: sos._id, location }
            });
        }

        res.json({
            success: true,
            message: 'SOS Alert broadcasted to emergency responders and recorded in system.',
            sos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send SOS alert',
            error: error.message
        });
    }
});

// @route   GET /api/emergency/active
// @desc    Get user's active SOS alert
// @access  Private
router.get('/active', protect, async (req, res) => {
    try {
        const sos = await SOS.findOne({ user: req.user._id, status: 'active' })
            .populate('package', 'title destination');
        res.json({ success: true, sos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to check active SOS' });
    }
});

// @route   GET /api/emergency/alerts
// @desc    Get all active SOS alerts
// @access  Private/Admin
router.get('/alerts', protect, authorize('admin'), async (req, res) => {
    try {
        const alerts = await SOS.find({ status: 'active' })
            .populate('user', 'name email phone')
            .populate('package', 'title destination')
            .sort({ createdAt: -1 });

        res.json({ success: true, alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
    }
});

// @route   PATCH /api/emergency/alerts/:id/resolve
// @desc    Resolve an SOS alert
// @access  Private
router.patch('/alerts/:id/resolve', protect, async (req, res) => {
    try {
        const sos = await SOS.findById(req.params.id);
        
        // Only allow admin or the user who created it to resolve/cancel
        if (req.user.role !== 'admin' && sos.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const resolvedBy = req.user._id;
        sos.status = 'resolved';
        await sos.save();

        // Notify the user who raised the SOS (if resolved by admin)
        if (req.user.role === 'admin') {
            await createNotification(req.app, {
                recipient: sos.user,
                sender: resolvedBy,
                type: 'emergency',
                title: 'SOS Alert Resolved',
                message: 'Your emergency SOS alert has been marked as resolved by the admin. If you still need assistance, please contact emergency services or raise a new alert.',
                extraData: { sosId: sos._id }
            });
        }

        res.json({ success: true, message: 'Alert marked as resolved' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to resolve alert' });
    }
});

module.exports = router;



